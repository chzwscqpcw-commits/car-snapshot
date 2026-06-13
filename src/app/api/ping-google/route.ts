import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken, loadGoogleServiceKey } from "@/lib/google-auth";

const SITE_URL = "https://www.freeplatecheck.co.uk";

/**
 * POST /api/ping-google?slug=<blog-slug>
 * POST /api/ping-google?path=/repair-costs/aircon-regas
 *
 * Submits a URL to Google's Indexing API for faster crawling. Accepts either:
 *   - `slug` — kept for back-compat; resolves to /blog/<slug>
 *   - `path` — any absolute path on the site (must start with /)
 *
 * Requires GOOGLE_INDEXING_KEY env var (service account JSON key, base64-encoded).
 *
 * Fallback: if no Indexing API credentials are configured, pings Google's
 * sitemap notification endpoint instead (less reliable but zero config).
 *
 * Note: Google's Indexing API is officially only authoritative for JobPosting
 * and BroadcastEvent schemas. For other URL types it may still nudge crawl
 * rate but is not guaranteed to trigger indexing.
 */
export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const path = req.nextUrl.searchParams.get("path");

  let resolvedPath: string;
  if (path) {
    if (!isSafeRelativePath(path)) {
      return NextResponse.json(
        { error: "Invalid path. Must start with `/` and contain no protocol or host." },
        { status: 400 }
      );
    }
    resolvedPath = path;
  } else if (slug) {
    if (!isSafeSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
    }
    resolvedPath = `/blog/${slug}`;
  } else {
    return NextResponse.json(
      { error: "Missing `slug` or `path` parameter." },
      { status: 400 }
    );
  }

  const url = `${SITE_URL}${resolvedPath}`;

  // Try Google Indexing API if credentials are available
  const serviceKey = loadGoogleServiceKey();
  if (serviceKey) {
    try {
      const token = await getGoogleAccessToken(
        serviceKey,
        "https://www.googleapis.com/auth/indexing",
      );

      const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          type: "URL_UPDATED",
        }),
      });

      const data = await res.json();
      console.log(`[ping-google] Indexing API response for ${url}:`, data);

      return NextResponse.json({ ok: true, method: "indexing-api", url, response: data });
    } catch (err) {
      console.error("[ping-google] Indexing API error:", err);
      // Fall through to sitemap ping
    }
  }

  // Fallback: sitemap ping (no auth required)
  try {
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(`${SITE_URL}/sitemap.xml`)}`;
    const res = await fetch(pingUrl);
    console.log(`[ping-google] Sitemap ping for ${url}: ${res.status}`);

    return NextResponse.json({
      ok: true,
      method: "sitemap-ping",
      url,
      note: "Sitemap ping sent. For faster indexing, set GOOGLE_INDEXING_KEY env var.",
    });
  } catch (err) {
    console.error("[ping-google] Sitemap ping error:", err);
    return NextResponse.json({ error: "Failed to ping Google" }, { status: 500 });
  }
}

/**
 * Path validation: must start with `/`, must not start with `//` (which would
 * change the host on protocol-relative URLs), and must contain no whitespace
 * or characters that could escape the path component.
 */
function isSafeRelativePath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (/[\s<>"'`]/.test(path)) return false;
  if (path.includes("..")) return false;
  if (path.length > 500) return false;
  return true;
}

function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,200}$/i.test(slug);
}
