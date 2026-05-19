#!/usr/bin/env npx tsx
/**
 * Deactivate MOT reminders whose vrm permanently fails the lookup.
 *
 * Walks every active row in mot_reminders and calls /api/lookup with
 * retry. Sets active=false on rows where the failure is permanent:
 *
 *   - HTTP 404: vrm not in DVLA (sold, scrapped, exported, or signup
 *               used a reg that never existed)
 *   - HTTP 400: vrm is malformed (likely typo at signup, e.g. letter
 *               "O" instead of digit "0")
 *
 * Rows are left alone when:
 *   - the lookup succeeds, OR
 *   - the failure is transient (429 rate-limited, 5xx server error,
 *     timeout, network) — those can be retried later by running the
 *     backfill script again.
 *
 * Usage:
 *   # Preview which rows would be deactivated, without writing
 *   npx tsx scripts/deactivate-not-found-reminders.ts --dry-run
 *
 *   # Apply
 *   npx tsx scripts/deactivate-not-found-reminders.ts
 *
 * Required env vars (in .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY    (preferred — needed for UPDATE under RLS)
 *     OR
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (only if RLS allows writes)
 *
 * Optional env vars:
 *   FPC_API_BASE_URL  (default: https://www.freeplatecheck.co.uk)
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// ── Load .env.local if present (scripts don't auto-load it) ────────────────
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
loadEnvLocal();

// ── Config ─────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const RATE_LIMIT_MS = 1500;
const MAX_ATTEMPTS = 3;
const BASE_URL =
  process.env.FPC_API_BASE_URL || "https://www.freeplatecheck.co.uk";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
  );
  process.exit(1);
}
if (
  SUPABASE_KEY === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.warn(
    "⚠ Using anon key — UPDATE may be blocked by RLS. Set SUPABASE_SERVICE_ROLE_KEY for reliable writes.",
  );
}

// ── Lookup with retry (same shape as backfill script) ──────────────────────
type LookupFailure =
  | "not-found"
  | "malformed"
  | "rate-limited"
  | "server-error"
  | "timeout"
  | "network";

type LookupResult =
  | { ok: true }
  | { ok: false; reason: LookupFailure; status?: number };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function singleLookupAttempt(vrm: string): Promise<LookupResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const resp = await fetch(`${BASE_URL}/api/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vrm }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const json = await resp.json();
      if (json?.data?.make) return { ok: true };
      return { ok: false, reason: "not-found", status: resp.status };
    }

    if (resp.status === 400) return { ok: false, reason: "malformed", status: 400 };
    if (resp.status === 404) return { ok: false, reason: "not-found", status: 404 };
    if (resp.status === 429) return { ok: false, reason: "rate-limited", status: 429 };
    if (resp.status >= 500) return { ok: false, reason: "server-error", status: resp.status };
    return { ok: false, reason: "server-error", status: resp.status };
  } catch (err) {
    clearTimeout(timeout);
    const name = (err as { name?: string })?.name;
    return { ok: false, reason: name === "AbortError" ? "timeout" : "network" };
  }
}

async function lookupWithRetry(vrm: string): Promise<LookupResult> {
  let last: LookupResult = { ok: false, reason: "network" };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await singleLookupAttempt(vrm);
    if (result.ok) return result;
    // Permanent failures — no point retrying
    if (result.reason === "not-found" || result.reason === "malformed") {
      return result;
    }
    last = result;
    if (attempt < MAX_ATTEMPTS) {
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  return last;
}

function isPermanentFailure(r: LookupResult): r is { ok: false; reason: "not-found" | "malformed"; status?: number } {
  return !r.ok && (r.reason === "not-found" || r.reason === "malformed");
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const sb = createClient(SUPABASE_URL as string, SUPABASE_KEY as string, {
    auth: { persistSession: false },
  });

  console.log(
    `${DRY_RUN ? "[DRY RUN]" : "[LIVE]"} Deactivating reminders whose vrm permanently fails ${BASE_URL}/api/lookup ...`,
  );

  const { data: rows, error: selectError } = await sb
    .from("mot_reminders")
    .select("id, email, vrm, make_model")
    .eq("active", true);

  if (selectError) {
    console.error("Failed to fetch reminders:", selectError);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.log("No active reminders found. Nothing to do.");
    return;
  }

  console.log(`Found ${rows.length} active reminders.\n`);

  const stats = {
    ok: 0,
    notFound: 0,
    malformed: 0,
    transient: 0,
    deactivated: 0,
    deactivateError: 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const progress = `[${String(i + 1).padStart(String(rows.length).length, " ")}/${rows.length}]`;
    const result = await lookupWithRetry(row.vrm);

    if (result.ok) {
      stats.ok++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    if (!isPermanentFailure(result)) {
      console.log(
        `${progress} … ${row.vrm} — transient ${result.reason}${result.status ? ` (HTTP ${result.status})` : ""}, kept active`,
      );
      stats.transient++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    // Permanent failure — deactivate
    const reasonLabel =
      result.reason === "not-found"
        ? `not-found (HTTP ${result.status})`
        : `malformed reg (HTTP ${result.status})`;
    console.log(
      `${progress} ✗ ${row.vrm} (${row.email}, "${row.make_model || "?"}") — ${reasonLabel} → deactivate`,
    );
    if (result.reason === "not-found") stats.notFound++;
    else stats.malformed++;

    if (!DRY_RUN) {
      const { error: updateError } = await sb
        .from("mot_reminders")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (updateError) {
        console.log(`${progress} ✗ deactivate failed: ${updateError.message}`);
        stats.deactivateError++;
      } else {
        stats.deactivated++;
      }
    }

    await sleep(RATE_LIMIT_MS);
  }

  const totalDeactivatable = stats.notFound + stats.malformed;
  console.log("\n── Summary ──");
  console.log(`Total active reminders:        ${rows.length}`);
  console.log(`Lookup succeeded (kept):       ${stats.ok}`);
  console.log(`Transient failures (kept):     ${stats.transient}`);
  console.log(`Not found in DVLA:             ${stats.notFound}`);
  console.log(`Malformed reg:                 ${stats.malformed}`);
  if (DRY_RUN) {
    console.log(
      `\n[DRY RUN] No rows were modified. Re-run without --dry-run to deactivate (${totalDeactivatable} rows would be set inactive).`,
    );
  } else {
    console.log(`Rows deactivated:              ${stats.deactivated}`);
    console.log(`Deactivate errors:             ${stats.deactivateError}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
