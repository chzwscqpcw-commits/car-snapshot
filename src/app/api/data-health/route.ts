import { NextResponse } from "next/server";

import recalls from "@/data/recalls.json";
import fuelEconomy from "@/data/fuel-economy.json";
import ncapRatings from "@/data/ncap-ratings.json";
import newPrices from "@/data/new-prices.json";
import evSpecs from "@/data/ev-specs.json";
import howManyLeft from "@/data/how-many-left.json";
import motPassRates from "@/data/mot-pass-rates.json";
import motFailureReasons from "@/data/mot-failure-reasons.json";
import bodyTypes from "@/data/body-types.json";
import theftRisk from "@/data/theft-risk.json";
import colourPopularity from "@/data/colour-popularity.json";
import tyreSizes from "@/data/tyre-sizes.json";
import vehicleDimensions from "@/data/vehicle-dimensions.json";

export const dynamic = "force-static";

const BUILD_TIME = new Date().toISOString();
const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

function count(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (typeof data === "object" && data !== null) return Object.keys(data).length;
  return 0;
}

export async function GET() {
  const files = [
    { file: "recalls.json", entries: count(recalls) },
    { file: "fuel-economy.json", entries: count(fuelEconomy) },
    { file: "ncap-ratings.json", entries: count(ncapRatings) },
    { file: "new-prices.json", entries: count(newPrices) },
    { file: "ev-specs.json", entries: count(evSpecs) },
    { file: "how-many-left.json", entries: count(howManyLeft) },
    { file: "mot-pass-rates.json", entries: count(motPassRates) },
    { file: "mot-failure-reasons.json", entries: count(motFailureReasons) },
    { file: "body-types.json", entries: count(bodyTypes) },
    { file: "theft-risk.json", entries: count(theftRisk) },
    { file: "colour-popularity.json", entries: count(colourPopularity) },
    { file: "tyre-sizes.json", entries: count(tyreSizes) },
    { file: "vehicle-dimensions.json", entries: count(vehicleDimensions) },
  ];

  const totalEntries = files.reduce((sum, f) => sum + f.entries, 0);

  return NextResponse.json({
    status: "ok",
    buildTime: BUILD_TIME,
    commit: COMMIT,
    totalEntries,
    files,
  });
}
