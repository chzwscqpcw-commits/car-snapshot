export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminGate } from "@/lib/admin-auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { blankPartnerOrders, getPartnerOrders, samplePartnerOrders } from "@/lib/partner-orders";

export const dynamic = "force-dynamic";

/**
 * The "Partner orders" panel on /data-health: orders and commission from the
 * Rakuten reports, by placement, with the click reconciliation.
 *
 * Stricter than the other admin routes. admin-auth.ts falls back to a legacy
 * PIN when ADMIN_PIN is not set, and this repository is public, so on a
 * deployment without its own ADMIN_PIN (a preview, say) the real figures are
 * not served at all. `?sample=1` returns an invented week instead, so the
 * panel can still be looked at there.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const denied = adminGate(req);
  if (denied) return denied;

  const now = Date.now();
  if (new URL(req.url).searchParams.get("sample") === "1") {
    return NextResponse.json(samplePartnerOrders(now));
  }
  if (!process.env.ADMIN_PIN) {
    return NextResponse.json(
      blankPartnerOrders("locked", "Hidden on this deployment: it has no ADMIN_PIN of its own. Open /data-health?partner-orders=sample to see the panel with made-up figures."),
    );
  }
  return NextResponse.json(await getPartnerOrders(supabaseServer(), now));
}
