export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";

// Simple in-memory rate limiter (consider Redis for production/multi-instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20; // requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

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
  // UK plates can be short (private) or standard. We'll let DVLA be the judge.
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
    colour: "WHITE",
    fuelType: "ELECTRICITY",
    engineCapacity: 0,
    yearOfManufacture: 2025,
    taxStatus: "Taxed",
    taxDueDate: "2026-05-01",

    // This is the "new car" scenario:
    motStatus: "No details held by DVLA",
    motExpiryDate: null,

    // DVLA gives month+year like "YYYY-MM"
    monthOfFirstRegistration: "2025-06",
  };
}

type DvlaResult = null | { error: string; status: number } | { data: any };

async function fetchFromDvla(registrationNumber: string): Promise<DvlaResult> {
  const endpoint =
    process.env.DVLA_ENV === "uat"
      ? "https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles"
      : "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

  const apiKey = process.env.DVLA_X_API_KEY;
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

    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      const message =
        resp.status === 404
          ? "Vehicle not found."
          : resp.status === 429
            ? "Too many requests. Try again later."
            : "DVLA service error. Try again.";
      return { error: message, status: resp.status };
    }

    return { data };
  } catch (err: any) {
    // Handle abort/timeout specifically
    if (err.name === "AbortError") {
      return { error: "DVLA request timed out. Please try again.", status: 504 };
    }
    // Handle other network errors
    return { error: "Network error contacting DVLA. Please try again.", status: 503 };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    // Rate limiting - extract IP from headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const vrm = normalizeVrm(String(body?.vrm ?? ""));

    if (!looksLikeVrm(vrm)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid UK registration (VRM)." },
        { status: 400 }
      );
    }

    const sb = supabaseServer();
    const vrmHash = hashVrm(vrm);

    // 1) Try cache
    const { data: cached, error: cacheErr } = await sb
      .from("vehicle_lookups")
      .select("data, source, expires_at")
      .eq("vrm_hash", vrmHash)
      .maybeSingle();

    if (cacheErr) {
      console.error("cache_read_error:", cacheErr.message);
    }

    const hasDvlaKey = Boolean(process.env.DVLA_X_API_KEY);

    // If we have a DVLA key, don't let a cached MOCK response block DVLA.
    // We'll "upgrade" mock -> dvla by fetching fresh.
    if (cached?.expires_at && new Date(cached.expires_at) > new Date()) {
      if (!(hasDvlaKey && cached.source === "mock")) {
        return NextResponse.json({
          ok: true,
          data: cached.data,
          source: cached.source,
          cached: true,
          vrmHash,
        });
      }
    }

    // 2) Otherwise fetch fresh
    const dvlaResult = await fetchFromDvla(vrm);

    // Shorter cache: 24 hours for fresher tax/MOT data
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updatedAt = new Date().toISOString();

    if (dvlaResult === null) {
      const fresh = mockDvlaResponse(vrm);

      const { error: upsertErr } = await sb.from("vehicle_lookups").upsert({
        vrm_hash: vrmHash,
        data: fresh,
        source: "mock",
        expires_at: expiresAt,
        updated_at: updatedAt,
      });

      if (upsertErr) {
        console.error("cache_write_error:", upsertErr.message);
      }

      return NextResponse.json({
        ok: true,
        data: fresh,
        source: "mock",
        cached: false,
        vrmHash,
      });
    }

    if ("error" in dvlaResult) {
      return NextResponse.json(
        { ok: false, error: dvlaResult.error },
        { status: dvlaResult.status }
      );
    }

    const fresh = dvlaResult.data;

    const { error: upsertErr } = await sb.from("vehicle_lookups").upsert({
      vrm_hash: vrmHash,
      data: fresh,
      source: "dvla",
      expires_at: expiresAt,
      updated_at: updatedAt,
    });

    if (upsertErr) {
      console.error("cache_write_error:", upsertErr.message);
    }

    return NextResponse.json({
      ok: true,
      data: fresh,
      source: "dvla",
      cached: false,
      vrmHash,
    });
  } catch (err: any) {
    console.error("lookup_error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}