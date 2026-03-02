export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token || !/^[0-9a-f-]{36}$/.test(token)) {
    return NextResponse.redirect(new URL("/unsubscribe?status=invalid", req.url));
  }

  try {
    const sb = supabaseServer();

    const { data, error } = await sb
      .from("mot_reminders")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .eq("active", true)
      .select("id");

    if (error) {
      console.error("unsubscribe_error:", error);
      return NextResponse.redirect(new URL("/unsubscribe?status=error", req.url));
    }

    if (!data || data.length === 0) {
      return NextResponse.redirect(new URL("/unsubscribe?status=not-found", req.url));
    }

    return NextResponse.redirect(new URL("/unsubscribe?status=success", req.url));
  } catch {
    return NextResponse.redirect(new URL("/unsubscribe?status=error", req.url));
  }
}
