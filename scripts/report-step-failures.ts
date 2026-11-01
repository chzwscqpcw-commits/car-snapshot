#!/usr/bin/env npx tsx
/**
 * Routes refresh-step failures to one GitHub issue, "Data refresh failures".
 *
 * The scraper steps in the refresh workflows are continue-on-error on
 * purpose (one dead source must not cost the others their commit), which
 * means a failed step leaves the run green and the failure visible only in a
 * run summary nobody opens. This step, run after the scrapers with
 * `if: always()`, keeps a single open issue instead:
 *
 *   - any failed step → the issue is opened (or updated) with a table of every
 *     workflow's last outcome and a comment naming today's failed steps, with
 *     the run's log link;
 *   - a run with no failed steps → that workflow's row is cleared, and when no
 *     workflow has a failing step left the issue is closed with a comment.
 *
 * State lives in the issue body as a JSON block, so a Wednesday success does
 * not close an issue the Sunday job is still failing.
 *
 * Env: WORKFLOW (display name), OUTCOMES ("DVSA recalls=failure;VCA=success"),
 *      RUN_URL, GH_TOKEN (+ GITHUB_REPOSITORY for gh). Never exits non-zero.
 */

import { execFileSync } from "node:child_process";

export const ISSUE_TITLE = "Data refresh failures";
export const LABEL = "data-failure";
const MARK_OPEN = "<!-- data-failure-state:";
const MARK_CLOSE = ":end -->";

export interface WorkflowState {
  failed: string[];
  run: string;
  date: string;
}
export type FailureState = Record<string, WorkflowState>;

export function parseOutcomes(s: string): { step: string; outcome: string }[] {
  return s
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const i = p.lastIndexOf("=");
      return { step: p.slice(0, i).trim(), outcome: p.slice(i + 1).trim() };
    });
}

export function parseState(body: string | null | undefined): FailureState {
  if (!body) return {};
  const start = body.indexOf(MARK_OPEN);
  const end = body.indexOf(MARK_CLOSE, start);
  if (start === -1 || end === -1) return {};
  try {
    return JSON.parse(body.slice(start + MARK_OPEN.length, end)) as FailureState;
  } catch {
    return {};
  }
}

export function nextState(prev: FailureState, workflow: string, failed: string[], run: string, date: string): FailureState {
  return { ...prev, [workflow]: { failed, run, date } };
}

export const anyFailing = (state: FailureState): boolean => Object.values(state).some((w) => w.failed.length > 0);

export function renderBody(state: FailureState): string {
  const rows = Object.entries(state)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([wf, s]) => `| ${wf} | ${s.failed.length ? `❌ ${s.failed.join(", ")}` : "✅ all steps"} | ${s.date} | [log](${s.run}) |`)
    .join("\n");
  return [
    "A refresh step failed. The scrapers are allowed to fail without stopping the commit (a dead source costs only its own data), so this issue is where those failures are visible. It closes itself when every workflow below has a clean run.",
    "",
    "| Workflow | Last run | Date | Log |",
    "|---|---|---|---|",
    rows,
    "",
    "What to do: open the log, see why the step failed (source moved, bot protection, timeout), fix the script or raise its cap, and re-run the workflow. The dataset keeps its previous values meanwhile; its age is on /data-health and in the Friday email.",
    "",
    `${MARK_OPEN}${JSON.stringify(state)}${MARK_CLOSE}`,
  ].join("\n");
}

function gh(args: string[], input?: string): string {
  return execFileSync("gh", args, { encoding: "utf-8", input, stdio: ["pipe", "pipe", "inherit"] }).trim();
}

function main() {
  const workflow = process.env.WORKFLOW ?? "unknown workflow";
  const outcomes = parseOutcomes(process.env.OUTCOMES ?? "");
  const run = process.env.RUN_URL ?? "";
  const date = new Date().toISOString().slice(0, 10);
  const failed = outcomes.filter((o) => o.outcome !== "success" && o.outcome !== "skipped").map((o) => o.step);
  console.log(`${workflow}: ${outcomes.length} steps, ${failed.length} failed${failed.length ? ` (${failed.join(", ")})` : ""}`);

  try {
    gh(["label", "create", LABEL, "--force", "--color", "B60205", "--description", "A refresh step is failing; the dataset keeps its previous values"]);
  } catch {
    /* label exists or no permission — the issue still works unlabelled */
  }

  const existing = JSON.parse(
    gh(["issue", "list", "--state", "open", "--search", `"${ISSUE_TITLE}" in:title`, "--json", "number,title,body"]),
  ) as { number: number; title: string; body: string }[];
  const issue = existing.find((i) => i.title === ISSUE_TITLE) ?? null;
  const state = nextState(parseState(issue?.body), workflow, failed, run, date);

  if (failed.length === 0 && !issue) {
    console.log("nothing failing, no issue open — nothing to do");
    return;
  }

  if (anyFailing(state)) {
    const body = renderBody(state);
    if (issue) {
      gh(["issue", "edit", String(issue.number), "--body-file", "-"], body);
      gh(["issue", "comment", String(issue.number), "--body", failed.length ? `${date}: **${workflow}** — ${failed.join(", ")} failed. Log: ${run}` : `${date}: **${workflow}** ran clean (${run}); another workflow is still failing, so this stays open.`]);
      console.log(`updated issue #${issue.number}`);
    } else {
      const url = gh(["issue", "create", "--title", ISSUE_TITLE, "--label", LABEL, "--body-file", "-"], body);
      console.log(`opened ${url}`);
    }
  } else if (issue) {
    gh(["issue", "comment", String(issue.number), "--body", `${date}: **${workflow}** ran with every step green (${run}). No workflow is failing — closing.`]);
    gh(["issue", "close", String(issue.number)]);
    console.log(`closed issue #${issue.number}`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    // Reporting must never cost the refresh its commit.
    console.error("report-step-failures: could not update the issue:", err instanceof Error ? err.message : err);
  }
}
