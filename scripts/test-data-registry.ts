/**
 * The dataset registry (src/data/_registry.ts) must describe every file in
 * src/data/ and nothing else, every entry must point at a validator that
 * exists and a refresh method that exists, and the delta engine must classify
 * a shrink as review, a halving as fail and an unchanged file as ok.
 *
 *   npx tsx scripts/test-data-registry.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DATASETS, datasetByFile, workflowOf } from "../src/data/_registry";
import { VALIDATORS, deltaCheck, loadJSON, overallStatus, renderMarkdownReport, validateAll } from "./lib/validators";

const ROOT = process.cwd();
let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

console.log("registry ↔ src/data");
const onDisk = readdirSync(join(ROOT, "src", "data"))
  .filter((f) => (f.endsWith(".json") || f.endsWith(".ts")) && !f.startsWith("_"))
  .sort();
const registered = DATASETS.map((d) => d.file).sort();
check("every file in src/data is registered", onDisk.every((f) => registered.includes(f)), onDisk.filter((f) => !registered.includes(f)));
check("every registered file exists", registered.every((f) => onDisk.includes(f)), registered.filter((f) => !onDisk.includes(f)));
check("no duplicate entries", new Set(registered).size === registered.length);
check("kind matches the extension", DATASETS.every((d) => (d.kind === "json") === d.file.endsWith(".json")));

console.log("every entry is complete");
check("every validator name resolves", DATASETS.every((d) => typeof VALIDATORS[d.validator] === "function"), DATASETS.filter((d) => !VALIDATORS[d.validator]).map((d) => d.validator));
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")) as { crons: { path: string }[] };
const badMethods = DATASETS.filter((d) => {
  const wf = workflowOf(d);
  if (wf) return !existsSync(join(ROOT, ".github", "workflows", wf));
  if (d.method === "prebuild") return !pkg.scripts.prebuild;
  if (d.method.startsWith("vercel-cron:")) return !vercel.crons.some((c) => c.path === d.method.slice("vercel-cron:".length));
  return d.method !== "manual";
});
check("every method points at a workflow, the prebuild or a Vercel cron that exists", badMethods.length === 0, badMethods.map((d) => `${d.file}: ${d.method}`));
const manual = DATASETS.filter((d) => d.method === "manual");
check("every manual dataset has a due date or a due rule", manual.every((d) => d.nextDue || d.dueRule), manual.filter((d) => !d.nextDue && !d.dueRule).map((d) => d.file));
check("every due date is an ISO date", manual.every((d) => !d.nextDue || /^\d{4}-\d{2}-\d{2}$/.test(d.nextDue)));
check("every manual JSON dataset's hint names a script or a file to edit", manual.filter((d) => d.kind === "json").every((d) => /scripts\/|src\/data\//.test(d.refreshHint)));
check("every entry has a label, source name, threshold and at least one feed", DATASETS.every((d) => d.label && d.source.name && d.thresholdDays > 0 && d.feeds.length > 0));
check("source URLs are https", DATASETS.every((d) => d.source.url === null || d.source.url.startsWith("https://")));
check("JSON datasets have delta rules, modules do not", DATASETS.every((d) => (d.kind === "json") === (d.deltaRules !== null)), DATASETS.filter((d) => (d.kind === "json") !== (d.deltaRules !== null)).map((d) => d.file));
check("datasetByFile finds an entry", datasetByFile("recalls.json")?.label === "DVSA safety recalls");

console.log("shape validation of the committed files");
const shape = validateAll();
check("every dataset passes its shape check", overallStatus(shape) === "ok", shape.filter((r) => r.status !== "ok").map((r) => [r.file, r.errors]));
check("a broken shape fails", VALIDATORS.validateRecalls({ nope: true }).status === "fail");
check("too few entries fails", VALIDATORS.validateHowManyLeft({ "FORD|FIESTA": [1, 2] }).status === "fail");

console.log("delta classification");
const recalls = datasetByFile("recalls.json")!;
const current = loadJSON("recalls.json") as Record<string, unknown>[];
check("unchanged file is ok", deltaCheck(recalls, current, current).status === "ok");
const trimmed = current.slice(0, Math.floor(current.length * 0.85));
const review = deltaCheck(recalls, trimmed, current);
check("a 15% shrink is review, not fail", review.status === "review", review.notes);
check("the review names the lost keys", review.keysLost > 0 && review.lostSample.length > 0);
const halved = deltaCheck(recalls, current.slice(0, Math.floor(current.length / 2) - 10), current);
check("a halving is fail", halved.status === "fail", halved.notes);
const grown = deltaCheck(recalls, [...current, ...current.slice(0, 200)], current);
check("a small growth is ok", grown.status === "ok", grown.notes);

const hml = datasetByFile("how-many-left.json")!;
const hmlData = loadJSON("how-many-left.json") as Record<string, [number, number]>;
const fiestaGone = { ...hmlData, "FORD|FIESTA": [100, 10] as [number, number] };
const hmlDelta = deltaCheck(hml, fiestaGone, hmlData);
check("a headline figure collapsing is review", hmlDelta.status === "review" && hmlDelta.notes.some((n) => n.startsWith("FORD|FIESTA")), hmlDelta.notes);

const fuel = datasetByFile("fuel-prices-weekly.json")!;
const fuelData = loadJSON("fuel-prices-weekly.json") as { weekly: unknown[] };
const older = { ...fuelData, weekly: fuelData.weekly.slice(0, -1) };
const back = deltaCheck(fuel, older, fuelData);
check("the latest fuel week going backwards is fail", back.status === "fail", back.notes);

const areas = datasetByFile("mot-areas.json")!;
const areasData = loadJSON("mot-areas.json") as { year: number; national: { tests: number; passes: number }; areas: Record<string, unknown> };
const slipped = { ...areasData, national: { ...areasData.national, passes: Math.round(areasData.national.passes * 0.9) } };
check("the national pass rate moving 10% is review (band 5%)", deltaCheck(areas, slipped, areasData).status === "review");
check("a module has no delta", deltaCheck(datasetByFile("caz-zones.ts")!, null, null).status === "skipped");
check("no previous version is skipped, not fail", deltaCheck(recalls, current, null).status === "skipped");

console.log("report");
const md = renderMarkdownReport([{ ...shape[0], status: "review", reviews: ["entry count fell"], delta: review }], "origin/main");
check("the markdown report has the table and the overall status", md.includes("| Dataset | Status |") && md.includes("🟡 review") && md.includes("origin/main"));

if (failed) {
  console.error(`\n${failed} registry check(s) failed`);
  process.exit(1);
}
console.log("\nAll registry checks passed");
