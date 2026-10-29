import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseServerRole } from "@/lib/supabaseServer";
import { bestPerInitials, checkRun, cleanInitials, weekStart, type LeagueRow } from "@/lib/wrong-turn-league";

// This week's league for the "Took a wrong turn" 404 game. Reads and writes
// go through the service role; the table has RLS on and no public policies
// (docs/migrations/2026-10-29-wrong-turn-league.sql). Until that table exists
// every call answers { available: false } and the game hides the league.

const TOP = 10;
const MAX_ENTRIES_PER_IP_PER_WEEK = 40;
const NO_STORE = { "Cache-Control": "no-store" };

async function thisWeek(week: string): Promise<LeagueRow[] | null> {
  const { data, error } = await supabaseServerRole()
    .from("wrong_turn_scores")
    .select("initials, seconds")
    .eq("week_start", week)
    .order("seconds", { ascending: true })
    .limit(500);
  if (error) {
    console.error("wrong_turn_league_read:", error.message);
    return null;
  }
  return bestPerInitials(data as LeagueRow[]);
}

export async function GET() {
  const week = weekStart();
  try {
    const rows = await thisWeek(week);
    if (!rows) return NextResponse.json({ available: false }, { headers: NO_STORE });
    return NextResponse.json({ available: true, week, top: rows.slice(0, TOP) }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ available: false }, { headers: NO_STORE });
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { initials?: unknown; seconds?: unknown; token?: unknown } | null;
  const initials = cleanInitials(body?.initials);
  if (!initials) return NextResponse.json({ ok: false, error: "Three letters, please (and keep it clean)." }, { status: 400 });
  const seconds = typeof body?.seconds === "number" ? Math.round(body.seconds * 10) / 10 : NaN;
  const run = checkRun(body?.token, seconds);
  if (!run.ok) return NextResponse.json({ ok: false, error: "That run can't be entered." }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  const ipHash = ip ? crypto.createHash("sha256").update(`${process.env.VRM_SALT || "change-me"}:${ip}`).digest("hex") : null;
  const week = weekStart();

  try {
    const sb = supabaseServerRole();
    if (ipHash) {
      const { count } = await sb
        .from("wrong_turn_scores")
        .select("id", { count: "exact", head: true })
        .eq("week_start", week)
        .eq("ip_hash", ipHash);
      if ((count ?? 0) >= MAX_ENTRIES_PER_IP_PER_WEEK) {
        return NextResponse.json({ ok: false, error: "That's plenty of entries for one week." }, { status: 429 });
      }
    }
    const { error } = await sb
      .from("wrong_turn_scores")
      .insert({ initials, seconds, week_start: week, run_id: run.runId, ip_hash: ipHash });
    // 23505 = this run was already entered; fine, just show the table.
    if (error && error.code !== "23505") {
      console.error("wrong_turn_league_write:", error.message);
      return NextResponse.json({ ok: false, error: "The league is closed for repairs. Try again later." }, { status: 503 });
    }
    const rows = (await thisWeek(week)) ?? [];
    const rank = rows.findIndex((r) => r.initials === initials) + 1;
    return NextResponse.json({ ok: true, week, rank, top: rows.slice(0, TOP) }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: "The league is closed for repairs. Try again later." }, { status: 503 });
  }
}
