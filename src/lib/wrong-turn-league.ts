import crypto from "crypto";

// The weekly league for the "Took a wrong turn" 404 game. Server-only.
//
// Cheating is made awkward, not impossible: a run starts with a signed token
// carrying the server's clock, so a time can't be entered before that much
// time has really passed; no time can beat what the track allows flat out;
// and each token can be entered once (run_id is unique in the table). A
// determined cheat could still post a near-perfect time — delete the row.

/** The track can't be driven faster than this (≈30.5s flat out, Oct 2026). */
export const MIN_SECONDS = 29;
const MAX_SECONDS = 900;
/** 3-2-1 countdown before the clock starts, less some network slack. */
const COUNTDOWN_SLACK = 1.5;
const TOKEN_TTL_MS = 30 * 60 * 1000;

function secret(): string {
  return `wrong-turn:${process.env.VRM_SALT || "change-me"}`;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 32);
}

export function newRunToken(now = Date.now()): string {
  const nonce = crypto.randomBytes(6).toString("hex");
  const payload = `${now}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export type RunCheck = { ok: true; runId: string } | { ok: false; reason: string };

/** Is `seconds` a believable time for the run this token started? */
export function checkRun(token: unknown, seconds: unknown, now = Date.now()): RunCheck {
  if (typeof token !== "string") return { ok: false, reason: "no_token" };
  const [started, nonce, mac] = token.split(".");
  if (!started || !nonce || !mac || sign(`${started}.${nonce}`) !== mac) return { ok: false, reason: "bad_token" };
  const age = now - Number(started);
  if (!(age > 0) || age > TOKEN_TTL_MS) return { ok: false, reason: "expired" };
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return { ok: false, reason: "bad_time" };
  if (seconds < MIN_SECONDS || seconds > MAX_SECONDS) return { ok: false, reason: "impossible_time" };
  // The run can't have taken longer than the time since its token was issued.
  if (seconds + 3 - COUNTDOWN_SLACK > age / 1000) return { ok: false, reason: "clock_mismatch" };
  return { ok: true, runId: mac };
}

// Three-letter combinations nobody wants on the league.
const BLOCKED = new Set([
  "ASS", "CUM", "CNT", "COK", "DIK", "DIC", "FAG", "FCK", "FKU", "FUC", "FUK", "FUX", "JIZ", "KKK", "NOB",
  "PIS", "POO", "SEX", "SHT", "TIT", "TWT", "WNK", "WTF", "XXX", "NIG", "NGR", "GAY", "RAP", "PNS", "VAG",
  "KYS", "BUM", "SUK", "SUC", "HOE", "PUS", "SLT", "ISIS", "NAZ", "SS",
]);

/** "a.b-c" → "ABC"; null unless exactly three letters and not on the list. */
export function cleanInitials(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (v.length !== 3 || BLOCKED.has(v)) return null;
  return v;
}

function londonDate(d: Date): { y: number; m: number; day: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  return { y: Number(get("year")), m: Number(get("month")), day: Number(get("day")), weekday };
}

/** The Monday (UK time) starting the league week that contains `now`, as YYYY-MM-DD. */
export function weekStart(now = new Date()): string {
  const { y, m, day, weekday } = londonDate(now);
  const monday = new Date(Date.UTC(y, m - 1, day - weekday));
  return monday.toISOString().slice(0, 10);
}

export type LeagueRow = { initials: string; seconds: number };

/** Each initials' best time, fastest first. */
export function bestPerInitials(rows: LeagueRow[]): LeagueRow[] {
  const best = new Map<string, number>();
  for (const r of rows) {
    const s = Number(r.seconds);
    if (!best.has(r.initials) || s < best.get(r.initials)!) best.set(r.initials, s);
  }
  return [...best].map(([initials, seconds]) => ({ initials, seconds })).sort((a, b) => a.seconds - b.seconds);
}
