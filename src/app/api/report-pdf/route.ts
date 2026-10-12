import { renderReportHtml } from "@/lib/report-v2/document";
import { renderPdf } from "@/lib/report-v2/render";
import { clientIp, parseReportRequest, rateLimited, reportFilename, reportV2Enabled } from "@/lib/report-v2/request";

// POST { input: ReportInput, theme: "dark" | "light" } → the magazine-style
// PDF report, rendered server-side by headless Chromium (see lib/report-v2).
// Takes the same input the client-side jsPDF report (lib/generateReport.ts)
// already builds, so the results page can switch over without new plumbing.
// Off in production until REPORT_V2_ENABLED=1.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  if (!reportV2Enabled()) return new Response("Not found", { status: 404 });
  if (rateLimited(clientIp(req.headers))) {
    return Response.json({ ok: false, error: "Too many reports, please wait a minute" }, { status: 429 });
  }

  const parsed = parseReportRequest(await req.text());
  if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: parsed.status });

  try {
    const now = new Date();
    const pdf = await renderPdf(renderReportHtml(parsed.input, { theme: parsed.theme, now }));
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportFilename(parsed.input.data.registrationNumber, parsed.theme, now)}"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    console.error("report-pdf render failed:", err);
    return Response.json({ ok: false, error: "Could not render the report" }, { status: 500 });
  }
}
