/**
 * "Data as of <date> · Source <name> · Next update <month>" — the one line
 * every dataset-backed section shows, fed by the registry
 * (src/data/_registry.ts) and the freshness manifest (_freshness.json, the
 * commit date of each file, rebuilt at every build).
 *
 * The date is the OLDEST of the files a section draws on: that is the date
 * the whole section is honest to. "Next update" is the job's cadence for
 * automated datasets and the registry's `nextDue` month for hand-run ones.
 */

import freshness from "@/data/_freshness.json";
import { datasetByFile, workflowOf, type DatasetEntry } from "@/data/_registry";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Deterministic (UTC) so server and client render the same string. */
export function formatDay(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatMonth(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** When the next refresh is expected, in words a reader can use. */
export function nextUpdateLabel(entry: DatasetEntry): string {
  const wf = workflowOf(entry);
  if (wf === "refresh-data.yml") return "weekly";
  if (wf === "refresh-prices.yml") return "weekly";
  if (wf === "calibrate-valuations.yml") return "monthly";
  if (wf) return entry.cadence;
  if (entry.method === "prebuild") return "every deploy";
  if (entry.nextDue) return formatMonth(entry.nextDue) ?? entry.nextDue;
  return "when the source changes";
}

export interface Provenance {
  /** ISO date of the oldest file, or null when no file has a date yet. */
  asOf: string | null;
  asOfLabel: string | null;
  /** Unique source names, in the order the files were given. */
  sources: string[];
  nextUpdate: string;
  /** The period the first file's figures cover, when the registry knows it. */
  covers: string | null;
  coversYear: number | null;
}

export function dataProvenance(
  files: string[],
  manifest: Record<string, string> = freshness as Record<string, string>,
  lookup: (file: string) => DatasetEntry | undefined = datasetByFile,
): Provenance {
  const entries = files.map(lookup).filter((e): e is DatasetEntry => !!e);
  const dates = files
    .map((f) => manifest[f])
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .sort();
  const asOf = dates[0] ?? null;
  const sources: string[] = [];
  for (const e of entries) if (!sources.includes(e.source.name)) sources.push(e.source.name);
  const first = entries[0];
  return {
    asOf,
    asOfLabel: asOf ? formatDay(asOf) : null,
    sources,
    nextUpdate: first ? nextUpdateLabel(first) : "when the source changes",
    covers: first?.covers ?? null,
    coversYear: first?.coversYear ?? null,
  };
}

/** The plain-text form, for tests and non-React surfaces. */
export function provenanceLine(p: Provenance): string {
  const parts = [`Data as of ${p.asOfLabel ?? "unknown"}`];
  if (p.sources.length) parts.push(`Source ${p.sources.join(", ")}`);
  parts.push(`Next update ${p.nextUpdate}`);
  return parts.join(" · ");
}
