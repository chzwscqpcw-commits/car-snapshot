import { NextRequest, NextResponse } from "next/server";
import fuelData from "@/data/fuel-economy.json";
import { lookupFuelEconomy, type FuelEconomyEntry } from "@/lib/fuel-economy";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const make = searchParams.get("make") ?? undefined;
  const model = searchParams.get("model") ?? undefined;
  const engineStr = searchParams.get("engine");
  const engine = engineStr ? parseInt(engineStr, 10) : undefined;
  const fuel = searchParams.get("fuel") ?? undefined;

  if (!make || !model) {
    return NextResponse.json({ error: "make and model parameters are required" }, { status: 400 });
  }

  const result = lookupFuelEconomy(fuelData as FuelEconomyEntry[], make, model, engine, fuel);

  if (!result) {
    return NextResponse.json(null);
  }

  return NextResponse.json(result);
}
