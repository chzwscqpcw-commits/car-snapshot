import { NextRequest, NextResponse } from "next/server";
import recallsData from "@/data/recalls.json";
import { findRecalls, type Recall } from "@/lib/recalls";

// The committed recalls.json is the source of truth: the Sunday refresh job
// (refresh-data.yml) drives a real browser past DVSA's Imperva protection,
// validates the result against the previous week and commits it. A Monday
// Vercel cron used to try a plain fetch of the same CSV into Supabase
// data_cache and read it here first — but a plain fetch cannot pass Imperva
// (it 302s into the JS challenge, checked 2026-11-01), so the cache was
// never fresher than the file. Removed in 2026-11.

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const make = searchParams.get("make") ?? undefined;
  const model = searchParams.get("model") ?? undefined;
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr, 10) : undefined;

  if (!make) {
    return NextResponse.json({ error: "make parameter is required" }, { status: 400 });
  }

  const recalls = recallsData as Recall[];

  const results = findRecalls(recalls, make, model, year);

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
