import { NextResponse } from "next/server";

/**
 * Server-side gate for the /api/admin/* JSON endpoints.
 *
 * These power the PIN-gated /data-health dashboard, but the API routes
 * themselves were previously open — anyone hitting the URL got the data. The
 * dashboard now sends the owner-entered PIN as an `x-admin-pin` header; we
 * validate it here against ADMIN_PIN (env), falling back to the legacy PIN so
 * the dashboard keeps working until the env var is set in Vercel.
 *
 * Note: a short PIN is a gate, not strong auth — but it closes the open API.
 * For real hardening, set a long ADMIN_PIN secret in the Vercel env.
 */
const ADMIN_PIN = process.env.ADMIN_PIN || "4533";

/** Returns a 401 NextResponse if the request isn't authorised, else null. */
export function adminGate(req: Request): NextResponse | null {
  const pin = req.headers.get("x-admin-pin");
  if (!pin || pin !== ADMIN_PIN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
