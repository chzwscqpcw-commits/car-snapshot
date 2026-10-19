/**
 * Summarises how src/data/model-price-calibration.json changed against a
 * previous copy, as Markdown for the monthly calibration PR.
 *
 *   npx tsx scripts/diff-model-calibration.ts <old.json> <new.json>
 *
 * Exits 0 always; prints "NO_FAMILY_CHANGES" as the first line when only the
 * metadata (date, event counts) moved, so the workflow can skip a PR that
 * would change no valuation.
 *
 * The 30% threshold is what deserves a human look before merging: a family
 * moving that much in a month is either a real market shift or a data
 * problem (one bad batch of eBay listings, a family split by a DVLA spelling
 * change), and only a person can tell which.
 */
import * as fs from "node:fs";

type Fam = { price: number; n: number; minAge: number; maxAge: number };
type Cal = { generatedAt: string; events: number; families: Record<string, Fam> };

const [oldPath, newPath] = process.argv.slice(2);
const before = JSON.parse(fs.readFileSync(oldPath, "utf8")) as Cal;
const after = JSON.parse(fs.readFileSync(newPath, "utf8")) as Cal;

const keys = new Set([...Object.keys(before.families), ...Object.keys(after.families)]);
const added: string[] = [];
const removed: string[] = [];
const moved: { fam: string; from: number; to: number; pct: number }[] = [];
let unchanged = 0;

for (const fam of [...keys].sort()) {
  const a = before.families[fam];
  const b = after.families[fam];
  if (!a) added.push(fam);
  else if (!b) removed.push(fam);
  else if (a.price !== b.price || a.minAge !== b.minAge || a.maxAge !== b.maxAge) {
    moved.push({ fam, from: a.price, to: b.price, pct: ((b.price - a.price) / a.price) * 100 });
  } else unchanged++;
}

if (added.length + removed.length + moved.length === 0) {
  console.log("NO_FAMILY_CHANGES");
  process.exit(0);
}

const big = moved.filter((m) => Math.abs(m.pct) >= 30).sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct));
const pounds = (n: number) => `£${n.toLocaleString("en-GB")}`;

const lines = [
  `**${Object.keys(after.families).length} families** (was ${Object.keys(before.families).length}) from ${after.events.toLocaleString("en-GB")} events.`,
  "",
  `| | count |`,
  `|---|---|`,
  `| added | ${added.length} |`,
  `| removed | ${removed.length} |`,
  `| price moved | ${moved.length} |`,
  `| unchanged | ${unchanged} |`,
  "",
];
if (big.length > 0) {
  lines.push("### ⚠️ Moved 30% or more — check before merging", "", "| family | before | after | change |", "|---|---|---|---|");
  // Family keys contain "|" (MAKE|MODEL), which would split a table cell.
  for (const m of big) lines.push(`| ${m.fam.replace("|", " ")} | ${pounds(m.from)} | ${pounds(m.to)} | ${m.pct > 0 ? "+" : ""}${m.pct.toFixed(0)}% |`);
  lines.push("");
} else {
  lines.push("No family moved by 30% or more.", "");
}
if (removed.length > 0) {
  lines.push(`### Removed (fall back to the list-price table)`, "", removed.join(", "), "");
}
if (added.length > 0) {
  lines.push(`### Added`, "", added.join(", "), "");
}
console.log(lines.join("\n"));
