/**
 * Assertions for the "Buying a used {model}" section on /cars/[make]/[model]
 * (src/lib/model-buying-checks.ts), run against the REAL model registry as
 * well as hand-built inputs — the section has to hold up on all 154 pages,
 * including models with no DVSA failure data.
 */
import { buildModelBuyingChecks, buyingChecksFaqAnswer } from "../src/lib/model-buying-checks";
import { MODEL_REGISTRY, getModelGuideData } from "../src/lib/model-guides";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

const BASE = {
  displayModel: "Focus",
  motPassRate: null,
  theftRisk: null,
  recalls: [],
  rarity: null,
  isEv: false,
} as Parameters<typeof buildModelBuyingChecks>[0];
const ids = (over: Partial<typeof BASE>) => buildModelBuyingChecks({ ...BASE, ...over }).map((c) => c.id);

console.log("\nHand-built inputs:");
check("bare model still gets the hidden-history check", ids({}).join(","), "hidden-history");
check("hidden-history is always last",
  ids({ isEv: true, recalls: [{} as never] }).at(-1), "hidden-history");
check("failure areas listed with 'and'",
  buildModelBuyingChecks({ ...BASE, motPassRate: {
    passRate: 70, testCount: 1000, aboveAverage: false, nationalAverage: 71.5,
    commonFailureReasons: ["Suspension", "Tyres", "Brakes", "Lighting"],
  } })[0].title, "Where the Focus fails its MOT: suspension, tyres and brakes");
check("below-average pass rate is a warn",
  buildModelBuyingChecks({ ...BASE, motPassRate: {
    passRate: 70, testCount: 1000, aboveAverage: false, nationalAverage: 71.5, commonFailureReasons: ["Tyres"],
  } })[0].tone, "warn");
check("low theft risk adds nothing",
  ids({ theftRisk: { riskCategory: "low" } as never }).includes("theft"), false);
check("high theft risk is flagged",
  ids({ theftRisk: { riskCategory: "high", theftsPer1000: 4, rateMultiplier: 2.6 } as never }).includes("theft"), true);
check("common model gets no rarity note",
  ids({ rarity: { licensed: 50000, sorn: 1000, total: 51000, category: "common" } }).includes("rarity"), false);
check("EV gets the battery check", ids({ isEv: true }).includes("ev-battery"), true);

console.log("\nEvery registry model:");
let pages = 0, withAreas = 0, empty = 0, badText = 0;
for (const m of MODEL_REGISTRY) {
  const d = getModelGuideData(m.makeSlug, m.modelSlug);
  if (!d) continue;
  pages++;
  const checks = buildModelBuyingChecks(d);
  if (checks.some((c) => c.id === "mot-failure-areas")) withAreas++;
  if (checks.length === 0) empty++;
  const text = checks.map((c) => c.title + c.detail).join(" ") + buyingChecksFaqAnswer(d);
  if (/undefined|NaN|null/.test(text)) badText++;
  if (d.faq[0]?.question !== `What should I check when buying a used ${d.displayName}?`) badText++;
}
check("no page renders an empty section", empty, 0);
check("no 'undefined'/'NaN'/'null' in any copy, buying FAQ leads", badText, 0);
check("most pages have DVSA failure areas (>=90)", withAreas >= 90, true);
console.log(`  (${pages} pages, ${withAreas} with failure areas)`);

if (failures > 0) {
  console.error(`\n${failures} model-buying-check(s) failed`);
  process.exit(1);
}
console.log("\nAll model-buying checks passed");
