import { NextRequest, NextResponse } from "next/server";
import recallsData from "@/data/recalls.json";
import { findRecalls, type Recall } from "@/lib/recalls";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const make = searchParams.get("make") ?? undefined;
  const model = searchParams.get("model") ?? undefined;
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr, 10) : undefined;

  if (!make) {
    return NextResponse.json({ error: "make parameter is required" }, { status: 400 });
  }

  const results = findRecalls(recallsData as Recall[], make, model, year);

  return NextResponse.json(results);
}
