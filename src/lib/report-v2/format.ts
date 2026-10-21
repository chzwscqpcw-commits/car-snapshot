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

/**
 * What to call the vehicle in copy. DVLA's wheelplan and type approval tell
 * a motorbike (2 WHEEL / L-category) or a van (N1) from a car. The first real
 * vehicle rendered was a Ducati 1199, which the report called a "car".
 */
export function vehicleNoun(d: { wheelplan?: string; typeApproval?: string }, bodyStyle?: string | null): "car" | "motorbike" | "van" {
  const wheelplan = (d.wheelplan ?? "").toUpperCase();
  const approval = (d.typeApproval ?? "").toUpperCase();
  if (wheelplan.includes("2 WHEEL") || approval.startsWith("L")) return "motorbike";
  if (approval.startsWith("N1") || /\bvan\b/i.test(bodyStyle ?? "")) return "van";
  return "car";
}

/** For components holding a raw lookup record, whose DVLA fields are untyped. */
export function isMotorbike(v: object): boolean {
  const { wheelplan, typeApproval } = v as { wheelplan?: unknown; typeApproval?: unknown };
  return (
    vehicleNoun({
      wheelplan: typeof wheelplan === "string" ? wheelplan : undefined,
      typeApproval: typeof typeApproval === "string" ? typeApproval : undefined,
    }) === "motorbike"
  );
}

/** Strip emoji and pictographs (e.g. "⚠️ " in engine warnings) the fonts can't draw. */
export function plainText(s: string): string {
  return s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/\s+-\s+/g, ": ").replace(/\s{2,}/g, " ").trim();
}

export function num(n: number): string {
  return Math.round(n).toLocaleString("en-GB");
}

export function pounds(n: number): string {
  return `£${num(n)}`;
}
