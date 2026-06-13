/**
 * Minimal Google service-account OAuth2 — exchanges a service-account key for a
 * scoped access token via a signed JWT (Web Crypto, no node deps). Shared by the
 * Indexing API (/api/ping-google, scope `.../indexing`) and the Search Console
 * API (/lib/gsc, scope `.../webmasters.readonly`).
 *
 * The same service account can do both, provided (a) both APIs are enabled in
 * the GCP project and (b) for Search Console, the service-account email is added
 * as a user on the GSC property.
 */

export interface GoogleServiceKey {
  client_email: string;
  private_key: string;
}

/**
 * Decode the base64-encoded service-account JSON from GOOGLE_INDEXING_KEY.
 * Returns null when unset or malformed so callers can degrade gracefully.
 */
export function loadGoogleServiceKey(): GoogleServiceKey | null {
  const raw = process.env.GOOGLE_INDEXING_KEY;
  if (!raw) return null;
  try {
    const json = JSON.parse(Buffer.from(raw, "base64").toString());
    if (!json.client_email || !json.private_key) return null;
    return json as GoogleServiceKey;
  } catch {
    return null;
  }
}

/**
 * OAuth refresh-token auth — for accessing your OWN Google data (e.g. the
 * Search Console property your account owns) without a downloadable service-
 * account key. Set GSC_OAUTH_CLIENT_ID, GSC_OAUTH_CLIENT_SECRET and
 * GSC_OAUTH_REFRESH_TOKEN (obtained once via the consent flow). The scope is
 * baked into the refresh token at grant time, so it isn't passed here.
 */
export function hasGscOAuth(): boolean {
  return Boolean(
    process.env.GSC_OAUTH_CLIENT_ID &&
      process.env.GSC_OAUTH_CLIENT_SECRET &&
      process.env.GSC_OAUTH_REFRESH_TOKEN,
  );
}

/** Mint a short-lived access token from the stored OAuth refresh token. */
export async function getOAuthAccessToken(): Promise<string> {
  const clientId = process.env.GSC_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GSC_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GSC_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("GSC OAuth env vars not set");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(
      `OAuth token refresh failed: ${data.error_description || data.error || "no access_token returned"}`,
    );
  }
  return data.access_token as string;
}

/** Exchange a service-account key for an access token scoped to `scope`. */
export async function getGoogleAccessToken(
  key: GoogleServiceKey,
  scope: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = btoa(
    JSON.stringify({
      iss: key.client_email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );

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
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(`${header}.${claim}`),
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
  if (!tokenData.access_token) {
    throw new Error(
      `Google token exchange failed: ${tokenData.error_description || tokenData.error || "no access_token returned"}`,
    );
  }
  return tokenData.access_token as string;
}
