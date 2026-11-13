import { NextResponse } from "next/server";

/**
 * Server-side gate for the /api/admin/* JSON endpoints.
 *
 * These power the PIN-gated /data-health dashboard. The dashboard sends the
 * owner-entered PIN as an `x-admin-pin` header and we compare it with the
 * ADMIN_PIN environment variable.
 *
 * There is no fallback. A deployment without its own ADMIN_PIN refuses every
 * request: these routes read with the service-role key, and this repository
 * is public, so a default written here would be a published password. Each
 * Vercel environment (Production, Preview) needs ADMIN_PIN set for
 * /data-health to open there.
 *
 * Note: a short PIN is a gate, not strong auth. Use a long random value.
 */

/** Returns a 401 NextResponse if the request isn't authorised, else null. */
export function adminGate(req: Request): NextResponse | null {
  // Unset, empty or blank all mean "no PIN configured", which refuses.
  const expected = process.env.ADMIN_PIN ?? "";
  const pin = req.headers.get("x-admin-pin");
  if (!expected.trim() || !pin || pin !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
