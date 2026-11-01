#!/usr/bin/env npx tsx
/**
 * Data file validator — CLI entry point, prebuild hook and the gate in the
 * refresh workflows.
 *
 *   npx tsx scripts/validate-data.ts                 # shape checks, human-readable
 *   npx tsx scripts/validate-data.ts --json          # machine-readable JSON
 *   npx tsx scripts/validate-data.ts --against       # + compare with origin/main (else HEAD)
 *   npx tsx scripts/validate-data.ts --against v1.2  # + compare with any git ref
 *
 * With --against the run also writes validation-report.md (gitignored) — the
 * Markdown table the workflows attach to the data PR and the review issue —
 * and, under GitHub Actions, `status=ok|review|fail` to $GITHUB_OUTPUT.
 *
 * Exit code: 0 for ok or review, 1 for fail. A `review` is a judgement call
 * for a person, so it must not break a build; the workflow reads the status
 * and opens the PR without auto-merge instead.
 */

import * as fs from "fs";
import * as path from "path";
import { defaultDeltaRef, overallStatus, renderMarkdownReport, validateAll } from "./lib/validators";

const argv = process.argv.slice(2);
const jsonMode = argv.includes("--json");
const againstIdx = argv.indexOf("--against");
let against: string | undefined;
if (againstIdx !== -1) {
  const next = argv[againstIdx + 1];
  against = next && !next.startsWith("--") ? next : defaultDeltaRef();
}

const results = validateAll({ against });
const overall = overallStatus(results);
const failures = results.filter((r) => r.status === "fail");
const reviews = results.filter((r) => r.status === "review");

if (jsonMode) {
  console.log(JSON.stringify({ status: overall, against: against ?? null, results }, null, 2));
} else {
  const maxFileLen = Math.max(...results.map((r) => r.file.length));
  console.log("\n  Data File Validation Report" + (against ? `  (vs ${against})` : ""));
  console.log("  " + "=".repeat(50));
  console.log();
  for (const r of results) {
    const icon =
      r.status === "ok" ? "\x1b[32m  OK  \x1b[0m" : r.status === "review" ? "\x1b[33mREVIEW\x1b[0m" : "\x1b[31m FAIL \x1b[0m";
    const d = r.delta;
    const entries =
      d && d.status !== "skipped" && d.previousCount !== d.currentCount
        ? `${d.previousCount.toLocaleString()} → ${d.currentCount.toLocaleString()} entries`
        : `${r.entryCount.toLocaleString()} entries`;
    console.log(`  ${icon}  ${r.file.padEnd(maxFileLen)}  (${entries})`);
    for (const err of r.errors) console.log(`           \x1b[31m- ${err}\x1b[0m`);
    for (const rev of r.reviews) console.log(`           \x1b[33m? ${rev}\x1b[0m`);
    for (const warn of r.warnings) console.log(`           \x1b[33m! ${warn}\x1b[0m`);
  }
  console.log();
  console.log(`  ${results.length - failures.length - reviews.length}/${results.length} ok` + (reviews.length ? `, ${reviews.length} to review` : "") + (failures.length ? `, ${failures.length} failed` : ""));
  console.log();
}

if (against) {
  const report = renderMarkdownReport(results, against);
  const out = path.resolve(__dirname, "..", "validation-report.md");
  fs.writeFileSync(out, report + "\n");
  if (!jsonMode) console.log(`  Report written to ${path.relative(process.cwd(), out)}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `status=${overall}\n`);
}

process.exit(overall === "fail" ? 1 : 0);
