export const runtime = "nodejs";
// Each report can take well over a minute to come back (see FETCH_TIMEOUT_MS
// in rakuten-reports.ts); the two are fetched side by side.
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { supabaseServerRole } from "@/lib/supabaseServer";
import { pullRakutenReports } from "@/lib/partner-orders";
import { rakutenConfig } from "@/lib/rakuten-reports";

// Daily (vercel.json). Fetches the two saved Rakuten reports from their
// "Get API" links and stores them in the private tables (partner-orders.ts),
// so the Friday email and /data-health can show orders by placement without a
// hand export.
//
// Quiet by design: this route never emails. Until the two links are set it
// answers "not_connected" and does nothing; a failed fetch is a 502 here and a
// "last successful pull" line in the email. What it returns and logs is counts
// and plain messages only, never a link (each holds a token) and never a row.

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ?dry=1 fetches and reads both reports and writes nothing.
  const dry = new URL(req.url).searchParams.get("dry") === "1";

  const config = rakutenConfig();
  if (config.missing.length > 0) {
    return NextResponse.json({ ok: true, state: "not_connected", missing: config.missing });
  }

  let store: ReturnType<typeof supabaseServerRole>;
  try {
    store = supabaseServerRole();
  } catch {
    // Without the service role there is nowhere private to put the rows.
    return NextResponse.json({ ok: true, state: "no_store" });
  }

  const reports = await pullRakutenReports(store, config, Date.now(), { dry });
  const failed = reports.filter((r) => !r.ok);
  if (failed.length === 0) {
    return NextResponse.json({ ok: true, state: "pulled", dry, reports });
  }
  if (failed.every((r) => r.tableMissing)) {
    // The links are in but the migration has not been run: not an error yet.
    return NextResponse.json({ ok: true, state: "no_table", dry, reports });
  }
  for (const r of failed) console.error(`rakuten_reports_error: ${r.report}: ${r.error}`);
  return NextResponse.json({ ok: false, state: "failed", dry, reports }, { status: 502 });
}
