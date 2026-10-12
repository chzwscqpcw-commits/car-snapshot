import { renderReportHtml } from "@/lib/report-v2/document";
import { renderPdf } from "@/lib/report-v2/render";
import { SAMPLE_REPORT_INPUT } from "@/lib/report-v2/sample";
import { isReportTheme } from "@/lib/report-v2/theme";
import { clientIp, isProductionDeployment, rateLimited } from "@/lib/report-v2/request";

// GET /api/report-pdf/sample?theme=dark|light&format=pdf|html
// The sample report, for reviewing the design on preview deployments and
// locally. Never served in production.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request): Promise<Response> {
  if (isProductionDeployment()) return new Response("Not found", { status: 404 });
  if (rateLimited(clientIp(req.headers))) return new Response("Too many requests", { status: 429 });

  const params = new URL(req.url).searchParams;
  const themeParam = params.get("theme") ?? "dark";
  const theme = isReportTheme(themeParam) ? themeParam : "dark";
  const html = renderReportHtml(SAMPLE_REPORT_INPUT, { theme });

  if (params.get("format") === "html") {
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }
  try {
    const pdf = await renderPdf(html);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="FPC-Report-sample-${theme}.pdf"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    console.error("report-pdf sample render failed:", err);
    return new Response(`Render failed: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
  }
}
