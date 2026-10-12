// Formatting helpers for the report template. Deterministic (no locale or
// timezone surprises between the server and a local run).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "AB12CDE" → "AB12 CDE" for current-format plates; others unchanged. */
export function formatPlate(reg: string): string {
  const r = reg.toUpperCase().replace(/\s+/g, "");
  return /^[A-Z]{2}\d{2}[A-Z]{3}$/.test(r) ? `${r.slice(0, 4)} ${r.slice(4)}` : r;
}

/** Title-case a DVLA make/model word: BMW, 320D and M stay; SPORT → Sport. */
export function titleWord(w: string): string {
  if (w.includes("-")) return w.split("-").map(titleWord).join("-");
  if (w.length <= 3 || /\d/.test(w)) return w;
  return w[0] + w.slice(1).toLowerCase();
}

export function titleCase(s: string | undefined): string {
  return (s ?? "").trim().split(/\s+/).filter(Boolean).map(titleWord).join(" ");
}

export function parseDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "11 Apr 2027" */
export function shortDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Apr 2026" */
export function monthYear(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function num(n: number): string {
  return Math.round(n).toLocaleString("en-GB");
}

export function pounds(n: number): string {
  return `£${num(n)}`;
}
