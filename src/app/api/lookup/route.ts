export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";

// ============================================
// CONFIGURATION
// ============================================

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// MOT History API
const MOT_API_KEY = process.env.MOT_API_KEY;
const MOT_API_URL = "https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests";

// DVLA Vehicle Enquiry API
const DVLA_API_KEY = process.env.DVLA_X_API_KEY;

// ============================================
// TYPES
// ============================================

type MOTTest = {
  completedDate: string;
  testResult: "PASSED" | "FAILED" | "NO DETAILS HELD";
  expiryDate?: string;
  odometer?: {
    value: number;
    unit: string;
  };
  motTestNumber?: string;
  rfrAndComments?: Array<{
    text: string;
    type: "COMMENT" | "DEFECT" | "ADVISORY";
  }>;
};

type MOTHistoryData = {
  registration: string;
  make?: string;
  model?: string;
  variant?: string;
  colour?: string;
  firstUsedDate?: string;
  fuelType?: string;
  motTests?: MOTTest[];
};

type VehicleData = {
  registrationNumber: string;
  make?: string;
  model?: string;
  colour?: string;
  fuelType?: string;
  engineCapacity?: number;
  yearOfManufacture?: number;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  monthOfFirstRegistration?: string;
  dateOfFirstRegistration?: string;
  dateOfLastV5CIssued?: string;
  markedForExport?: boolean;
  co2Emissions?: number;
  euroStatus?: string;
  realDrivingEmissions?: number;
  wheelplan?: string;
  revenueWeight?: number;
  typeApproval?: string;
  automatedVehicle?: boolean;
  additionalRateEndDate?: string;
  // New MOT History fields
  variant?: string;
  motTests?: MOTTest[];
  motTestsLastUpdated?: string;
};

type CombinedResponse = {
  ok: true;
  data: VehicleData;
  source: "dvla" | "mock";
  motSource?: "api" | "dvla" | "none";
  cached: boolean;
  vrmHash: string;
};

type ErrorResponse = {
  ok: false;
  error: string;
};

type ApiResponse = CombinedResponse | ErrorResponse;

// ============================================
// UTILITIES
// ============================================

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function normalizeVrm(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function looksLikeVrm(vrm: string) {
  return vrm.length >= 2 && vrm.length <= 8;
}

function hashVrm(vrm: string) {
  const salt = process.env.VRM_SALT || "change-me";
  return crypto.createHash("sha256").update(`${salt}:${vrm}`).digest("hex");
}

function mockDvlaResponse(registrationNumber: string) {
  return {
    registrationNumber,
    make: "TESLA",
    model: "MODEL 3",
    colour: "WHITE",
    fuelType: "ELECTRICITY",
    engineCapacity: 0,
    yearOfManufacture: 2025,
    taxStatus: "Taxed",
    taxDueDate: "2026-05-01",
    motStatus: "No details held by DVLA",
    motExpiryDate: undefined,
    monthOfFirstRegistration: "2025-06",
  };
}

// ============================================
// MOT HISTORY API
// ============================================

async function fetchMOTHistory(registrationNumber: string): Promise<MOTHistoryData | null> {
  if (!MOT_API_KEY || !MOT_API_URL) {
    console.warn("MOT API key not configured");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const url = `${MOT_API_URL}?registration=${registrationNumber}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json+v6",
        "x-api-key": MOT_API_KEY,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`MOT: Vehicle not found for ${registrationNumber}`);
        return null;
      }
      console.error(`MOT API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as any;
    
    // The response is an array of vehicles directly (not wrapped in object)
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    
    return null;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("MOT request timeout");
    } else {
      console.error("MOT fetch error:", error);
    }
    return null;
  }
}

// ============================================
// DVLA VEHICLE ENQUIRY API
// ============================================

async function fetchFromDvla(registrationNumber: string): Promise<VehicleData | { error: string; status: number } | null> {
  const endpoint =
    process.env.DVLA_ENV === "uat"
      ? "https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles"
      : "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

  const apiKey = DVLA_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ registrationNumber }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = (await resp.json()) as VehicleData;

    if (!resp.ok) {
      const message =
        resp.status === 404
          ? "Vehicle not found."
          : resp.status === 429
            ? "Too many requests. Try again later."
            : "DVLA service error. Try again.";
      return { error: message, status: resp.status };
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { error: "DVLA request timed out. Please try again.", status: 504 };
    }
    return { error: "Network error contacting DVLA. Please try again.", status: 503 };
  }
}

// ============================================
// COMBINE DATA
// ============================================

function combineVehicleData(dvlaData: VehicleData, motData: MOTHistoryData | null): VehicleData {
  const combined = { ...dvlaData };

  // Enhance with MOT data if available
  if (motData) {
    // Use MOT variant if available (often more detailed)
    if (motData.variant) {
      combined.variant = motData.variant;
    }

    // Use MOT model if DVLA doesn't have it
    if (motData.model && !combined.model) {
      combined.model = motData.model;
    }

    // Add MOT test history
    if (motData.motTests && motData.motTests.length > 0) {
      combined.motTests = motData.motTests;
      combined.motTestsLastUpdated = new Date().toISOString();

      // Update MOT expiry from latest test
      const latestTest = motData.motTests[0];
      if (latestTest.expiryDate) {
        combined.motExpiryDate = latestTest.expiryDate;
        combined.motStatus = latestTest.testResult === "PASSED" ? "Passed" : latestTest.testResult;
      }
    }
  }

  return combined;
}

// ============================================
// MAIN POST HANDLER
// ============================================

export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
  try {
    // Rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait a minute." } as ErrorResponse,
        { status: 429 }
      );
    }

    // Parse and validate
    const body = await req.json();
    const vrm = normalizeVrm(String(body?.vrm ?? ""));

    if (!looksLikeVrm(vrm)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid UK registration (VRM)." } as ErrorResponse,
        { status: 400 }
      );
    }

    const sb = supabaseServer();
    const vrmHash = hashVrm(vrm);

    // Check cache
    const { data: cached, error: cacheErr } = await sb
      .from("vehicle_lookups")
      .select("data, source, expires_at")
      .eq("vrm_hash", vrmHash)
      .maybeSingle();

    if (cacheErr) {
      console.error("cache_read_error:", cacheErr.message);
    }

    const hasDvlaKey = Boolean(DVLA_API_KEY);

    // Return cached if valid
    if (cached?.expires_at && new Date(cached.expires_at) > new Date()) {
      if (!(hasDvlaKey && cached.source === "mock")) {
        return NextResponse.json({
          ok: true,
          data: cached.data,
          source: cached.source,
          cached: true,
          vrmHash,
        } as CombinedResponse);
      }
    }

    // Fetch fresh data (in parallel for speed)
    console.log(`[LOOKUP] Fetching data for VRM: ${vrm}`);
    const [dvlaResult, motData] = await Promise.all([
      fetchFromDvla(vrm),
      fetchMOTHistory(vrm),
    ]);

    console.log(`[LOOKUP] DVLA Result:`, dvlaResult ? "✅ Got data" : "❌ No data or error");
    console.log(`[LOOKUP] MOT Data:`, motData ? "✅ Got MOT history" : "❌ No MOT data");
    if (motData) {
      console.log(`[LOOKUP] MOT Tests:`, motData.motTests?.length || 0, "records");
      console.log(`[LOOKUP] MOT Model:`, motData.model || "no model");
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updatedAt = new Date().toISOString();

    // Handle DVLA errors
    if (dvlaResult && "error" in dvlaResult) {
      return NextResponse.json(
        { ok: false, error: dvlaResult.error } as ErrorResponse,
        { status: dvlaResult.status }
      );
    }

    // Use DVLA data or fall back to mock
    const vehicleData = dvlaResult || mockDvlaResponse(vrm);
    const combinedData = combineVehicleData(vehicleData, motData);

    // Cache result
    const { error: upsertErr } = await sb.from("vehicle_lookups").upsert({
      vrm_hash: vrmHash,
      data: combinedData,
      source: dvlaResult ? "dvla" : "mock",
      expires_at: expiresAt,
      updated_at: updatedAt,
    });

    if (upsertErr) {
      console.error("cache_write_error:", upsertErr.message);
    }

    return NextResponse.json({
      ok: true,
      data: combinedData,
      source: dvlaResult ? "dvla" : "mock",
      motSource: motData ? "api" : "dvla",
      cached: false,
      vrmHash,
    } as CombinedResponse);
  } catch (err: any) {
    console.error("lookup_error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "Server error. Please try again." } as ErrorResponse,
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" } as ErrorResponse,
    { status: 405 }
  );
}