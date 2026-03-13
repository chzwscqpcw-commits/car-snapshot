import { NextRequest, NextResponse } from "next/server";

const SITE_URL = "https://www.freeplatecheck.co.uk";

/**
 * POST /api/ping-google?slug=best-time-to-buy-used-car-uk
 *
 * Submits a blog post URL to Google's Indexing API for faster crawling.
 * Requires GOOGLE_INDEXING_KEY env var (service account JSON key, base64-encoded).
 *
 * Fallback: if no Indexing API credentials are configured, pings Google's
 * sitemap notification endpoint instead (less reliable but zero config).
 */
export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  const url = `${SITE_URL}/blog/${slug}`;

  // Try Google Indexing API if credentials are available
  const indexingKey = process.env.GOOGLE_INDEXING_KEY;
  if (indexingKey) {
    try {
      const keyJson = JSON.parse(Buffer.from(indexingKey, "base64").toString());
      const token = await getGoogleAccessToken(keyJson);

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
 * Minimal Google OAuth2 token exchange using service account JWT.
 */
async function getGoogleAccessToken(key: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = btoa(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  // Sign with Web Crypto API
  const encoder = new TextEncoder();
  const pemBody = key.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(`${header}.${claim}`)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${header}.${claim}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}
