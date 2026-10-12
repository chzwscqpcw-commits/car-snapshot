import type { ReportInput } from "@/lib/generateReport";
import { html, type Safe } from "../html";
import type { ThemeTokens } from "../theme";
import { num, parseDate, shortDate } from "../format";
import { BODY_HEIGHT, CONTINUED_ROOM, type Block, pageShell, paginate, textHeight } from "./shared";

// 05 · The details: the DVLA spec sheet, then fact cards (tax, fuel, ULEZ,
// recalls, safety, rarity, colour, eco, EV). Everything the old report's
// details table and "key insights" carried. Continues onto more pages if needed.

type Card = { title: string; tone: string; lines: string[] };

const date = (s?: string | null) => {
  const d = parseDate(s);
  return d ? shortDate(d) : undefined;
};

function specRows(input: ReportInput): Array<[string, string]> {
  const d = input.data;
  const rows: Array<[string, string | number | undefined | null]> = [
    ["Registration", d.registrationNumber],
    ["Make", d.make],
    ["Model", d.model],
    ["Variant", d.variant],
    ["Body style", input.parsedModel?.bodyStyle],
    ["Trim", input.parsedModel?.trim],
    ["Drive", input.parsedModel?.driveType],
    ["Colour", d.colour],
    ["Year of manufacture", d.yearOfManufacture],
    ["First registered", d.monthOfFirstRegistration || date(d.dateOfFirstRegistration)],
    ["Fuel", d.fuelType],
    ["Engine", d.engineCapacity ? `${num(d.engineCapacity)} cc` : undefined],
    ["CO2 emissions", d.co2Emissions ? `${d.co2Emissions} g/km` : undefined],
    ["Euro status", d.euroStatus],
    ["Real driving emissions", d.realDrivingEmissions != null ? `RDE2 step ${d.realDrivingEmissions}` : undefined],
    ["Tax status", d.taxStatus],
    ["Tax due", date(d.taxDueDate)],
    ["Additional rate ends", date(d.additionalRateEndDate)],
    ["MOT status", d.motStatus],
    ["MOT expires", date(d.motExpiryDate)],
    ["Wheelplan", d.wheelplan],
    ["Revenue weight", d.revenueWeight ? `${num(d.revenueWeight)} kg` : undefined],
    ["Type approval", d.typeApproval],
    ["Last V5C issued", date(d.dateOfLastV5CIssued)],
    ["Marked for export", d.markedForExport != null ? (d.markedForExport ? "Yes" : "No") : undefined],
    ["Tyre sizes", input.tyreSizes?.sizes.join(", ")],
    ["Bolt pattern", input.tyreSizes?.boltPattern],
    ["Centre bore", input.tyreSizes?.centrebore],
    ["Length × width × height", input.vehicleDimensions ? `${num(input.vehicleDimensions.lengthMm)} × ${num(input.vehicleDimensions.widthMm)} × ${num(input.vehicleDimensions.heightMm)} mm` : undefined],
    ["Wheelbase", input.vehicleDimensions ? `${num(input.vehicleDimensions.wheelbaseMm)} mm` : undefined],
    ["Kerb weight", input.vehicleDimensions ? `${num(input.vehicleDimensions.kerbWeightKg)} kg` : undefined],
    ["Boot", input.vehicleDimensions ? `${input.vehicleDimensions.bootLitres} litres` : undefined],
  ];
  return rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => [k, String(v)]);
}

const RARITY: Record<string, string> = { "very-rare": "Very rare", rare: "Rare", uncommon: "Uncommon", common: "Common", "very-common": "Very common" };

function cards(input: ReportInput, t: ThemeTokens): Card[] {
  const out: Card[] = [];
  const ved = input.vedResult;
  if (ved && ved.estimatedAnnualRate !== null) {
    out.push({
      title: "Road tax",
      tone: t.accent,
      lines: [
        `About £${ved.estimatedAnnualRate} a year${ved.estimatedSixMonthRate != null ? ` (£${ved.estimatedSixMonthRate.toFixed(2)} for six months)` : ""}`,
        ved.band ? `Band ${ved.band}` : "",
        ved.details ? `${ved.details.split(".")[0]}.` : "",
      ].filter(Boolean),
    });
  }
  const fe = input.fuelEconomy;
  const fp = input.fuelPrices;
  if (fe && fe.combinedMpg > 0) {
    out.push({
      title: "Fuel economy",
      tone: t.accent,
      lines: [
        `${fe.combinedMpg.toFixed(1)} mpg combined`,
        [fe.urbanMpg ? `${fe.urbanMpg.toFixed(1)} urban` : "", fe.extraUrbanMpg ? `${fe.extraUrbanMpg.toFixed(1)} extra-urban` : ""].filter(Boolean).join(" · "),
        `About £${num(fe.estimatedAnnualCost)} a year in fuel`,
        fp && (fp.petrol > 0 || fp.diesel > 0) ? `Pump prices: ${fp.petrol.toFixed(1)}p petrol, ${fp.diesel.toFixed(1)}p diesel` : "",
      ].filter(Boolean),
    });
  } else if (fp && (fp.petrol > 0 || fp.diesel > 0)) {
    out.push({ title: "Fuel prices", tone: t.accent, lines: [`Petrol ${fp.petrol.toFixed(1)}p a litre`, `Diesel ${fp.diesel.toFixed(1)}p a litre`, `UK average${fp.date ? ` on ${date(fp.date)}` : ""}`] });
  }
  const ulez = input.ulezResult;
  if (ulez && ulez.status !== "unknown") {
    const ok = ulez.status === "compliant" || ulez.status === "exempt";
    const charging = (ulez.cleanAirZones ?? []).filter((z) => z.carsCharged !== false);
    out.push({
      title: `ULEZ: ${ulez.status === "exempt" ? "exempt" : ok ? "compliant" : "not compliant"}`,
      tone: ok ? t.good : t.risk,
      lines: [ulez.reason, ...(!ok ? charging.slice(0, 6).map((z) => `${z.name}: ${z.dailyCharge} a day`) : [])].filter(Boolean),
    });
  }
  const recalls = input.recalls ?? [];
  if (input.recalls) {
    out.push({
      title: recalls.length === 0 ? "Safety recalls: none" : `Safety recalls: ${recalls.length}`,
      tone: recalls.length === 0 ? t.good : t.risk,
      lines: recalls.length === 0
        ? ["No safety recalls on record for this model."]
        : recalls.slice(0, 4).flatMap((r) => [`${r.recallNumber} (${r.recallDate}): ${r.defect}`, r.remedy ? `Fix: ${r.remedy}` : ""]).filter(Boolean)
          .concat(recalls.length > 0 ? ["Recall work is free at a franchised dealer. Ask whether it has been done."] : []),
    });
  }
  const nc = input.ncapRating;
  if (nc && nc.overallStars > 0) {
    const scores = [
      nc.adultOccupant != null ? `adult ${nc.adultOccupant}%` : "",
      nc.childOccupant != null ? `child ${nc.childOccupant}%` : "",
      nc.pedestrian != null ? `pedestrian ${nc.pedestrian}%` : "",
      nc.safetyAssist != null ? `safety assist ${nc.safetyAssist}%` : "",
    ].filter(Boolean);
    out.push({ title: "Euro NCAP", tone: nc.overallStars >= 4 ? t.good : t.warn, lines: [`${nc.overallStars} of 5 stars, tested ${nc.yearTested}`, scores.length ? `Scores: ${scores.join(", ")}` : ""].filter(Boolean) });
  }
  const pr = input.motPassRate;
  if (pr) {
    out.push({
      title: "Model MOT pass rate",
      tone: pr.aboveAverage ? t.good : t.warn,
      lines: [`${pr.passRate}% first-time pass rate (UK ${pr.nationalAverage}%)`, `From ${num(pr.testCount)} tests`, pr.commonFailureReasons?.length ? `Most common failures: ${pr.commonFailureReasons.join(", ").toLowerCase()}` : ""].filter(Boolean),
    });
  }
  const r = input.rarityResult;
  if (r && r.total > 0) {
    out.push({ title: `On UK roads: ${(RARITY[r.category] ?? r.category).toLowerCase()}`, tone: t.accent, lines: [`${num(r.licensed)} licensed, ${num(r.sorn)} off the road (SORN)`] });
  }
  const cp = input.colourPopularity;
  if (cp && input.data.colour) {
    out.push({ title: `Colour: ${input.data.colour.toLowerCase()}`, tone: t.accent, lines: [`${cp.label}: ${cp.share}% of new cars, number ${cp.rank} in the UK`] });
  }
  const eco = input.ecoScore;
  if (eco) {
    out.push({ title: `Eco score: ${eco.grade}`, tone: eco.grade <= "B" ? t.good : eco.grade <= "D" ? t.accent : t.warn, lines: [`${eco.label}, ${eco.score} out of 100`, ...eco.factors.map((f) => `${f.name}: ${f.detail}`)] });
  }
  const ev = input.evSpecs;
  if (ev) {
    out.push({
      title: "Electric car",
      tone: t.accent,
      lines: [`${ev.batteryKwh} kWh battery, ${ev.rangeWltp} miles WLTP range`, ev.chargeFast ? `Rapid charging: ${ev.chargeFast}` : "", ev.chargeSlow ? `Home charging: ${ev.chargeSlow}` : "", ev.motorKw ? `${ev.motorKw} kW (${Math.round(ev.motorKw * 1.341)} bhp)${ev.driveType ? `, ${ev.driveType}` : ""}` : ""].filter(Boolean),
    });
  }
  // Theft risk sits on the verdict page; only repeat it here if there's no verdict.
  const tr = input.theftRisk;
  if (tr && !input.healthScore) {
    out.push({ title: "Theft risk", tone: tr.riskCategory.includes("high") ? t.risk : t.warn, lines: [`${tr.theftsPer1000} per 1,000 of this model stolen a year (${tr.rateMultiplier}× the UK average for ${tr.fleet})`] });
  }
  return out;
}

const CARD_W = 321; // half the content width, less the gap

function cardHeight(c: Card): number {
  // Rule + title ≈ 38px, then each line; calibrated against renders.
  return 38 + c.lines.reduce((s, l) => s + textHeight(l, CARD_W - 4, 13, 1.45) + 4, 0);
}

function cardHtml(c: Card, t: ThemeTokens): Safe {
  return html`<div class="card" style="border-color:${t.rule}">
    <div class="card-title"><i style="background:${c.tone}"></i><span>${c.title}</span></div>
    ${c.lines.map((l) => html`<p style="color:${t.soft}">${l}</p>`)}
  </div>`;
}

export function detailPages(input: ReportInput, t: ThemeTokens, firstFolio: number): Safe[] {
  const spec = specRows(input);
  const cs = cards(input, t);
  const blocks: Block[] = [];
  if (spec.length) {
    const half = Math.ceil(spec.length / 2);
    const col = (rows: Array<[string, string]>) => html`<dl class="spec">${rows.map(([k, v]) => html`<div style="border-color:${t.rule}"><dt style="color:${t.muted}">${k}</dt><dd>${v}</dd></div>`)}</dl>`;
    blocks.push({
      h: 40 + half * 28, // heading + rows of 13px text with 6px padding
      html: html`<div class="stack-10"><h2 class="eyebrow underline" style="border-color:${t.ruleStrong}">VEHICLE RECORD</h2><div class="spec-cols">${col(spec.slice(0, half))}${col(spec.slice(half))}</div></div>`,
    });
  }
  if (cs.length) {
    blocks.push({ h: 58, html: html`<h2 class="eyebrow underline section-top" style="border-color:${t.ruleStrong}">GOOD TO KNOW</h2>` });
    for (let i = 0; i < cs.length; i += 2) {
      const pair = cs.slice(i, i + 2);
      blocks.push({ h: Math.max(...pair.map(cardHeight)) + 12, html: html`<div class="card-row">${pair.map((c) => cardHtml(c, t))}</div>` });
    }
  }
  if (blocks.length === 0) return [];
  const pages = paginate(blocks, BODY_HEIGHT - 64 - 28, CONTINUED_ROOM);
  return pages.map((content, i) =>
    pageShell(t, input, "The details", firstFolio + i, html`${i === 0 ? html`<h1 class="display h-page">On the record.</h1>` : html`<h2 class="display h-cont">The details, continued</h2>`}<div class="stack-0">${content}</div>`),
  );
}
