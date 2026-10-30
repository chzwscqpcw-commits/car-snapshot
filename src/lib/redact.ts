// Keep personal data out of places it doesn't need to be: server logs, Google
// Analytics, and stored analytics rows. Our privacy copy says registrations
// are "not retained" (the /car-check FAQ) — until Oct 2026 plates were printed
// in Vercel function logs, sent to GA4 in every reg_search conversion, and
// stored in plain text in site_events, and reminder logs printed emails too.

/** "AB12CDE" -> "AB***": enough to tell log lines apart, not to identify a car. */
export function maskPlate(vrm: unknown): string {
  const v = typeof vrm === "string" ? vrm.replace(/\s+/g, "").toUpperCase() : "";
  return v ? `${v.slice(0, 2)}***` : "(none)";
}

/** "jane.doe@example.com" -> "j***@example.com". */
export function maskEmail(email: unknown): string {
  if (typeof email !== "string" || !email.includes("@")) return "(none)";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

/** Query parameters that carry a plate in our URLs (and the legacy name). */
const PLATE_PARAMS = ["vrm", "reg"];

/**
 * A URL with any plate removed — from the query string, a `#vrm=` fragment,
 * or a path segment. Returns the input unchanged if it isn't a parseable URL.
 */
export function stripPlateFromUrl(raw: string): string {
  if (!raw) return raw;
  try {
    const u = new URL(raw, "https://www.freeplatecheck.co.uk");
    for (const p of PLATE_PARAMS) u.searchParams.delete(p);
    if (/(^|[#&])(vrm|reg)=/i.test(u.hash)) u.hash = "";
    // A plate typed into the path (/reg/AB12CDE) reaches us via the 404 page.
    u.pathname = stripPlateFromPath(u.pathname);
    // Preserve relative paths as relative.
    return /^[a-z]+:\/\//i.test(raw) ? u.toString() : `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return raw;
  }
}

/**
 * Payload keys a plate travels under. `vrm` is the house name, but the PDF
 * download and save-vehicle events sent `reg` — which nothing stripped, so
 * until 30 Oct 2026 those plates were stored in plain text and sent to GA4.
 * Every key here is treated as a plate wherever payloads are cleaned.
 */
export const PLATE_KEYS = ["vrm", "reg", "registration", "registrationNumber", "plate"] as const;

/** A copy of an analytics payload with no plate in it, for third parties. */
export function withoutPlate<T extends Record<string, unknown>>(payload: T): Omit<T, (typeof PLATE_KEYS)[number]> {
  const rest: Record<string, unknown> = { ...payload };
  for (const k of PLATE_KEYS) delete rest[k];
  return rest as Omit<T, (typeof PLATE_KEYS)[number]>;
}

/** The plate in a payload, under any of PLATE_KEYS, normalised; null if none. */
export function plateIn(payload: Record<string, unknown>): string | null {
  for (const k of PLATE_KEYS) {
    const v = payload[k];
    if (typeof v === "string") {
      const plate = v.replace(/\s+/g, "").toUpperCase();
      if (plate) return plate;
    }
  }
  return null;
}

/**
 * Dated UK formats only — current (AB12CDE), prefix (A123BCD) and suffix
 * (ABC123D). Dateless plates ("A1", "ABC 1") look too much like ordinary URL
 * words to guess from a path.
 */
const DATED_PLATE = /^([A-Z]{2}\d{2}[A-Z]{3}|[A-Z]\d{1,3}[A-Z]{3}|[A-Z]{3}\d{1,3}[A-Z])$/;

function pathSegments(pathname: string): string[] {
  return pathname.split("/").map((s) => {
    try {
      return decodeURIComponent(s).replace(/\s+/g, "").toUpperCase();
    } catch {
      return "";
    }
  });
}

/**
 * The plate in a path someone typed, like /reg/KY19KVK or /check/ky19 kvk.
 * Most real visitors who reach our 404 got there this way (Oct 2026).
 */
export function plateInPath(pathname: string): string | null {
  return pathSegments(pathname).reverse().find((s) => DATED_PLATE.test(s)) ?? null;
}

/** "/reg/KY19KVK" -> "/reg/:plate", for stored page views. */
export function stripPlateFromPath(pathname: string): string {
  const segs = pathSegments(pathname);
  return pathname
    .split("/")
    .map((s, i) => (DATED_PLATE.test(segs[i]) ? ":plate" : s))
    .join("/");
}
