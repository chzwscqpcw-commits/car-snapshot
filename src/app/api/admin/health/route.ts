export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type ServiceStatus = {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  latencyMs?: number;
};

type HealthResponse = {
  status: "healthy" | "degraded" | "unhealthy";
  checkedAt: string;
  services: ServiceStatus[];
};

async function checkSupabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const sb = supabaseServer();
    const { count, error } = await sb
      .from("vehicle_lookups")
      .select("*", { count: "exact", head: true })
      .abortSignal(AbortSignal.timeout(8000));

    if (error) throw new Error(error.message);

    return {
      name: "Supabase",
      status: "ok",
      message: `Connected — ${count?.toLocaleString() ?? "?"} cached lookups`,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: "Supabase",
      status: "error",
      message: err?.message || "Connection failed",
      latencyMs: Date.now() - start,
    };
  }
}

async function checkDvla(): Promise<ServiceStatus> {
  const key = process.env.DVLA_X_API_KEY;
  if (!key) {
    return { name: "DVLA", status: "error", message: "API key not configured" };
  }
  return { name: "DVLA", status: "ok", message: "API key configured" };
}

async function checkMot(): Promise<ServiceStatus> {
  const tenantId = process.env.MOT_TENANT_ID;
  const clientId = process.env.MOT_CLIENT_ID;
  const clientSecret = process.env.MOT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    return { name: "MOT (DVSA)", status: "error", message: "OAuth2 credentials missing" };
  }

  const start = Date.now();
  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://tapi.dvsa.gov.uk/.default",
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        name: "MOT (DVSA)",
        status: "error",
        message: `Token request failed (${response.status})`,
        latencyMs: Date.now() - start,
      };
    }

    return {
      name: "MOT (DVSA)",
      status: "ok",
      message: "OAuth2 token OK",
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: "MOT (DVSA)",
      status: "error",
      message: err?.message || "Token fetch failed",
      latencyMs: Date.now() - start,
    };
  }
}

async function checkEbay(): Promise<ServiceStatus> {
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;

  if (!appId || !certId) {
    return { name: "eBay", status: "warning", message: "Credentials not configured (degrades gracefully)" };
  }

  const start = Date.now();
  try {
    const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");
    const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        name: "eBay",
        status: "warning",
        message: `Token request failed (${response.status})`,
        latencyMs: Date.now() - start,
      };
    }

    return {
      name: "eBay",
      status: "ok",
      message: "OAuth2 token OK",
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: "eBay",
      status: "warning",
      message: err?.message || "Token fetch failed",
      latencyMs: Date.now() - start,
    };
  }
}

// ── Fuel Prices ──────────────────────────────────────────────────────────────

const FUEL_CSV_URL =
  "https://assets.publishing.service.gov.uk/media/6993252f7da91680ad7f44a1/CSV__2018_-____3_.csv";

function parseFuelDate(ukDate: string): string {
  const parts = ukDate.split("/");
  if (parts.length !== 3) return ukDate;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

async function checkFuelPrices(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch(FUEL_CSV_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      return {
        name: "Fuel Prices",
        status: "warning",
        message: `CSV fetch failed (${res.status})`,
        latencyMs: Date.now() - start,
      };
    }

    const text = await res.text();
    const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);
    const lastLine = lines[lines.length - 1];
    const cols = lastLine.split(",").map((s) => s.trim());

    const petrol = parseFloat(cols[1]);
    const diesel = parseFloat(cols[2]);
    const dateStr = parseFuelDate(cols[0]);

    if (isNaN(petrol) || isNaN(diesel)) {
      return {
        name: "Fuel Prices",
        status: "warning",
        message: "Failed to parse prices from CSV",
        latencyMs: Date.now() - start,
      };
    }

    const priceDate = new Date(dateStr);
    const daysOld = Math.floor((Date.now() - priceDate.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = priceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const priceInfo = `Petrol ${Math.round(petrol)}p · Diesel ${Math.round(diesel)}p (${formattedDate})`;

    if (daysOld > 14) {
      return {
        name: "Fuel Prices",
        status: "warning",
        message: `${priceInfo} — data is ${daysOld}d old`,
        latencyMs: Date.now() - start,
      };
    }

    return {
      name: "Fuel Prices",
      status: "ok",
      message: priceInfo,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: "Fuel Prices",
      status: "warning",
      message: err?.message || "Fetch failed",
      latencyMs: Date.now() - start,
    };
  }
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const services = await Promise.all([
    checkSupabase(),
    checkDvla(),
    checkMot(),
    checkEbay(),
    checkFuelPrices(),
  ]);

  const hasError = services.some((s) => s.status === "error");
  const hasWarning = services.some((s) => s.status === "warning");

  const status: HealthResponse["status"] = hasError
    ? "unhealthy"
    : hasWarning
      ? "degraded"
      : "healthy";

  return NextResponse.json({
    status,
    checkedAt: new Date().toISOString(),
    services,
  });
}
