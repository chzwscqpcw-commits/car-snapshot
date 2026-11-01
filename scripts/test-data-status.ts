/**
 * The Friday email's "Data" section and the dashboard summary
 * (src/lib/data-status.ts), the monthly due list (scripts/data-due.ts) and
 * the failure-issue state machine (scripts/report-step-failures.ts): built
 * from fixtures, never from GitHub.
 *
 *   npx tsx scripts/test-data-status.ts
 */
import { DATASETS } from "../src/data/_registry";
import {
  buildDataStatus,
  fetchLatestRun,
  fetchReviewIssues,
  renderDataStatusHtml,
  renderDataSummaryLine,
  type JobRun,
} from "../src/lib/data-status";
import { dueWithin, renderDueMarkdown } from "./data-due";
import { dataProvenance, nextUpdateLabel, provenanceLine } from "../src/lib/data-provenance";
import { datasetByFile } from "../src/data/_registry";
import { anyFailing, nextState, parseOutcomes, parseState, renderBody } from "./report-step-failures";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

const NOW = Date.parse("2026-11-06T16:00:00Z");
const daysAgo = (n: number) => new Date(NOW - n * 864e5).toISOString();
const freshAll: Record<string, string> = Object.fromEntries(DATASETS.map((d) => [d.file, daysAgo(1)]));
const ok = (wf: string): JobRun => ({ workflow: wf, status: "success", conclusion: "success", date: "2026-11-01", url: `https://github.com/x/y/actions/runs/${wf}` });
const greenRuns = {
  "refresh-data.yml": ok("refresh-data.yml"),
  "refresh-prices.yml": ok("refresh-prices.yml"),
  "calibrate-valuations.yml": ok("calibrate-valuations.yml"),
};

console.log("all green");
const green = buildDataStatus({ nowMs: NOW, freshness: freshAll, runs: greenRuns, reviews: [] });
check("one row per dataset", green.rows.length === DATASETS.length);
check("nothing red, no summary", !green.red && green.summary === null);
check("no red line rendered", renderDataSummaryLine(green) === "");
check("the section says all is well", renderDataStatusHtml(green).includes("within their thresholds"));
check("a manual dataset shows its due date, a job dataset its last run", green.rows.find((r) => r.file === "theft-risk.json")?.nextDue === "2027-09-01" && green.rows.find((r) => r.file === "recalls.json")?.lastRun?.status === "success");

console.log("stale, failed, review");
const red = buildDataStatus({
  nowMs: NOW,
  freshness: { ...freshAll, "recalls.json": daysAgo(45) },
  runs: { ...greenRuns, "refresh-prices.yml": { workflow: "refresh-prices.yml", status: "failure", conclusion: "failure", date: "2026-11-04", url: "https://github.com/x/y/actions/runs/9" } },
  reviews: [{ title: "Data refresh needs review: 2026-11-01", url: "https://github.com/x/y/issues/7" }],
});
check("recalls is stale (45 days over a 30-day threshold)", red.rows.find((r) => r.file === "recalls.json")?.state === "stale");
check("the Wednesday job's datasets are failed", red.rows.filter((r) => r.state === "failed").map((r) => r.file).sort().join() === "ev-specs.json,new-prices.json");
check("summary names all three", red.red && /1 stale \(recalls\.json\)/.test(red.summary ?? "") && /1 job failed \(refresh-prices\.yml\)/.test(red.summary ?? "") && /1 refresh awaiting review/.test(red.summary ?? ""), red.summary);
const line = renderDataSummaryLine(red);
check("the red line links the review issue", line.includes("⚠") && line.includes("issues/7"));
const html = renderDataStatusHtml(red);
check("red rows are styled red and the failed run is linked", html.includes("color:#dc2626") && html.includes('href="https://github.com/x/y/actions/runs/9"'));
check("the review issue is in the section", html.includes("Data refresh needs review: 2026-11-01"));

console.log("due soon and unknown");
const AUG = Date.parse("2027-08-20T00:00:00Z");
const freshInAugust: Record<string, string> = Object.fromEntries(DATASETS.map((d) => [d.file, new Date(AUG - 864e5).toISOString()]));
const soon = buildDataStatus({ nowMs: AUG, freshness: freshInAugust, runs: greenRuns, reviews: [] });
check("the theft FOI is due (amber), not red", soon.rows.find((r) => r.file === "theft-stats.json")?.state === "due" && !soon.red);
check("the section lists the due hand runs", renderDataStatusHtml(soon).includes("Hand runs due within"));
const unknownRun = buildDataStatus({ nowMs: NOW, freshness: {}, runs: {}, reviews: [], note: "GitHub unreachable" });
check("no manifest date is unknown, not stale", unknownRun.rows.every((r) => r.state === "unknown") && !unknownRun.red);
check("the note is printed", renderDataStatusHtml(unknownRun).includes("GitHub unreachable"));

console.log("fetch, failing soft");
const mk = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body }) as unknown as Response;
async function fetchChecks() {
  const good = (async () => mk(200, { workflow_runs: [{ status: "completed", conclusion: "failure", updated_at: "2026-11-01T04:30:00Z", html_url: "https://github.com/x/y/actions/runs/1", event: "schedule" }] })) as unknown as typeof fetch;
  const run = await fetchLatestRun("refresh-data.yml", good, "x/y");
  check("a completed run is read with its conclusion and date", run.status === "failure" && run.date === "2026-11-01" && run.url?.endsWith("/1") === true);
  const limited = await fetchLatestRun("refresh-data.yml", (async () => mk(403, {})) as unknown as typeof fetch, "x/y");
  check("a rate limit is unknown, not a throw", limited.status === "unknown");
  const thrown = await fetchLatestRun("refresh-data.yml", (async () => { throw new Error("offline"); }) as unknown as typeof fetch, "x/y");
  check("a network error is unknown", thrown.status === "unknown");
  const issues = await fetchReviewIssues((async () => mk(200, [{ title: "Data refresh needs review: 2026-11-01", html_url: "u1" }, { title: "a PR", html_url: "u2", pull_request: {} }])) as unknown as typeof fetch, "x/y");
  check("issues are read and PRs skipped", issues.length === 1 && issues[0].url === "u1");
  check("an issues error is an empty list", (await fetchReviewIssues((async () => mk(500, {})) as unknown as typeof fetch, "x/y")).length === 0);
}

console.log("due list");
const nothing = dueWithin("2026-11-06", 45);
check("nothing due in November 2026", nothing.length === 0, nothing.map((r) => r.file));
check("the markdown says NOTHING_DUE first", renderDueMarkdown(nothing, "2026-11-06", 45).startsWith("NOTHING_DUE"));
const april = dueWithin("2027-04-20", 45);
const trio = ["mot-areas.json", "mot-failure-reasons.json", "mot-pass-rates.json"];
check("the MOT bulk trio is due in April 2027 (with whatever else falls in the window)", trio.every((f) => april.some((r) => r.file === f)), april.map((r) => r.file));
check("soonest first", april.every((r, i) => i === 0 || april[i - 1].dueInDays <= r.dueInDays));
const aprilMd = renderDueMarkdown(april, "2027-04-20", 45);
const motHeader = (aprilMd.match(/^### .*$/gm) ?? []).find((h) => h.includes("MOT first-time pass rates by model"));
check("the three share one block with the command and source link", !!motHeader && motHeader.includes("Top MOT failure areas by model") && motHeader.includes("MOT results by postcode area") && aprilMd.includes("process-mot-bulk.py") && aprilMd.includes("data.gov.uk"), motHeader);
const august = dueWithin("2027-08-01", 45);
check("the theft FOI is due in August 2027 and says to email the DVLA", august.some((r) => r.file === "theft-stats.json") && renderDueMarkdown(august, "2027-08-01", 45).includes("foi@dvla.gov.uk"));
const overdue = dueWithin("2027-10-01", 45);
check("an overdue dataset stays listed and is marked overdue", overdue.some((r) => r.file === "theft-risk.json" && r.dueInDays < 0) && renderDueMarkdown(overdue, "2027-10-01", 45).includes("overdue"));
check("a wider window reaches February's curated files", dueWithin("2026-11-06", 120).some((r) => r.file === "body-types.json"));

console.log("provenance line");
const manifest = { "theft-stats.json": "2026-10-12T19:36:33Z", "theft-risk.json": "2026-10-12T19:36:33Z", "recalls.json": "2026-11-01T11:15:11Z", "how-many-left.json": "2026-10-30T00:00:00Z" };
const theft = dataProvenance(["theft-stats.json", "theft-risk.json"], manifest);
check("the line reads date, source, next update", provenanceLine(theft) === "Data as of 12 October 2026 · Source DVLA FOI FOIR13058 ÷ DfT VEH0120 · Next update September 2027", provenanceLine(theft));
check("duplicate sources collapse to one", theft.sources.length === 1);
const mixed = dataProvenance(["recalls.json", "how-many-left.json"], manifest);
check("the oldest file sets the date and the cadence", mixed.asOf === "2026-10-30T00:00:00Z" && mixed.nextUpdate === "weekly" && mixed.sources.length === 2, mixed);
const insights = dataProvenance(["how-many-left.json", "mot-pass-rates.json", "theft-risk.json", "colour-popularity.json"], { ...manifest, "mot-pass-rates.json": "2026-10-11T00:00:00Z", "colour-popularity.json": "2026-06-08T00:00:00Z" });
check("with a hand-run file oldest, next update is its month, not the weekly job's", insights.asOfLabel === "8 June 2026" && insights.nextUpdate === "February 2027" && insights.covers === "2025 registrations", insights);
check("more than two sources are summarised", insights.sourcesLabel === "DfT VEH0120 and 3 others" && insights.sources.length === 4, insights.sourcesLabel);
check("a file with no manifest date gives no date", dataProvenance(["recalls.json"], {}).asOf === null);
check("a weekly job says weekly, a monthly one monthly, a hand run its month", nextUpdateLabel(datasetByFile("recalls.json")!) === "weekly" && nextUpdateLabel(datasetByFile("model-price-calibration.json")!) === "monthly" && nextUpdateLabel(datasetByFile("mot-pass-rates.json")!) === "May 2027" && nextUpdateLabel(datasetByFile("caz-zones.ts")!) === "when the source changes");
check("coversYear is carried for the pages that print it", theft.coversYear === 2025 && dataProvenance(["mot-pass-rates.json"], manifest).coversYear === 2023);

console.log("failure issue state");
const outcomes = parseOutcomes("DVSA recalls=failure;VCA fuel economy=success;Euro NCAP=skipped");
check("outcomes parse", outcomes.length === 3 && outcomes[0].step === "DVSA recalls" && outcomes[0].outcome === "failure");
let state = nextState({}, "Weekly Data Refresh", ["DVSA recalls"], "https://github.com/x/y/actions/runs/1", "2026-11-01");
check("a failure is failing", anyFailing(state));
const body = renderBody(state);
check("the body has the table and the state block", body.includes("| Weekly Data Refresh | ❌ DVSA recalls |") && body.includes("data-failure-state:"));
check("the state round-trips through the body", JSON.stringify(parseState(body)) === JSON.stringify(state));
state = nextState(parseState(body), "New-Car Price & EV Spec Refresh", [], "https://github.com/x/y/actions/runs/2", "2026-11-04");
check("a clean Wednesday does not clear a failing Sunday", anyFailing(state) && renderBody(state).includes("✅ all steps"));
state = nextState(state, "Weekly Data Refresh", [], "https://github.com/x/y/actions/runs/3", "2026-11-08");
check("a clean Sunday clears it", !anyFailing(state));
check("garbage bodies parse to empty", Object.keys(parseState("no marker here")).length === 0 && Object.keys(parseState(null)).length === 0);

fetchChecks().then(() => {
  if (failed) {
    console.error(`\n${failed} data-status check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll data-status checks passed");
});
