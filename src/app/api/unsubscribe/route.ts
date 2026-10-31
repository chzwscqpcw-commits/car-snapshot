export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer, supabaseServerRole } from "@/lib/supabaseServer";

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

    if (data && data.length > 0) {
      return NextResponse.redirect(new URL("/unsubscribe?status=success", req.url));
    }

    // Not an MOT reminder: a saved car's "stop alerts" link uses the same
    // route (its manage_token is a UUID too, so the two can't collide).
    const { data: car, error: carError } = await supabaseServerRole()
      .from("saved_cars")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("manage_token", token)
      .eq("active", true)
      .select("id");

    if (carError && carError.code !== "42P01") {
      console.error("unsubscribe_saved_car_error:", carError.message);
      return NextResponse.redirect(new URL("/unsubscribe?status=error", req.url));
    }
    if (car && car.length > 0) {
      return NextResponse.redirect(new URL("/unsubscribe?status=success&what=alerts", req.url));
    }

    return NextResponse.redirect(new URL("/unsubscribe?status=not-found", req.url));
  } catch {
    return NextResponse.redirect(new URL("/unsubscribe?status=error", req.url));
  }
}
