/**
 * Resolve the current GOV.UK weekly-road-fuel-prices CSV.
 *
 * WHY THIS EXISTS. GOV.UK re-mints the asset URL every time the statistics are
 * republished — which is weekly. The media id is part of the path, so any
 * hardcoded URL starts returning **410 Gone** within days:
 *
 *   was  …/media/6993252f7da91680ad7f44a1/CSV__2018_-____3_.csv   → 410
 *   now  …/media/6a79e642e9c8ef7358ccc0b5/CSV__2018_-__.csv
 *
 * (The `___3_` in that dead filename is the tell — it had already been
 * re-pinned by hand at least twice before.)
 *
 * The `/data-health` fuel check hardcoded exactly that and had been reporting
 * "CSV fetch failed (410)" since ~11 June 2026, while the public
 * `/api/fuel-prices` route — which discovered the URL properly — served correct
 * prices the whole time. Three near-identical copies of this discovery logic
 * existed and only one rotted, which is precisely the argument for one copy.
 *
 * Always resolve through the Content API. Never pin a media URL.
 */
const CONTENT_API =
  "https://www.gov.uk/api/content/government/statistics/weekly-road-fuel-prices";

type Attachment = { content_type?: string; title?: string; url?: string };

/** Depth-first walk for attachment-shaped objects; they sit at varying depths. */
function collectAttachments(obj: unknown, out: Attachment[]): void {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectAttachments(v, out));
    return;
  }
  const o = obj as Record<string, unknown>;
  if (o.content_type && o.url && typeof o.title === "string") {
    out.push(o as Attachment);
  }
  Object.values(o).forEach((v) => collectAttachments(v, out));
}

/**
 * The 2018-onwards ("modern") CSV — the one carrying current prices.
 * Throws if the Content API is unreachable or shape-changes, so callers can
 * distinguish "GOV.UK moved the goalposts" from "prices look wrong".
 */
export async function discoverFuelCsvUrl(signal?: AbortSignal): Promise<string> {
  const res = await fetch(CONTENT_API, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`Content API returned ${res.status}`);
  const json = await res.json();

  const attachments: Attachment[] = [];
  collectAttachments(json, attachments);

  const csvs = attachments.filter(
    (a) => a.content_type === "text/csv" || a.url?.endsWith(".csv")
  );
  const modern = csvs.find(
    (a) => a.title?.includes("2018") || (a.title?.includes("201") && a.title?.includes("202"))
  );
  const url = modern?.url ?? csvs.find((a) => !a.title?.includes("2003"))?.url;
  if (!url) throw new Error("Could not find CSV attachment in Content API response");
  return url;
}

/** `dd/mm/yyyy` → `yyyy-mm-dd`. Returns the input unchanged if unrecognised. */
export function parseFuelCsvDate(ukDate: string): string {
  const parts = ukDate.split("/");
  if (parts.length !== 3) return ukDate;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
