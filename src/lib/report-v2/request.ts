import type { ReportInput } from "@/lib/generateReport";
import { isReportTheme, type ReportTheme } from "./theme";

// Request handling shared by the report routes: the production gate, a
// per-instance rate limit, and validation of the posted report data.

/**
 * The real production deployment. VERCEL_ENV alone isn't enough: `vercel env
 * pull` writes VERCEL_ENV="production" into .env.local, and only a real
 * deployment has VERCEL_URL (same rule as analytics-writes.ts).
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production" && Boolean(process.env.VERCEL_URL);
}

/** Off in production until the new report is switched on (REPORT_V2_ENABLED=1). */
export function reportV2Enabled(): boolean {
  return !isProductionDeployment() || process.env.REPORT_V2_ENABLED === "1";
}

// Each render costs a browser page, so the limit is tighter than /api/lookup's.
// Per serverless instance, like the lookup limiter; the Vercel firewall is the
// cross-instance backstop if this endpoint is ever abused.
const LIMIT = 6;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5000) hits.clear(); // bound memory on a long-lived instance
    return false;
  }
  entry.count++;
  return entry.count > LIMIT;
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

export const MAX_BODY_BYTES = 256 * 1024;

export type ParsedRequest = { ok: true; input: ReportInput; theme: ReportTheme } | { ok: false; status: number; error: string };

/** Parse and sanity-check a posted { input, theme } body. */
export function parseReportRequest(text: string): ParsedRequest {
  if (text.length > MAX_BODY_BYTES) return { ok: false, status: 413, error: "Report data too large" };
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }
  const b = body as { input?: ReportInput; theme?: unknown };
  const theme = b.theme ?? "dark";
  if (!isReportTheme(theme)) return { ok: false, status: 400, error: "theme must be dark or light" };
  const reg = b.input?.data?.registrationNumber;
  if (typeof reg !== "string" || reg.length < 2 || reg.length > 12) {
    return { ok: false, status: 400, error: "input.data.registrationNumber is required" };
  }
  const tests = b.input?.data?.motTests;
  if (tests !== undefined && (!Array.isArray(tests) || tests.length > 200)) {
    return { ok: false, status: 400, error: "input.data.motTests must be an array" };
  }
  return { ok: true, input: b.input as ReportInput, theme };
}

/** "FPC-Report-AB12CDE-2026-10-12-print.pdf" */
export function reportFilename(reg: string, theme: ReportTheme, now = new Date()): string {
  const safeReg = reg.toUpperCase().replace(/[^A-Z0-9]/g, "") || "vehicle";
  return `FPC-Report-${safeReg}-${now.toISOString().slice(0, 10)}${theme === "light" ? "-print" : ""}.pdf`;
}
