import type { ReportInput } from "@/lib/generateReport";
import { html, raw, type Safe } from "../html";
import type { ThemeTokens } from "../theme";
import { formatPlate, monthYear, num, parseDate, shortDate, titleCase, vehicleNoun } from "../format";

const BOLT_PATH = "M300 0 L40 430 L230 430 L150 760 L480 290 L280 290 L360 0 Z";

const FUEL_WORDS: Record<string, string> = {
  PETROL: "petrol",
  DIESEL: "diesel",
  ELECTRICITY: "electric",
  ELECTRIC: "electric",
  "HYBRID ELECTRIC": "hybrid",
  "PETROL/ELECTRIC": "hybrid",
  "DIESEL/ELECTRIC": "hybrid",
};

/** One factual sentence for the cover, built only from data the report carries. */
export function coverSummary(input: ReportInput, now: Date): string {
  const d = input.data;
  const parts: string[] = [];
  const age = d.yearOfManufacture ? now.getUTCFullYear() - d.yearOfManufacture : null;
  const fuel = d.fuelType ? FUEL_WORDS[d.fuelType.toUpperCase()] ?? d.fuelType.toLowerCase() : null;
  const noun = vehicleNoun(d, input.parsedModel?.bodyStyle);
  const body = noun === "car" ? input.parsedModel?.bodyStyle?.toLowerCase() ?? "car" : noun;
  const subject = [age !== null ? `${age}-year-old` : null, fuel, body].filter(Boolean).join(" ");
  parts.push(`A ${subject}`);

  const tests = d.motTests ?? [];
  const latest = tests[0];
  const latestDate = parseDate(latest?.completedDate);
  if (tests.length > 0 && latest && latestDate) {
    const verb = latest.testResult === "PASSED" ? "a pass" : latest.testResult === "FAILED" ? "a fail" : "a test";
    parts.push(` with ${tests.length} MOT${tests.length === 1 ? "" : "s"} on record, the latest ${verb} in ${monthYear(latestDate)}`);
  } else if (tests.length === 0) {
    parts.push(" with no MOT history yet");
  }

  const advisories = input.motReadiness?.advisoryCount ?? 0;
  const firstArea = input.motReadiness?.riskItems?.[0]?.categoryLabel;
  if (advisories > 0) {
    const what = advisories === 1 ? "one open advisory" : `${advisories} open advisories`;
    parts.push(firstArea ? `, and ${what}: ${firstArea.toLowerCase()}` : `, and ${what}`);
  }
  return parts.join("") + ".";
}

type Vital = { label: string; value: string; sub: string; color: string };

function vitals(input: ReportInput, t: ThemeTokens, now: Date): Vital[] {
  const d = input.data;
  const out: Vital[] = [];

  const motExpiry = parseDate(d.motExpiryDate);
  const motExpired = motExpiry ? motExpiry.getTime() < now.getTime() : false;
  const motValid = (d.motStatus ?? "").toLowerCase() === "valid" && !motExpired;
  out.push({
    label: "MOT",
    value: motValid ? "Valid" : motExpired ? "Expired" : d.motStatus ?? "Unknown",
    sub: motExpiry ? `${motExpired ? "on" : "to"} ${shortDate(motExpiry)}` : "No expiry on record",
    color: motValid ? t.good : t.risk,
  });

  const tax = (d.taxStatus ?? "Unknown").trim();
  const taxDue = parseDate(d.taxDueDate);
  const taxed = tax.toLowerCase() === "taxed";
  out.push({
    label: "TAX",
    value: tax,
    sub: taxDue ? `${taxed ? "to" : "due"} ${shortDate(taxDue)}` : "",
    color: taxed ? t.good : tax.toLowerCase() === "sorn" ? t.warn : t.risk,
  });

  const latestMiles = input.motInsights?.latestMileage ?? null;
  const latestDate = parseDate(d.motTests?.[0]?.completedDate);
  out.push({
    label: "MILEAGE",
    value: latestMiles !== null ? num(latestMiles) : "—",
    sub: latestMiles !== null && latestDate ? `at ${monthYear(latestDate)} MOT` : "No MOT reading yet",
    color: t.ink,
  });

  if (input.healthScore) {
    out.push({ label: "GRADE", value: `${input.healthScore.grade} · ${input.healthScore.score}`, sub: "out of 100", color: t.accent });
  } else {
    const n = d.motTests?.length ?? 0;
    out.push({ label: "MOT TESTS", value: String(n), sub: "on record", color: t.ink });
  }
  return out;
}

/** A contents entry: the page a section starts on, and a one-line teaser. */
export type ContentsLine = { page: number; title: string; text: string };

export function coverPage(input: ReportInput, t: ThemeTokens, now: Date, lines: ContentsLine[]): Safe {
  const d = input.data;
  const make = titleCase(d.make);
  const modelWords = titleCase(d.model).split(" ").filter(Boolean);
  const [firstModel, ...restModel] = modelWords;

  return html`<section class="page" style="background:${t.bg};color:${t.ink}">
  <svg aria-hidden="true" width="445" height="650" viewBox="0 0 520 760" style="position:absolute;right:-125px;top:215px">
    <path d="${raw(BOLT_PATH)}" fill="none" stroke="${t.accent}" stroke-width="1.5" opacity="${t.boltStroke}"/>
    <path d="${raw(BOLT_PATH)}" fill="${t.accent}" opacity="${t.boltFill}"/>
  </svg>
  <div class="pad cover">
    <header class="masthead">
      <div class="brand">
        <svg aria-hidden="true" width="18" height="26" viewBox="0 0 18 26"><path d="M11 0 L1 15 L8 15 L5 26 L17 10 L10 10 L13 0 Z" fill="${t.accent}"/></svg>
        <span>FREE PLATE CHECK</span>
      </div>
      <span class="mono small" style="color:${t.muted}">VEHICLE REPORT · ${shortDate(now).toUpperCase()}</span>
    </header>
    <div class="rule" style="background:${t.rule}"></div>

    <div class="hero">
      <div class="plate" style="box-shadow:${t.plateShadow}">${formatPlate(d.registrationNumber)}</div>
      <h1 class="display cover-title">${d.yearOfManufacture ?? ""} ${make}${firstModel ? html` <em style="color:${t.accent}">${firstModel}</em>` : ""}${restModel.length ? ` ${restModel.join(" ")}` : ""}</h1>
      <p class="deck" style="color:${t.soft}">${coverSummary(input, now)}</p>
    </div>

    <div class="grow"></div>

    <ol class="contents">
      ${lines.map(
        (l) => html`<li>
        <span class="mono" style="color:${t.accent}">${String(l.page).padStart(2, "0")}</span>
        <div><span class="display contents-title">${l.title}</span><span class="contents-text" style="color:${t.muted}">${l.text}</span></div>
      </li>`,
      )}
    </ol>

    <div class="vitals" style="border-color:${t.rule}">
      ${vitals(input, t, now).map(
        (v) => html`<div class="vital">
        <span class="mono label" style="color:${t.muted}">${v.label}</span>
        <span class="vital-value" style="color:${v.color}">${v.value}</span>
        <span class="vital-sub" style="color:${t.muted}">${v.sub}</span>
      </div>`,
      )}
    </div>

    <footer class="foot mono" style="color:${t.muted}">
      <span>FREEPLATECHECK.CO.UK</span>
      <span>DVLA · DVSA DATA</span>
    </footer>
  </div>
</section>`;
}
