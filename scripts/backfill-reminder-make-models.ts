#!/usr/bin/env npx tsx
/**
 * Backfill make/model for active MOT reminders.
 *
 * Walks every active row in the `mot_reminders` table, calls DVLA to fetch
 * the canonical make + model for the stored vrm, and updates the row when
 * the stored value differs (or is missing). One-off remediation for the
 * stale-client bug fixed in 7fdcaa9 — pre-existing rows in the database
 * are not affected by that fix and would otherwise send the wrong vehicle
 * in 28-day and 7-day reminder emails.
 *
 * Usage:
 *   # Preview drift without writing anything
 *   npx tsx scripts/backfill-reminder-make-models.ts --dry-run
 *
 *   # Apply updates
 *   npx tsx scripts/backfill-reminder-make-models.ts
 *
 * Required env vars (in .env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (preferred — needed for UPDATE under RLS)
 *     OR
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (only if RLS allows writes — usually it doesn't)
 *   DVLA_X_API_KEY
 *
 * Rate limiting:
 *   Adds a 250ms delay between DVLA calls to stay under typical limits.
 *
 * Exits non-zero only on fatal setup errors (missing env). Per-row errors
 * are logged and counted but do not abort the run.
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
const RATE_LIMIT_MS = 250;
const DVLA_ENDPOINT =
  process.env.DVLA_ENV === "uat"
    ? "https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles"
    : "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DVLA_API_KEY = process.env.DVLA_X_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
  );
  process.exit(1);
}
if (!DVLA_API_KEY) {
  console.error("Missing DVLA_X_API_KEY.");
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

// ── DVLA fetch (mirrors the logic in src/app/api/lookup/route.ts) ─────────
interface DvlaResponse {
  make?: string;
  model?: string;
  registrationNumber?: string;
}

async function fetchDvla(vrm: string): Promise<DvlaResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(DVLA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": DVLA_API_KEY as string,
      },
      body: JSON.stringify({ registrationNumber: vrm }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      return null;
    }
    return (await resp.json()) as DvlaResponse;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const sb = createClient(SUPABASE_URL as string, SUPABASE_KEY as string, {
    auth: { persistSession: false },
  });

  console.log(
    `${DRY_RUN ? "[DRY RUN]" : "[LIVE]"} Backfilling MOT reminder make/model from DVLA...`,
  );

  const { data: rows, error: selectError } = await sb
    .from("mot_reminders")
    .select("id, vrm, make_model")
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

  const stats = { ok: 0, drift: 0, updated: 0, missing: 0, dvlaFail: 0, errors: 0 };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const progress = `[${String(i + 1).padStart(String(rows.length).length, " ")}/${rows.length}]`;
    const dvla = await fetchDvla(row.vrm);

    if (!dvla || !dvla.make) {
      console.log(`${progress} ✗ ${row.vrm} — DVLA lookup failed (skipped)`);
      stats.dvlaFail++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    const fresh = `${dvla.make}${dvla.model ? " " + dvla.model : ""}`.trim();
    const stored = (row.make_model || "").trim();

    if (!stored) {
      console.log(`${progress} + ${row.vrm} — was empty → "${fresh}"`);
      stats.missing++;
    } else if (stored === fresh) {
      stats.ok++;
      await sleep(RATE_LIMIT_MS);
      continue;
    } else {
      console.log(`${progress} ⚠ ${row.vrm} — "${stored}" → "${fresh}"`);
      stats.drift++;
    }

    if (!DRY_RUN) {
      const { error: updateError } = await sb
        .from("mot_reminders")
        .update({
          make_model: fresh,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (updateError) {
        console.log(`${progress} ✗ update failed: ${updateError.message}`);
        stats.errors++;
      } else {
        stats.updated++;
      }
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log("\n── Summary ──");
  console.log(`Total active reminders:   ${rows.length}`);
  console.log(`Already correct:          ${stats.ok}`);
  console.log(`Drift detected:           ${stats.drift}`);
  console.log(`Missing make/model:       ${stats.missing}`);
  console.log(`DVLA lookup failures:     ${stats.dvlaFail}`);
  if (DRY_RUN) {
    console.log(
      `\n[DRY RUN] No rows were updated. Re-run without --dry-run to apply (${stats.drift + stats.missing} rows would change).`,
    );
  } else {
    console.log(`Rows updated:             ${stats.updated}`);
    console.log(`Update errors:            ${stats.errors}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
