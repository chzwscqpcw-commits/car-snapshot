import { NextRequest, NextResponse } from "next/server";
import recallsData from "@/data/recalls.json";
import { findRecalls, type Recall } from "@/lib/recalls";
import { supabaseServer } from "@/lib/supabaseServer";

/** Max age for Supabase cached recalls data (7 days in ms) */
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Try to load recalls from Supabase data_cache table.
 * Returns the cached data if found and less than 7 days old, otherwise null.
 */
async function getCachedRecalls(): Promise<Recall[] | null> {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from("data_cache")
      .select("data, updated_at")
      .eq("key", "recalls")
      .single();

    if (error || !data) return null;

    const updatedAt = new Date(data.updated_at).getTime();
    const age = Date.now() - updatedAt;

    if (age > CACHE_MAX_AGE_MS) return null;

    return data.data as Recall[];
  } catch {
    // If Supabase is unavailable or table doesn't exist, fall back silently
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const make = searchParams.get("make") ?? undefined;
  const model = searchParams.get("model") ?? undefined;
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr, 10) : undefined;

  if (!make) {
    return NextResponse.json({ error: "make parameter is required" }, { status: 400 });
  }

  // Try Supabase cache first (refreshed weekly by cron), fall back to static JSON
  const recalls = (await getCachedRecalls()) ?? (recallsData as Recall[]);

  const results = findRecalls(recalls, make, model, year);

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
