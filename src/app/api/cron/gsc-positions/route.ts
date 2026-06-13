export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { refreshGscSnapshot } from "@/lib/gsc";

/**
 * GET /api/cron/gsc-positions — weekly Search Console snapshot.
 *
 * Pulls the tracked KEY_QUERIES positions (28-day avg) and appends them to a
 * rolling history in `data_cache` (key `gsc_positions`), so the dashboard can
 * show position-over-time for the queries that actually convert. CRON_SECRET-
 * gated, same as the recalls refresh.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await refreshGscSnapshot();
  return NextResponse.json({
    ok: payload.status === "ok",
    status: payload.status,
    reason: payload.reason,
    snapshotDate: payload.latest?.date ?? null,
    tracked: payload.latest?.queries.length ?? 0,
    snapshots: payload.history.length,
  });
}
