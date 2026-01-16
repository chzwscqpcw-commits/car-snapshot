export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const MOT_API_KEY = process.env.MOT_API_KEY;
const MOT_TENANT_ID = process.env.MOT_TENANT_ID;
const MOT_CLIENT_ID = process.env.MOT_CLIENT_ID;
const MOT_CLIENT_SECRET = process.env.MOT_CLIENT_SECRET;
const MOT_API_URL = "https://history.mot.api.gov.uk/v1/trade/vehicles/registration";

const DVLA_API_KEY = process.env.DVLA_X_API_KEY;

let cachedMotToken: { token: string; expiresAt: number } | null = null;

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

function transformMotTest(apiTest: any): MOTTest {
  const transformed: MOTTest = {
    completedDate: apiTest.completedDate,
    testResult: apiTest.testResult || "NO DETAILS HELD",
    expiryDate: apiTest.expiryDate,
    motTestNumber: apiTest.motTestNumber,
  };

  // Transform odometer data
  if (apiTest.odometerValue) {
    transformed.odometer = {
      value: parseInt(apiTest.odometerValue, 10),
      unit: apiTest.odometerUnit || "MI",
    };
  }

  // Transform defects to rfrAndComments format
  const rfrAndComments: Array<{ text: string; type: "COMMENT" | "DEFECT" | "ADVISORY" }> = [];

  if (Array.isArray(apiTest.defects)) {
    apiTest.defects.forEach((defect: any) => {
      // Use the defect's type field to categorize
      let commentType: "COMMENT" | "DEFECT" | "ADVISORY" = "DEFECT";
      
      if (defect.type === "ADVISORY") {
        commentType = "ADVISORY";
      } else if (defect.type === "DANGEROUS" || defect.type === "MAJOR") {
        commentType = "DEFECT";
      }
      
      rfrAndComments.push({
        text: defect.text || "Unknown defect",
        type: commentType,
      });
    });
  }

  if (Array.isArray(apiTest.advisories)) {
    apiTest.advisories.forEach((advisory: any) => {
      rfrAndComments.push({
        text: advisory.advisoryText || advisory.text || "Unknown advisory",
        type: "ADVISORY",
      });
    });
  }

  if (Array.isArray(apiTest.comments)) {
    apiTest.comments.forEach((comment: any) => {
      rfrAndComments.push({
        text: comment.commentText || comment.text || "Unknown comment",
        type: "COMMENT",
      });
    });
  }

  if (rfrAndComments.length > 0) {
    transformed.rfrAndComments = rfrAndComments;
  }

  return transformed;
}

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

async function getMOTAuthToken(): Promise<string | null> {
  if (cachedMotToken && cachedMotToken.expiresAt > Date.now()) {
    console.log("[MOT] Using cached token");
    return cachedMotToken.token;
  }

  if (!MOT_TENANT_ID || !MOT_CLIENT_ID || !MOT_CLIENT_SECRET) {
    console.warn("[MOT] Missing OAuth2 credentials");
    return null;
  }

  try {
    console.log("[MOT] Fetching new authentication token");
    const tokenUrl = `https://login.microsoftonline.com/${MOT_TENANT_ID}/oauth2/v2.0/token`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: MOT_CLIENT_ID,
        client_secret: MOT_CLIENT_SECRET,
        scope: "https://tapi.dvsa.gov.uk/.default",
      }),
    });

    if (!response.ok) {
      console.error(`[MOT] Token request failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as any;
    const token = data.access_token;
    const expiresIn = data.expires_in || 3600;

    cachedMotToken = {
      token,
      expiresAt: Date.now() + (expiresIn - 300) * 1000,
    };

    console.log("[MOT] Token obtained successfully");
    return token;
  } catch (error: any) {
    console.error("[MOT] Token fetch error:", error?.message || error);
    return null;
  }
}

async function fetchMOTHistory(registrationNumber: string): Promise<MOTHistoryData | null> {
  if (!MOT_API_KEY) {
    console.warn("[MOT] API key not configured");
    return null;
  }

  const token = await getMOTAuthToken();
  if (!token) {
    console.warn("[MOT] Could not obtain authentication token");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const url = `${MOT_API_URL}/${registrationNumber}`;

    console.log(`[MOT] Fetching MOT history for ${registrationNumber}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-API-Key": MOT_API_KEY,
        "Accept": "application/json+v6",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[MOT] Vehicle not found: ${registrationNumber}`);
        return null;
      }
      if (response.status === 401 || response.status === 403) {
        console.error(`[MOT] Authentication failed (${response.status})`);
        return null;
      }
      console.error(`[MOT] API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as any;

    if (Array.isArray(data) && data.length > 0) {
      const motData = data[0];
      if (motData.motTests && Array.isArray(motData.motTests)) {
        motData.motTests = motData.motTests.map(transformMotTest);
      }
      console.log(`[MOT] Got data with ${motData.motTests?.length || 0} MOT tests`);
      return motData;
    }

    if (data && typeof data === "object") {
      if (data.motTests && Array.isArray(data.motTests)) {
        data.motTests = data.motTests.map(transformMotTest);
      }
      console.log(`[MOT] Got data with ${data.motTests?.length || 0} MOT tests`);
      return data;
    }

    return null;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("[MOT] Request timeout");
    } else {
      console.error("[MOT] Fetch error:", error?.message || error);
    }
    return null;
  }
}

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

function combineVehicleData(dvlaData: VehicleData, motData: MOTHistoryData | null): VehicleData {
  const combined = { ...dvlaData };

  if (motData) {
    if (motData.variant) {
      combined.variant = motData.variant;
    }

    if (motData.model && !combined.model) {
      combined.model = motData.model;
    }

    if (motData.motTests && motData.motTests.length > 0) {
      combined.motTests = motData.motTests;
      combined.motTestsLastUpdated = new Date().toISOString();

      const latestTest = motData.motTests[0];
      if (latestTest.expiryDate) {
        combined.motExpiryDate = latestTest.expiryDate;
        combined.motStatus = latestTest.testResult === "PASSED" ? "Valid" : latestTest.testResult;
      }
    }
  }

  return combined;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait a minute." } as ErrorResponse,
        { status: 429 }
      );
    }

    const body = await req.json();
    const vrm = normalizeVrm(String(body?.vrm ?? ""));
    const skipCache = Boolean(body?.skipCache);

    if (!looksLikeVrm(vrm)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid UK registration (VRM)." } as ErrorResponse,
        { status: 400 }
      );
    }

    const sb = supabaseServer();
    const vrmHash = hashVrm(vrm);

    const { data: cached, error: cacheErr } = await sb
      .from("vehicle_lookups")
      .select("data, source, expires_at")
      .eq("vrm_hash", vrmHash)
      .maybeSingle();

    if (cacheErr) {
      console.error("cache_read_error:", cacheErr.message);
    }

    const hasDvlaKey = Boolean(DVLA_API_KEY);

    if (!skipCache && cached?.expires_at && new Date(cached.expires_at) > new Date()) {
      if (!(hasDvlaKey && cached.source === "mock")) {
        console.log(`[LOOKUP] Using cached data for VRM: ${vrm}`);
        return NextResponse.json({
          ok: true,
          data: cached.data,
          source: cached.source,
          cached: true,
          vrmHash,
        } as CombinedResponse);
      }
    }

    console.log(`[LOOKUP] Fetching data for VRM: ${vrm}${skipCache ? " (cache skipped)" : ""}`);
    const [dvlaResult, motData] = await Promise.all([
      fetchFromDvla(vrm),
      fetchMOTHistory(vrm),
    ]);

    console.log(`[LOOKUP] DVLA Result:`, dvlaResult ? "Got data" : "No data or error");
    console.log(`[LOOKUP] MOT Data:`, motData ? "Got MOT history" : "No MOT data");
    if (motData) {
      console.log(`[LOOKUP] MOT Tests:`, motData.motTests?.length || 0, "records");
      console.log(`[LOOKUP] MOT Model:`, motData.model || "no model");
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updatedAt = new Date().toISOString();

    if (dvlaResult && "error" in dvlaResult) {
      return NextResponse.json(
        { ok: false, error: dvlaResult.error } as ErrorResponse,
        { status: dvlaResult.status }
      );
    }

    const vehicleData = dvlaResult || mockDvlaResponse(vrm);
    const combinedData = combineVehicleData(vehicleData, motData);

    const { error: upsertErr } = await sb.from("vehicle_lookups").upsert(
      {
        vrm_hash: vrmHash,
        data: combinedData,
        source: dvlaResult ? "dvla" : "mock",
        expires_at: expiresAt,
        updated_at: updatedAt,
      },
      { onConflict: "vrm_hash" }
    );

    if (upsertErr) {
      console.error("cache_write_error:", upsertErr.message);
    }

    return NextResponse.json({
      ok: true,
      data: combinedData,
      source: dvlaResult ? "dvla" : "mock",
      motSource: motData ? "api" : dvlaResult ? "dvla" : "none",
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