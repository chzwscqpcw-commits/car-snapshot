export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { adminGate } from "@/lib/admin-auth";
import { readGscCache, refreshGscSnapshot } from "@/lib/gsc";

/** GET /api/admin/gsc — read the stored Search Console snapshot history. */
export async function GET(req: Request): Promise<NextResponse> {
  const denied = adminGate(req);
  if (denied) return denied;
  try {
    const cache = await readGscCache();
    if (!cache) return NextResponse.json({ status: "empty" });
    return NextResponse.json(cache);
  } catch (err) {
    return NextResponse.json({
      status: "error",
      reason: err instanceof Error ? err.message : String(err),
    });
  }
}

/** POST /api/admin/gsc — pull a fresh snapshot now (the dashboard refresh button). */
export async function POST(req: Request): Promise<NextResponse> {
  const denied = adminGate(req);
  if (denied) return denied;
  try {
    const cache = await refreshGscSnapshot();
    return NextResponse.json(cache);
  } catch (err) {
    return NextResponse.json({
      status: "error",
      reason: err instanceof Error ? err.message : String(err),
    });
  }
}
