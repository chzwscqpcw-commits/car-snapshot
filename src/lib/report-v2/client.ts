import type { ReportInput } from "@/lib/generateReport";
import type { ReportTheme } from "./theme";

// Browser side of the server-rendered report: ask /api/report-pdf for the PDF,
// and say why if it can't be had, so the caller falls back to the jsPDF report.
// The route is off in production unless REPORT_V2_ENABLED=1 (it 404s), so this
// fallback is also the kill switch: unset the variable and every download
// quietly reverts to the old report.

export type ServerReportResult =
  | { ok: true; blob: Blob; ms: number }
  | { ok: false; reason: string; ms: number };

/** Long enough for a cold start (~4-5 s on Vercel), short enough not to strand anyone. */
const TIMEOUT_MS = 20_000;

export async function fetchServerReport(input: ReportInput, theme: ReportTheme): Promise<ServerReportResult> {
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/report-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, theme }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, ms: ms() };
    if (!(res.headers.get("content-type") ?? "").includes("application/pdf")) {
      return { ok: false, reason: "not_pdf", ms: ms() };
    }
    return { ok: true, blob: await res.blob(), ms: ms() };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return { ok: false, reason: aborted ? "timeout" : "network", ms: ms() };
  } finally {
    clearTimeout(timer);
  }
}

/** "FPC-Report-AB12CDE-2026-10-12.pdf", with "-print" for the light edition. */
export function reportFilename(reg: string, theme: ReportTheme): string {
  const plate = reg.replace(/\s+/g, "").toUpperCase();
  return `FPC-Report-${plate}-${new Date().toISOString().slice(0, 10)}${theme === "light" ? "-print" : ""}.pdf`;
}
