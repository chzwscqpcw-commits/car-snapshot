import { NextResponse } from "next/server";
import { newRunToken } from "@/lib/wrong-turn-league";

// Issued when a run of the 404 game starts; needed to enter the league.
export async function POST() {
  return NextResponse.json({ token: newRunToken() }, { headers: { "Cache-Control": "no-store" } });
}
