// Formatting helpers for the report template. Deterministic (no locale or
// timezone surprises between the server and a local run).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "AB12CDE" → "AB12 CDE" for current-format plates; others unchanged. */
export function formatPlate(reg: string): string {
  const r = reg.toUpperCase().replace(/\s+/g, "");
  return /^[A-Z]{2}\d{2}[A-Z]{3}$/.test(r) ? `${r.slice(0, 4)} ${r.slice(4)}` : r;
}

/** Title-case a DVLA make/model word: BMW, 320D and M stay; SPORT → Sport. */
export function titleWord(w: string): string {
  if (w.includes("-")) return w.split("-").map(titleWord).join("-");
  if (w.length <= 3 || /\d/.test(w)) return w;
  return w[0] + w.slice(1).toLowerCase();
}

export function titleCase(s: string | undefined): string {
  return (s ?? "").trim().split(/\s+/).filter(Boolean).map(titleWord).join(" ");
}

/** Title-case each hyphen-separated part ("F-PACE" → "F-Pace"); parts of 3 or fewer letters stay as written ("CX-30", "C-MAX"). */
function nameWord(w: string): string {
  return w.split("-").map((part) => titleCase(part)).join("-");
}

/** Model words that are only half a name: "MODEL 3", "GRAND C-MAX", "SANTA FE". */
const JOINERS = new Set(["MODEL", "GRAND", "SANTA", "LAND"]);
const MERCEDES_CLASSES = new Set(["A", "B", "C", "E", "S", "G"]);

/**
 * "Ford Focus" from a make and the full model string DVLA/MOT hand us, which
 * runs to "ZS EXCLUSIVE VTI-TECH" or "R ROVER EVOQUE RDYN SE DMHEV A". Keeps
 * the model's name and drops the trim. Rules came from the 2,355 make/model
 * pairs valued in the 30 days to 28 Oct 2026 — see test-wbac-link.ts.
 * Undefined when the make is unknown.
 */
export function shortVehicleName(make: string | undefined | null, model: string | undefined | null): string | undefined {
  const makeWords = (make ?? "").toUpperCase().replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  if (makeWords.length === 0) return undefined;
  const makeName = makeWords.map(nameWord).join(" ");

  let words = (model ?? "").toUpperCase().replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.join(" ") === "N/A" || words.some((w) => w.includes("CARAVAN"))) words = [];
  // "MAZDA 2 HYBRID", "POLESTAR 2", "MINI COOPER": the make repeated.
  if (words[0] === makeWords[makeWords.length - 1]) words = words.slice(1);
  if (words.length === 0) return makeName;

  let name: string[];
  if (words[0] === "R" && words[1] === "ROVER") words = ["RANGE", ...words.slice(1)];
  if (words[0] === "RANGE" && words[1] === "ROVER") {
    // Said without the make: "Range Rover Evoque", not "Land Rover Range Rover".
    const sub = /^(EVOQUE|VELAR|SPORT)$/.test(words[2] ?? "") ? ` ${nameWord(words[2])}` : "";
    return `Range Rover${sub}`;
  } else if (makeWords[0].startsWith("MERCEDES") && MERCEDES_CLASSES.has(words[0])) {
    return `${makeName} ${words[0]}-Class`;
  } else if (JOINERS.has(words[0]) && words[1]) {
    name = words.slice(0, 2);
  } else if (/^(SERIES|CLASS)$/.test(words[1] ?? "")) {
    name = words.slice(0, 2);
  } else {
    name = words.slice(0, 1);
  }
  return `${makeName} ${name.map(nameWord).join(" ")}`;
}

export function parseDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "11 Apr 2027" */
export function shortDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Apr 2026" */
export function monthYear(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * What to call the vehicle in copy. DVLA's wheelplan and type approval tell
 * a motorbike (2 WHEEL / L-category) or a van (N1) from a car. The first real
 * vehicle rendered was a Ducati 1199, which the report called a "car".
 */
export function vehicleNoun(d: { wheelplan?: string; typeApproval?: string }, bodyStyle?: string | null): "car" | "motorbike" | "van" {
  const wheelplan = (d.wheelplan ?? "").toUpperCase();
  const approval = (d.typeApproval ?? "").toUpperCase();
  if (wheelplan.includes("2 WHEEL") || approval.startsWith("L")) return "motorbike";
  if (approval.startsWith("N1") || /\bvan\b/i.test(bodyStyle ?? "")) return "van";
  return "car";
}

/** For components holding a raw lookup record, whose DVLA fields are untyped. */
export function isMotorbike(v: object): boolean {
  const { wheelplan, typeApproval } = v as { wheelplan?: unknown; typeApproval?: unknown };
  return (
    vehicleNoun({
      wheelplan: typeof wheelplan === "string" ? wheelplan : undefined,
      typeApproval: typeof typeApproval === "string" ? typeApproval : undefined,
    }) === "motorbike"
  );
}

/**
 * For the same raw records: an N1 van, a body style that says "van", or a
 * model that only comes as a van. DVLA's type approval is often missing on
 * older vehicles, hence the model list. We Buy Any Car's affiliate programme
 * covers cars only (WBAC, 28 Oct 2026), so its offer must not show for one.
 */
export function isVan(v: object, bodyStyle?: string | null): boolean {
  const { wheelplan, typeApproval, model } = v as { wheelplan?: unknown; typeApproval?: unknown; model?: unknown };
  if (typeof model === "string" && VAN_ONLY_MODELS.test(model.trim())) return true;
  return (
    vehicleNoun(
      {
        wheelplan: typeof wheelplan === "string" ? wheelplan : undefined,
        typeApproval: typeof typeApproval === "string" ? typeApproval : undefined,
      },
      bodyStyle,
    ) === "van"
  );
}

/**
 * Models sold only (or almost only) as vans. Deliberately leaves out names
 * that also come as cars — Caddy, Berlingo, Partner, Doblo, Combo, Kangoo,
 * Transporter (Caravelle/Shuttle are passenger versions under the same name in
 * some records) — so a family MPV is never denied the offer.
 */
const VAN_ONLY_MODELS =
  /^(TRANSIT( (CUSTOM|CONNECT|COURIER))?|E-TRANSIT|CRAFTER|E-CRAFTER|VIVARO|MOVANO|TRAFIC|MASTER|SPRINTER|E-SPRINTER|CITAN|BOXER|RELAY|DUCATO|SCUDO|DISPATCH|PROACE|HIACE|NV200|NV300|NV400|PRIMASTAR|INTERSTAR|TALENTO|DAILY)\b/i;

/** Strip emoji and pictographs (e.g. "⚠️ " in engine warnings) the fonts can't draw. */
export function plainText(s: string): string {
  return s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/\s+-\s+/g, ": ").replace(/\s{2,}/g, " ").trim();
}

export function num(n: number): string {
  return Math.round(n).toLocaleString("en-GB");
}

export function pounds(n: number): string {
  return `£${num(n)}`;
}
