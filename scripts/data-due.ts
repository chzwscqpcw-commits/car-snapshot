#!/usr/bin/env npx tsx
/**
 * Which hand-run datasets are due. Reads `nextDue` from the registry
 * (src/data/_registry.ts) and lists every manual dataset due within the
 * window, with the exact command and the source link — the theft FOI
 * request (sent in September for the year's data), the MOT bulk drop (May)
 * and the curated files.
 *
 *   npx tsx scripts/data-due.ts                 # table, 45-day window
 *   npx tsx scripts/data-due.ts --days 120      # wider window
 *   npx tsx scripts/data-due.ts --markdown      # the body of the monthly issue
 *   npx tsx scripts/data-due.ts --json
 *   npx tsx scripts/data-due.ts --today 2027-04-20   # for testing the calendar
 *
 * .github/workflows/data-due.yml runs it on the 1st of each month and opens
 * "Data due this month — <Month YYYY>" when anything is due. Prints
 * NOTHING_DUE as the first line of the markdown when there is nothing, so the
 * workflow can skip the issue.
 */

import { DATASETS, type DatasetEntry } from "../src/data/_registry";

export interface DueRow {
  file: string;
  label: string;
  nextDue: string;
  dueInDays: number;
  refreshHint: string;
  sourceName: string;
  sourceUrl: string | null;
  covers: string | null;
}

const DAY = 864e5;

/** Manual datasets with a `nextDue` within `days` of `today` (overdue included), soonest first. */
export function dueWithin(today: string, days: number, datasets: DatasetEntry[] = DATASETS): DueRow[] {
  const nowMs = Date.parse(today);
  return datasets
    .filter((d): d is DatasetEntry & { nextDue: string } => d.method === "manual" && !!d.nextDue)
    .map((d) => ({
      file: d.file,
      label: d.label,
      nextDue: d.nextDue,
      dueInDays: Math.ceil((Date.parse(d.nextDue) - nowMs) / DAY),
      refreshHint: d.refreshHint,
      sourceName: d.source.name,
      sourceUrl: d.source.url,
      covers: d.covers ?? null,
    }))
    .filter((r) => r.dueInDays <= days)
    .sort((a, b) => a.dueInDays - b.dueInDays || a.file.localeCompare(b.file));
}

function when(r: DueRow): string {
  if (r.dueInDays < 0) return `**overdue by ${-r.dueInDays} days** (${r.nextDue})`;
  if (r.dueInDays === 0) return `**due today** (${r.nextDue})`;
  return `due in ${r.dueInDays} days (${r.nextDue})`;
}

/** The monthly issue's body. Datasets sharing a command are grouped so the FOI or the MOT drop reads as one job. */
export function renderDueMarkdown(rows: DueRow[], today: string, days: number): string {
  if (rows.length === 0) return `NOTHING_DUE\n\nNo hand-run dataset is due within ${days} days of ${today}.`;
  const groups = new Map<string, DueRow[]>();
  for (const r of rows) {
    const g = groups.get(r.refreshHint) ?? [];
    g.push(r);
    groups.set(r.refreshHint, g);
  }
  const lines: string[] = [];
  lines.push(`Hand-run datasets due within ${days} days of ${today}, from \`src/data/_registry.ts\`. Each block is one job; tick it off by committing the refreshed file(s) and moving \`nextDue\` on a year.`);
  lines.push("");
  for (const [hint, group] of groups) {
    const first = group[0];
    lines.push(`### ${group.map((r) => r.label).join(" + ")} — ${when(first)}`);
    lines.push("");
    lines.push(`Files: ${group.map((r) => `\`${r.file}\``).join(", ")}${first.covers ? ` (currently covers ${first.covers})` : ""}`);
    lines.push(`Source: ${first.sourceUrl ? `[${first.sourceName}](${first.sourceUrl})` : first.sourceName}`);
    lines.push("");
    lines.push("How:");
    lines.push("");
    lines.push("```");
    lines.push(hint);
    lines.push("```");
    lines.push("");
    lines.push("Then: `npm run validate-data:delta`, commit, and set the entry's `nextDue` in `src/data/_registry.ts` to next year.");
    lines.push("");
  }
  lines.push(`Run locally: \`npx tsx scripts/data-due.ts --days ${days}\`.`);
  return lines.join("\n");
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (name: string) => {
    const i = argv.indexOf(name);
    return i !== -1 ? argv[i + 1] : undefined;
  };
  const days = Number(arg("--days") ?? 45);
  const today = arg("--today") ?? new Date().toISOString().slice(0, 10);
  const rows = dueWithin(today, days);

  if (argv.includes("--json")) {
    console.log(JSON.stringify({ today, days, rows }, null, 2));
  } else if (argv.includes("--markdown")) {
    console.log(renderDueMarkdown(rows, today, days));
  } else {
    console.log(`\n  Hand-run datasets due within ${days} days of ${today}`);
    console.log("  " + "=".repeat(60));
    if (rows.length === 0) {
      console.log("  Nothing due.");
    } else {
      for (const r of rows) {
        console.log(`\n  ${r.label} (${r.file}) — ${when(r).replace(/\*\*/g, "")}`);
        console.log(`    source: ${r.sourceUrl ?? r.sourceName}`);
        console.log(`    how:    ${r.refreshHint}`);
      }
    }
    const later = DATASETS.filter((d) => d.method === "manual" && d.nextDue && !rows.some((r) => r.file === d.file))
      .sort((a, b) => a.nextDue!.localeCompare(b.nextDue!));
    if (later.length) {
      console.log(`\n  Later: ${later.map((d) => `${d.file} ${d.nextDue}`).join(" · ")}`);
    }
    console.log();
  }
}

if (require.main === module) main();
