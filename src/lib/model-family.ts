// Collapse a DVLA make + model string into a model FAMILY key, e.g.
//   BMW "320D XDRIVE M SPORT MHEV AUTO"      -> "BMW|3 SERIES"
//   MERCEDES "AMG C 43 EDITION 4MATIC AUTO"  -> "MERCEDES-BENZ|C CLASS"
//   LAND ROVER "R ROVER EVOQUE RDYN SE D A"  -> "LAND ROVER|RANGE ROVER EVOQUE"
//   VOLVO "XC40 ULTIMATE B4 MHEV AUTO"       -> "VOLVO|XC40"
//
// Used to key the market calibration (src/data/model-price-calibration.json).
// DVLA model strings are free text — a trim, engine and gearbox appended to a
// model name, in whatever spelling the manufacturer registered — so an exact
// or prefix match against a price table misses a third of real valuations.
// Pure, so scripts/test-model-family.ts can pin each rule.

function normMake(make: string): string {
  const m = make.toUpperCase().replace(/\s+/g, " ").trim();
  if (m === "MERCEDES" || m === "MERCEDES BENZ") return "MERCEDES-BENZ";
  return m;
}

const TWO_WORD_FAMILY =
  /^(DISCOVERY SPORT|TRANSIT (?:CUSTOM|CONNECT|COURIER)|GRAND \S+|C4 (?:PICASSO|CACTUS)|SANTA FE|LAND CRUISER|IONIQ \d|MODEL [3SXY]|ID\.? ?\d)\b/;

export function modelFamily(make: string, model: string): string | null {
  if (!make || !model) return null;
  const mk = normMake(make);
  let m = model.toUpperCase().replace(/\s+/g, " ").trim();
  if (!m) return null;

  if (mk === "LAND ROVER") {
    m = m.replace(/^R(?:ANGE)?[\s-]ROVER\b/, "RANGE ROVER");
    if (/^EVOQUE\b/.test(m)) return `${mk}|RANGE ROVER EVOQUE`;
    const rr = m.match(/^RANGE ROVER(?: (EVOQUE|SPORT|VELAR))?\b/);
    if (rr) return `${mk}|RANGE ROVER${rr[1] ? ` ${rr[1]}` : ""}`;
  }

  if (mk === "MERCEDES-BENZ") {
    const x = m.replace(/^MERCEDES[\s-]BENZ\s*/, "").replace(/^AMG\s+/, "");
    const cls =
      x.match(/^(GL[A-Z]|CL[A-Z]?|SL[A-Z]?|EQ[A-Z]{1,2}|[A-Z])[\s-]?(?:CLASS\b|\d)/) ??
      x.match(/^([A-Z])$/);
    if (cls) return `${mk}|${cls[1]} CLASS`;
  }

  if (mk === "BMW") {
    const series = m.match(/^(\d)(?:\d\d|\sSERIES\b)/);
    if (series) return `${mk}|${series[1]} SERIES`;
    const named = m.match(/^(IX\d?|I\d|X\d|Z\d|M\d)\b/);
    if (named) return `${mk}|${named[1]}`;
  }

  const two = m.match(TWO_WORD_FAMILY);
  if (two) return `${mk}|${two[1].replace(/^ID\.? ?/, "ID")}`;

  const first = m.split(" ")[0].replace(/!$/, "");
  return `${mk}|${first}`;
}
