export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { waitUntil } from "@vercel/functions";
import { supabaseServer } from "@/lib/supabaseServer";
import { analyticsWritesEnabled } from "@/lib/analytics-writes";
import { maskPlate } from "@/lib/redact";
import { simulatedMotOutage } from "@/lib/deploy-env";
import { calledFromOurPages, UnknownPlates } from "@/lib/lookup-guards";
import {
  describeFetchError,
  fetchMotHistory,
  motFailureMetadata,
  type FetchErrorDetail,
  type MOTHistoryData,
  type MOTTest,
  type MotFetchResult,
} from "@/lib/mot-history";

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/** Plates DVLA has just said it does not know. See lookup-guards.ts. */
const unknownPlates = new UnknownPlates();

const DVLA_API_KEY = process.env.DVLA_X_API_KEY;

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
  /** DVLA was down; built from MOT data alone. See vehicleFromMot. */
  dvlaUnavailable?: boolean;
  /**
   * The MOT service did not answer (as opposed to answering "nothing held").
   * No MOT history or mileage in this record, and no model unless we had
   * looked the car up before. The pages say so; see MotOutageNotice.
   */
  motUnavailable?: boolean;
  /** The outage was switched on by the preview-only cookie (never in production). */
  motSimulated?: boolean;
};

type CombinedResponse = {
  ok: true;
  data: VehicleData;
  source: "dvla" | "mot" | "mock";
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

const DVLA_DOWN_MESSAGE = "DVLA's vehicle service is briefly unavailable. Please try again in a few minutes.";
const INVALID_REG_MESSAGE = "That registration doesn't look right. Check it and try again.";

const MOT_FUEL_TO_DVLA: Record<string, string> = { ELECTRIC: "ELECTRICITY" };

/**
 * A vehicle record from MOT history alone, for when DVLA's VES API is down
 * (DVLA scheduled maintenance for 3–4 Nov 2026). The MOT API is run by DVSA
 * separately, so it usually still answers. It has no tax status, CO2, Euro
 * status or type approval; the page says tax is unavailable rather than
 * failing the whole lookup. Cars under about three years old have no MOT
 * record, so those still fail.
 */
function vehicleFromMot(vrm: string, mot: MOTHistoryData): VehicleData {
  const firstReg = mot.firstUsedDate || mot.registrationDate;
  const year = Number((mot.manufactureDate || firstReg || "").slice(0, 4));
  const engine = parseInt(mot.engineSize ?? "", 10);
  const fuel = mot.fuelType?.toUpperCase().replace(/\s*\(.*\)\s*/g, "").trim();
  return {
    registrationNumber: vrm,
    make: mot.make?.toUpperCase(),
    model: mot.model?.toUpperCase(),
    colour: (mot.primaryColour || mot.colour)?.toUpperCase(),
    fuelType: fuel ? MOT_FUEL_TO_DVLA[fuel] ?? fuel : undefined,
    engineCapacity: Number.isFinite(engine) && engine > 0 ? engine : undefined,
    yearOfManufacture: year > 1900 ? year : undefined,
    monthOfFirstRegistration: firstReg?.slice(0, 7),
    taxStatus: "Unavailable",
    dvlaUnavailable: true,
  };
}

type DvlaFailure = { error: string; status: number; detail?: FetchErrorDetail };

async function fetchFromDvla(registrationNumber: string): Promise<VehicleData | DvlaFailure | null> {
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
  let transient: DvlaFailure = {
    error: DVLA_DOWN_MESSAGE,
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
      // DVLA rejects a registration it can't parse with 400. That was showing
      // as "DVLA service error. Try again" and logging as an outage: 475 of
      // the 482 lookup errors in the two weeks to 28 Oct 2026 were this.
      if (resp.status === 400) return { error: INVALID_REG_MESSAGE, status: 400 };

      // Transient (5xx / other): remember it and retry if attempts remain.
      transient = { error: DVLA_DOWN_MESSAGE, status: resp.status };
    } catch (err: unknown) {
      clearTimeout(timeout);
      // 503/504 here are our own labels for "fetch threw". Keep what it threw.
      transient =
        (err as Error).name === "AbortError"
          ? { error: DVLA_DOWN_MESSAGE, status: 504 }
          : { error: DVLA_DOWN_MESSAGE, status: 503, detail: describeFetchError(err, registrationNumber) };
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
  /**
   * What the failure said about itself: error name, code and cause, elapsed
   * milliseconds, attempts (see mot-history.ts). Added after the Nov 2026 MOT
   * outage, which analytics could time but not explain. Never a plate.
   */
  detail?: Record<string, string | number | null>;
  /** The request did not come from one of our pages (see lookup-guards.ts). */
  direct?: boolean;
}): void {
  if (!analyticsWritesEnabled()) return;
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
            metadata: {
              ...(meta.detail ?? {}),
              ...(meta.direct ? { direct: true } : {}),
              stage: meta.stage,
              reason: meta.reason,
              status: meta.status ?? null,
            },
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
    // Our own crons (saved-car alert refreshes) and the owner's browser
    // (fpc_internal cookie, see tracking.ts) are tagged so the dashboard's
    // lookup counts stay about visitors.
    const internal =
      req.headers.get("x-fpc-internal") === "1" || /(^|;\s*)fpc_internal=1(;|$)/.test(req.headers.get("cookie") ?? "");
    // A lookup that no page of ours made (a script calling the route) is
    // recorded as `lookup_direct`, not `lookup`. A separate event type, as
    // with `lookup_error`, so `lookup` goes on meaning a visitor's lookup
    // in every count that already reads it.
    const direct = !internal && !calledFromOurPages(req.headers);
    const lookupEvent = direct ? "lookup_direct" : "lookup";
    if (direct) console.log("[LOOKUP] Direct call: no page of ours made this request");
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

    const vrmHash = hashVrm(vrm);

    // DVLA said minutes ago that it has no such plate. Give the same answer
    // without asking DVLA and DVSA again.
    const unknown = unknownPlates.recall(vrmHash);
    if (unknown) {
      console.log(`[LOOKUP] Not asking again about a plate DVLA does not know: ${maskPlate(vrm)}`);
      return NextResponse.json({ ok: false, error: unknown.error } as ErrorResponse, { status: unknown.status });
    }

    const sb = supabaseServer();

    const { data: cached, error: cacheErr } = await sb
      .from("vehicle_lookups")
      .select("data, source, expires_at")
      .eq("vrm_hash", vrmHash)
      .maybeSingle();

    if (cacheErr) {
      console.error("cache_read_error:", cacheErr.message);
    }

    const hasDvlaKey = Boolean(DVLA_API_KEY);

    if (!skipCache && !simulatedMotOutage(req.headers.get("cookie")) && cached?.expires_at && new Date(cached.expires_at) > new Date()) {
      if (!(hasDvlaKey && cached.source === "mock")) {
        console.log(`[LOOKUP] Using cached data for VRM: ${maskPlate(vrm)}`);
        const ipHash = ip !== "unknown" ? hashVrm(ip) : null;
        // Pull make off the cached payload too so Top Makes counts both
        // cache hits and fresh fetches — otherwise the dashboard ranking
        // is biased toward whichever vehicles miss the cache.
        const cachedMake =
          (cached.data as { make?: string } | null | undefined)?.make ?? null;
        if (analyticsWritesEnabled()) {
          sb.from("site_events").insert({
            event_type: lookupEvent,
            metadata: { ...(internal ? { internal: true } : {}), cached: true, make: cachedMake },
            ip_hash: ipHash,
          }).then(() => {}, () => {});
        }
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

    console.log(`[LOOKUP] Fetching data for VRM: ${maskPlate(vrm)}${skipCache ? " (cache skipped)" : ""}`);
    // Preview-only: pretend the MOT service is down (never in live production).
    const simulation = simulatedMotOutage(req.headers.get("cookie"));
    const [dvlaResult, motResult] = await Promise.all([
      fetchFromDvla(vrm),
      simulation
        ? Promise.resolve<MotFetchResult>({
            state: "failed",
            failure: { reason: "network_error", detail: { cause_code: "SIMULATED" }, ms: 0, attempts: 0 },
          })
        : fetchMotHistory(vrm),
    ]);
    const motData = motResult.state === "ok" ? motResult.data : null;
    // "Failed" is the service not answering. A 404 or an empty record is an
    // answer, and so is having no credentials in local development.
    const motFailed = motResult.state === "failed";
    if (motResult.state === "failed" && !simulation) {
      const { stage: _stage, reason, status, ...detail } = motFailureMetadata(motResult.failure);
      recordLookupFailure({
        stage: "mot",
        reason: String(reason),
        status: typeof status === "number" ? status : undefined,
        ipHash: ip !== "unknown" ? hashVrm(ip) : null,
        detail,
        direct,
      });
    }

    console.log(`[LOOKUP] DVLA Result:`, dvlaResult ? "Got data" : "No data or error");
    console.log(`[LOOKUP] MOT Data:`, motData ? "Got MOT history" : "No MOT data");
    if (motData) {
      console.log(`[LOOKUP] MOT Tests:`, motData.motTests?.length || 0, "records");
      console.log(`[LOOKUP] MOT Model:`, motData.model || "no model");
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updatedAt = new Date().toISOString();

    if (dvlaResult && "error" in dvlaResult) {
      // 404 = plate not registered, 400 = not a registration DVLA can parse.
      // Normal outcomes, not faults — see the note on recordLookupFailure.
      // Everything else is a real service problem, including 429: rate
      // limiting is the failure most likely to creep up on us as traffic
      // grows, and the one we'd currently never see.
      const isOutage = dvlaResult.status !== 404 && dvlaResult.status !== 400;
      if (isOutage) {
        recordLookupFailure({
          stage: "dvla",
          reason: dvlaResult.status === 429 ? "rate_limited" : "service_error",
          status: dvlaResult.status,
          ipHash: ip !== "unknown" ? hashVrm(ip) : null,
          detail: dvlaResult.detail,
          direct,
        });
      }
      // DVLA down but the MOT service answered: show what MOT data has. Not
      // cached, so the next lookup of this plate gets the full DVLA record.
      // Not for 429, which is our own rate limit with DVLA, not an outage.
      if (isOutage && dvlaResult.status !== 429 && motData?.make) {
        const fallback = combineVehicleData(vehicleFromMot(vrm, motData), motData);
        if (analyticsWritesEnabled()) {
          sb.from("site_events").insert({
            event_type: lookupEvent,
            metadata: { ...(internal ? { internal: true } : {}), make: fallback.make || null, cached: false, dvla_unavailable: true },
            ip_hash: ip !== "unknown" ? hashVrm(ip) : null,
          }).then(() => {}, () => {});
        }
        return NextResponse.json({
          ok: true,
          data: fallback,
          source: "mot",
          motSource: "api",
          cached: false,
          vrmHash,
        } as CombinedResponse, {
          headers: { "Cache-Control": "no-store" },
        });
      }
      if (!isOutage) unknownPlates.remember(vrmHash, { error: dvlaResult.error, status: dvlaResult.status });
      return NextResponse.json(
        { ok: false, error: dvlaResult.error } as ErrorResponse,
        { status: dvlaResult.status }
      );
    }

    const vehicleData = dvlaResult || mockDvlaResponse(vrm);
    const combinedData = combineVehicleData(vehicleData, motData);

    if (motFailed) {
      // The MOT service is where a car's model comes from (DVLA returns the
      // make only), and without a model there is no price to start a
      // valuation from: that is how the Nov 2026 outage took valuations down
      // with it. A model is a fact about the car, not a reading that goes
      // stale, so reuse the one from our own saved copy of an earlier lookup
      // when there is one, however old. MOT tests and mileage are NOT reused:
      // showing an old history as current would be worse than saying it is
      // unavailable.
      const saved = simulation === "new" || cached?.source === "mock" ? null : (cached?.data as VehicleData | null | undefined);
      if (!combinedData.model && saved?.model) {
        combinedData.model = saved.model;
        if (saved.variant) combinedData.variant = saved.variant;
      }
      combinedData.motUnavailable = true;
      if (simulation) combinedData.motSimulated = true;
    }

    // A record missing its MOT half is not cached: it would be served for 24
    // hours, long after the service is back (and it would overwrite the saved
    // copy the model above came from).
    if (!motFailed) {
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
    }

    const ipHash = ip !== "unknown" ? hashVrm(ip) : null;
    if (analyticsWritesEnabled()) {
      sb.from("site_events").insert({
        event_type: lookupEvent,
        metadata: {
          ...(internal ? { internal: true } : {}),
          make: combinedData.make || null,
          cached: false,
          ...(motFailed ? { mot_unavailable: true, model_known: Boolean(combinedData.model) } : {}),
        },
        ip_hash: ipHash,
      }).then(() => {}, () => {});
    }

    return NextResponse.json({
      ok: true,
      data: combinedData,
      source: dvlaResult ? "dvla" : "mock",
      motSource: motData ? "api" : dvlaResult ? "dvla" : "none",
      cached: false,
      vrmHash,
    } as CombinedResponse, {
      headers: { "Cache-Control": motFailed ? "no-store" : "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err: unknown) {
    console.error("lookup_error:", (err as Error)?.message || err);
    recordLookupFailure({
      stage: "internal",
      reason: (err as Error)?.name || "exception",
      status: 500,
      // Name and code only: an exception's message can quote the request body.
      detail: (({ err_name, err_code, cause_name, cause_code }) => ({ err_name, err_code, cause_name, cause_code }))(
        describeFetchError(err),
      ) as Record<string, string>,
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