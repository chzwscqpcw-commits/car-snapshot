/**
 * The state of every dataset, for the Friday audit email's "Data" section and
 * the /data-health summary line: how old the committed file is against its
 * threshold, whether the job that should refresh it last ran green (read
 * from the public GitHub API, no token, failing soft), when the next hand
 * run is due, and whether a refresh is sitting in a `data-review` issue.
 *
 * Why this exists: until 2026-11 staleness showed only on the PIN-gated
 * dashboard, and a job that ran green while committing nothing showed
 * nowhere. The email is the one thing that reaches a person every week, so
 * anything red goes in a line at its top.
 */

import freshness from "@/data/_freshness.json";
import { DATASETS, describeMethod, workflowOf, type DatasetEntry } from "@/data/_registry";

export const DATA_REPO = "chzwscqpcw-commits/car-snapshot";
/** How far ahead a hand run counts as "due soon". Same window as data-due.ts. */
export const DUE_SOON_DAYS = 45;

export type RunStatus = "success" | "failure" | "unknown";

export interface JobRun {
  workflow: string;
  status: RunStatus;
  /** GitHub's conclusion when known (success, failure, cancelled, timed_out…). */
  conclusion: string | null;
  date: string | null; // ISO date
  url: string | null;
}

export interface ReviewIssue {
  title: string;
  url: string;
}

export type RowState = "ok" | "stale" | "failed" | "due" | "unknown";

export interface DataStatusRow {
  file: string;
  label: string;
  method: string;
  ageDays: number | null;
  thresholdDays: number;
  nextDue: string | null;
  dueInDays: number | null;
  lastRun: JobRun | null;
  state: RowState;
  /** The one line that explains a red or amber state. */
  reason: string | null;
}

export interface DataStatus {
  rows: DataStatusRow[];
  reviews: ReviewIssue[];
  /** Something is red: a stale file, a failed job or a refresh awaiting review. */
  red: boolean;
  /** One line for the top of the email and the dashboard; null when nothing is red. */
  summary: string | null;
  /** Why the GitHub reads were skipped, if they were. */
  note: string | null;
  checkedAt: string;
}

type Fetch = typeof fetch;
const HEADERS = { Accept: "application/vnd.github+json", "User-Agent": "freeplatecheck-data-status" };

interface RunsResponse {
  workflow_runs?: Array<{ status: string; conclusion: string | null; updated_at: string; html_url: string; event: string }>;
}

/** The newest completed run of a workflow. Unknown on any failure. */
export async function fetchLatestRun(workflow: string, fetchImpl: Fetch = fetch, repo = DATA_REPO): Promise<JobRun> {
  const unknown: JobRun = { workflow, status: "unknown", conclusion: null, date: null, url: null };
  try {
    const res = await fetchImpl(
      `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/runs?status=completed&per_page=1`,
      { headers: HEADERS, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return unknown;
    const run = ((await res.json()) as RunsResponse).workflow_runs?.[0];
    if (!run) return unknown;
    return {
      workflow,
      status: run.conclusion === "success" ? "success" : run.conclusion ? "failure" : "unknown",
      conclusion: run.conclusion,
      date: run.updated_at.slice(0, 10),
      url: run.html_url,
    };
  } catch {
    return unknown;
  }
}

/** Open issues labelled data-review (the refresh gate opens them). Empty on any failure. */
export async function fetchReviewIssues(fetchImpl: Fetch = fetch, repo = DATA_REPO): Promise<ReviewIssue[]> {
  try {
    const res = await fetchImpl(`https://api.github.com/repos/${repo}/issues?labels=data-review&state=open&per_page=10`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const issues = (await res.json()) as Array<{ title: string; html_url: string; pull_request?: unknown }>;
    return issues.filter((i) => !i.pull_request).map((i) => ({ title: i.title, url: i.html_url }));
  } catch {
    return [];
  }
}

const DAY = 864e5;
const daysBetween = (fromISO: string, nowMs: number) => Math.floor((nowMs - Date.parse(fromISO)) / DAY);

/**
 * Pure: the registry + the freshness manifest + whatever GitHub answered →
 * one row per dataset and the red-line summary.
 */
export function buildDataStatus(input: {
  nowMs: number;
  freshness: Record<string, string>;
  runs: Record<string, JobRun>;
  reviews: ReviewIssue[];
  datasets?: DatasetEntry[];
  note?: string | null;
}): DataStatus {
  const datasets = input.datasets ?? DATASETS;
  const rows: DataStatusRow[] = datasets.map((d) => {
    const iso = input.freshness[d.file];
    const ageDays = iso ? daysBetween(iso, input.nowMs) : null;
    const wf = workflowOf(d);
    const lastRun = wf ? (input.runs[wf] ?? { workflow: wf, status: "unknown", conclusion: null, date: null, url: null }) : null;
    const dueInDays = d.nextDue ? Math.ceil((Date.parse(d.nextDue) - input.nowMs) / DAY) : null;

    let state: RowState = "ok";
    let reason: string | null = null;
    if (ageDays !== null && ageDays > d.thresholdDays) {
      state = "stale";
      reason = `${ageDays} days old, threshold ${d.thresholdDays}`;
    } else if (lastRun && lastRun.status === "failure") {
      state = "failed";
      reason = `last run ${lastRun.conclusion ?? "failed"}${lastRun.date ? ` on ${lastRun.date}` : ""}`;
    } else if (dueInDays !== null && dueInDays <= DUE_SOON_DAYS) {
      state = "due";
      reason = dueInDays < 0 ? `due ${-dueInDays} days ago` : dueInDays === 0 ? "due today" : `due in ${dueInDays} days`;
    } else if (ageDays === null) {
      state = "unknown";
      reason = "no date in the freshness manifest";
    }
    return {
      file: d.file,
      label: d.label,
      method: describeMethod(d),
      ageDays,
      thresholdDays: d.thresholdDays,
      nextDue: d.nextDue ?? null,
      dueInDays,
      lastRun,
      state,
      reason,
    };
  });

  const stale = rows.filter((r) => r.state === "stale");
  const failedJobs = [...new Set(rows.filter((r) => r.state === "failed").map((r) => r.lastRun!.workflow))];
  const parts: string[] = [];
  if (stale.length) parts.push(`${stale.length} stale (${stale.map((r) => r.file).join(", ")})`);
  if (failedJobs.length) parts.push(`${failedJobs.length} job${failedJobs.length > 1 ? "s" : ""} failed (${failedJobs.join(", ")})`);
  if (input.reviews.length) parts.push(`${input.reviews.length} refresh${input.reviews.length > 1 ? "es" : ""} awaiting review`);
  const red = parts.length > 0;

  return {
    rows,
    reviews: input.reviews,
    red,
    summary: red ? `Data: ${parts.join(" · ")}` : null,
    note: input.note ?? null,
    checkedAt: new Date(input.nowMs).toISOString(),
  };
}

/** Everything, live: three GitHub reads at most, each failing soft to "unknown". */
export async function getDataStatus(fetchImpl: Fetch = fetch, nowMs = Date.now(), repo = DATA_REPO): Promise<DataStatus> {
  const workflows = [...new Set(DATASETS.map(workflowOf).filter((w): w is string => !!w))];
  const [runList, reviews] = await Promise.all([
    Promise.all(workflows.map((w) => fetchLatestRun(w, fetchImpl, repo))),
    fetchReviewIssues(fetchImpl, repo),
  ]);
  const runs = Object.fromEntries(runList.map((r) => [r.workflow, r]));
  const unknownRuns = runList.filter((r) => r.status === "unknown").length;
  return buildDataStatus({
    nowMs,
    freshness: freshness as Record<string, string>,
    runs,
    reviews,
    note: unknownRuns ? `${unknownRuns} of ${workflows.length} workflow runs could not be read from GitHub` : null,
  });
}

// ─── Email HTML ──────────────────────────────────────────────────────────────

const TD = "padding:6px 10px;border:1px solid #e2e8f0";
const RED = "color:#dc2626;font-weight:600";
const AMBER = "color:#b45309";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The red line for the top of the email; empty when nothing is red. */
export function renderDataSummaryLine(s: DataStatus): string {
  if (!s.red || !s.summary) return "";
  const issue = s.reviews[0];
  return `
  <p style="margin:0 0 16px;font-size:14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;${RED}">
    ⚠ ${esc(s.summary)}${issue ? ` — <a href="${issue.url}" style="color:#dc2626">${esc(issue.title)}</a>` : ""}. Details in the Data section below.
  </p>`;
}

/** The "Data" section: one row per dataset, red where it matters. */
export function renderDataStatusHtml(s: DataStatus): string {
  const fmtAge = (r: DataStatusRow) => (r.ageDays === null ? "—" : `${r.ageDays}d`);
  const fmtRun = (r: DataStatusRow) => {
    if (!r.lastRun) return `<span style="color:#94a3b8">—</span>`;
    const run = r.lastRun;
    const label = run.status === "unknown" ? "unknown" : `${run.conclusion ?? run.status}${run.date ? ` · ${run.date}` : ""}`;
    const styled = run.status === "failure" ? `<span style="${RED}">${esc(label)}</span>` : esc(label);
    return run.url ? `<a href="${run.url}" style="color:inherit">${styled}</a>` : styled;
  };
  const rowStyle = (r: DataStatusRow) => (r.state === "stale" || r.state === "failed" ? RED : r.state === "due" ? AMBER : "");
  const rows = s.rows
    .map(
      (r) => `<tr style="${rowStyle(r)}">
        <td style="${TD}">${esc(r.label)}<br><code style="font-size:11px;color:#64748b">${esc(r.file)}</code></td>
        <td style="${TD};text-align:right;font-variant-numeric:tabular-nums">${fmtAge(r)}<span style="color:#94a3b8;font-weight:400"> / ${r.thresholdDays}d</span></td>
        <td style="${TD}">${esc(r.method)}</td>
        <td style="${TD}">${r.nextDue ? esc(r.nextDue) : "—"}</td>
        <td style="${TD}">${fmtRun(r)}</td>
        <td style="${TD};font-size:12px">${r.reason ? esc(r.reason) : ""}</td>
      </tr>`,
    )
    .join("");
  const reviewLines = s.reviews.length
    ? `<p style="margin:0 0 10px;font-size:14px;${RED}">Awaiting review: ${s.reviews.map((i) => `<a href="${i.url}" style="color:#dc2626">${esc(i.title)}</a>`).join(", ")}. Merge the PR if the change is real; close it if not.</p>`
    : "";
  const intro = s.red
    ? `<p style="margin:0 0 10px;font-size:14px;${RED}">${esc(s.summary ?? "")}.</p>`
    : `<p style="margin:0 0 10px;font-size:14px">All ${s.rows.length} datasets are within their thresholds and every job's last run succeeded.</p>`;
  const due = s.rows.filter((r) => r.state === "due");
  const dueLine = due.length
    ? `<p style="margin:0 0 10px;font-size:13px;${AMBER}">Hand runs due within ${DUE_SOON_DAYS} days: ${due.map((r) => `${esc(r.label)} (${r.nextDue})`).join(", ")} — the "Data due this month" issue has the commands.</p>`
    : "";
  return `
  <h3 style="margin:28px 0 6px;font-size:16px">Data</h3>
  ${intro}
  ${reviewLines}
  ${dueLine}
  <table style="border-collapse:collapse;width:100%;font-size:13px;margin:0 0 8px">
    <tr style="background:#f1f5f9">
      <th style="${TD};text-align:left">Dataset</th>
      <th style="${TD};text-align:right">Age</th>
      <th style="${TD};text-align:left">How</th>
      <th style="${TD};text-align:left">Next due</th>
      <th style="${TD};text-align:left">Last run</th>
      <th style="${TD};text-align:left"></th>
    </tr>
    ${rows}
  </table>
  <p style="color:#94a3b8;font-size:12px;margin:0 0 8px">Age is the committed file's last change against its threshold (src/data/_registry.ts); jobs commit only when a file changes, so an old file under a weekly job is fine while its last run is green. Last run is the newest completed run of the job that refreshes the file.${s.note ? ` ${esc(s.note)}.` : ""}</p>`;
}
