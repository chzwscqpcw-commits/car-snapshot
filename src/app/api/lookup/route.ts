export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { waitUntil } from "@vercel/functions";
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

type RawMotTest = {
  completedDate?: string;
  testResult?: string;
  expiryDate?: string;
  motTestNumber?: string;
  odometerValue?: string;
  odometerUnit?: string;
  defects?: Array<{ type?: string; text?: string }>;
  advisories?: Array<{ advisoryText?: string; text?: string }>;
  comments?: Array<{ commentText?: string; text?: string }>;
};

function transformMotTest(apiTest: RawMotTest): MOTTest {
  const transformed: MOTTest = {
    completedDate: apiTest.completedDate ?? "",
    testResult: (apiTest.testResult as MOTTest["testResult"]) || "NO DETAILS HELD",
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
    apiTest.defects.forEach((defect) => {
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
    apiTest.advisories.forEach((advisory) => {
      rfrAndComments.push({
        text: advisory.advisoryText || advisory.text || "Unknown advisory",
        type: "ADVISORY",
      });
    });
  }

  if (Array.isArray(apiTest.comments)) {
    apiTest.comments.forEach((comment) => {
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

    const data = await response.json();
    const token = data.access_token;
    const expiresIn = data.expires_in || 3600;

    cachedMotToken = {
      token,
      expiresAt: Date.now() + (expiresIn - 300) * 1000,
    };

    console.log("[MOT] Token obtained successfully");
    return token;
  } catch (error: unknown) {
    console.error("[MOT] Token fetch error:", (error as Error)?.message || error);
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
        // Credential rot is the quietest failure here: tokens expire, the page
        // still renders, and MOT history just silently stops appearing.
        recordLookupFailure({ stage: "mot", reason: "auth_failed", status: response.status });
        return null;
      }
      console.error(`[MOT] API error: ${response.status}`);
      recordLookupFailure({ stage: "mot", reason: "api_error", status: response.status });
      return null;
    }

    const data = await response.json();

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
  } catch (error: unknown) {
    if ((error as Error).name === "AbortError") {
      console.error("[MOT] Request timeout");
      recordLookupFailure({ stage: "mot", reason: "timeout" });
    } else {
      console.error("[MOT] Fetch error:", (error as Error)?.message || error);
      recordLookupFailure({ stage: "mot", reason: "network_error" });
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

  // DVLA's VES API occasionally returns a 5xx or times out transiently. Retry
  // once (after a short backoff) on those, so a momentary blip doesn't surface
  // as an error. Never retry 404 (not found) or 429 (rate limit) — a retry
  // won't help and would make 429 worse.
  const MAX_ATTEMPTS = 2;
  let transient: { error: string; status: number } = {
    error: "DVLA service error. Try again.",
    status: 503,
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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

      if (resp.ok) return data;

      // Non-transient outcomes: return immediately, no retry.
      if (resp.status === 404) return { error: "Vehicle not found.", status: 404 };
      if (resp.status === 429) return { error: "Too many requests. Try again later.", status: 429 };

      // Transient (5xx / other): remember it and retry if attempts remain.
      transient = { error: "DVLA service error. Try again.", status: resp.status };
    } catch (err: unknown) {
      clearTimeout(timeout);
      transient =
        (err as Error).name === "AbortError"
          ? { error: "DVLA request timed out. Please try again.", status: 504 }
          : { error: "Network error contacting DVLA. Please try again.", status: 503 };
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  return transient;
}

/**
 * Record a lookup failure to `site_events` as `lookup_error`.
 *
 * WHY: the `lookup` event fires only on the SUCCESS path, so every failure went
 * to console.error and died in Vercel logs. A total DVLA outage is loud — it
 * breaks the core product and users complain within minutes — but a PARTIAL
 * degradation is silent: a rising 5xx rate, or 429s creeping in as traffic
 * grows, still leaves most lookups working and nothing looking wrong. MOT is
 * worse still, because it fails to `null` and the page renders anyway, minus
 * the MOT history, with no signal anywhere that anything went missing.
 *
 * A separate event type rather than an `ok` flag on `lookup`, so the existing
 * `lookup` series keeps its meaning and stays comparable across this change.
 *
 * Error rate = lookup_error / (lookup + lookup_error), sliceable by `stage`.
 *
 * NOT logged: 404s from either API. A plate that isn't registered is a normal
 * user outcome, not a fault, and folding it in would drown the signal we want.
 *
 * Fire-and-forget, and wrapped — telemetry must never break a lookup.
 */
function recordLookupFailure(meta: {
  stage: "dvla" | "mot" | "internal";
  reason: string;
  status?: number;
  ipHash?: string | null;
}): void {
  try {
    // waitUntil, not a bare unawaited promise. Vercel can freeze the function
    // the moment the response is returned, which kills in-flight work — so
    // `.then(noop, noop)` meant these rows could be silently dropped. That
    // would have been a particularly unhelpful bug: this telemetry exists
    // precisely to make silent failures visible, and was itself failing
    // silently. waitUntil keeps the function alive for the write without
    // holding up the response.
    waitUntil(
      (async () => {
        await supabaseServer()
          .from("site_events")
          .insert({
            event_type: "lookup_error",
            metadata: { stage: meta.stage, reason: meta.reason, status: meta.status ?? null },
            ip_hash: meta.ipHash ?? null,
          });
      })().catch(() => {
        // Swallow — telemetry must never affect a lookup.
      }),
    );
  } catch {
    // Swallow — a telemetry failure must never affect the response.
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
        const ipHash = ip !== "unknown" ? hashVrm(ip) : null;
        // Pull make off the cached payload too so Top Makes counts both
        // cache hits and fresh fetches — otherwise the dashboard ranking
        // is biased toward whichever vehicles miss the cache.
        const cachedMake =
          (cached.data as { make?: string } | null | undefined)?.make ?? null;
        sb.from("site_events").insert({
          event_type: "lookup",
          metadata: { cached: true, make: cachedMake },
          ip_hash: ipHash,
        }).then(() => {}, () => {});
        return NextResponse.json({
          ok: true,
          data: cached.data,
          source: cached.source,
          cached: true,
          vrmHash,
        } as CombinedResponse, {
          headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        });
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
      // 404 = plate not registered. A normal outcome, not a fault — see the
      // note on recordLookupFailure. Everything else is a real service problem,
      // including 429: rate limiting is the failure most likely to creep up on
      // us as traffic grows, and the one we'd currently never see.
      if (dvlaResult.status !== 404) {
        recordLookupFailure({
          stage: "dvla",
          reason: dvlaResult.status === 429 ? "rate_limited" : "service_error",
          status: dvlaResult.status,
          ipHash: ip !== "unknown" ? hashVrm(ip) : null,
        });
      }
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

    const ipHash = ip !== "unknown" ? hashVrm(ip) : null;
    sb.from("site_events").insert({
      event_type: "lookup",
      metadata: { make: combinedData.make || null, cached: false },
      ip_hash: ipHash,
    }).then(() => {}, () => {});

    return NextResponse.json({
      ok: true,
      data: combinedData,
      source: dvlaResult ? "dvla" : "mock",
      motSource: motData ? "api" : dvlaResult ? "dvla" : "none",
      cached: false,
      vrmHash,
    } as CombinedResponse, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err: unknown) {
    console.error("lookup_error:", (err as Error)?.message || err);
    recordLookupFailure({
      stage: "internal",
      reason: (err as Error)?.name || "exception",
      status: 500,
    });
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