#!/usr/bin/env npx tsx
/**
 * Backfill make/model for active MOT reminders.
 *
 * Walks every active row in the `mot_reminders` table, calls the live
 * /api/lookup endpoint (DVLA + MOT combined) to get the canonical make +
 * model for the stored vrm, and updates rows where:
 *
 *   1. make_model is empty
 *   2. the stored make doesn't match the live make (the actual bug we're
 *      fixing — pre-7fdcaa9 client could tag a vrm with a previous
 *      vehicle's make/model)
 *   3. the stored value contains the literal string "undefined" (a
 *      degraded value from an old client bug where the model was
 *      undefined and got string-concatenated)
 *
 * Rows where the make matches but the stored value has more model detail
 * than the live lookup (e.g. stored "AUDI A6" vs live "AUDI" when the MOT
 * model isn't populated) are left alone — overwriting would degrade
 * correct data.
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
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (only if RLS allows writes)
 *
 * Optional env vars:
 *   FPC_API_BASE_URL  (default: https://www.freeplatecheck.co.uk)
 *
 * Rate limiting:
 *   Adds a 400ms delay between lookups to stay friendly to DVLA + MOT
 *   downstream services.
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
const RATE_LIMIT_MS = 400;
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

// ── Lookup against the live API (combined DVLA + MOT model) ────────────────
interface LookupVehicle {
  make?: string;
  model?: string;
}

async function fetchCombinedLookup(vrm: string): Promise<LookupVehicle | null> {
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
    if (!resp.ok) return null;
    const json = await resp.json();
    const data = json?.data;
    if (!data || typeof data !== "object") return null;
    return { make: data.make, model: data.model };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Update decision logic ──────────────────────────────────────────────────
interface UpdateDecision {
  shouldUpdate: boolean;
  fresh: string;
  reason: "missing" | "wrong-make" | "undefined-suffix" | "ok" | "less-detail";
}

function decideUpdate(
  stored: string,
  liveMake: string | undefined,
  liveModel: string | undefined,
): UpdateDecision {
  const fresh = `${liveMake || ""}${liveModel ? " " + liveModel : ""}`.trim();
  const storedTrimmed = stored.trim();

  if (!storedTrimmed) {
    return { shouldUpdate: true, fresh, reason: "missing" };
  }

  if (/\bundefined\b/i.test(storedTrimmed)) {
    return { shouldUpdate: true, fresh, reason: "undefined-suffix" };
  }

  // Multi-word makes ("LAND ROVER", "ALFA ROMEO", "ASTON MARTIN") need a
  // prefix check rather than a split-and-compare on the first token.
  if (liveMake) {
    const liveMakeNorm = liveMake.trim().toUpperCase();
    const storedUpper = storedTrimmed.toUpperCase();
    const sameMake =
      storedUpper === liveMakeNorm ||
      storedUpper.startsWith(liveMakeNorm + " ");
    if (!sameMake) {
      return { shouldUpdate: true, fresh, reason: "wrong-make" };
    }
  }

  // Make matches. Three sub-cases:
  //   - stored == fresh (case-insensitive)  → already correct
  //   - fresh has more detail                → take it
  //   - stored has more detail               → keep stored (DVLA-only lookup
  //                                            often lacks the model field)
  if (storedTrimmed.toUpperCase() === fresh.toUpperCase()) {
    return { shouldUpdate: false, fresh, reason: "ok" };
  }
  if (fresh.length > storedTrimmed.length) {
    return { shouldUpdate: true, fresh, reason: "ok" };
  }
  return { shouldUpdate: false, fresh, reason: "less-detail" };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const sb = createClient(SUPABASE_URL as string, SUPABASE_KEY as string, {
    auth: { persistSession: false },
  });

  console.log(
    `${DRY_RUN ? "[DRY RUN]" : "[LIVE]"} Backfilling MOT reminder make/model via ${BASE_URL}/api/lookup ...`,
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

  const stats = {
    ok: 0,
    missing: 0,
    wrongMake: 0,
    undefinedSuffix: 0,
    lessDetail: 0,
    lookupFail: 0,
    updated: 0,
    updateError: 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const progress = `[${String(i + 1).padStart(String(rows.length).length, " ")}/${rows.length}]`;
    const live = await fetchCombinedLookup(row.vrm);

    if (!live || !live.make) {
      console.log(`${progress} ✗ ${row.vrm} — lookup failed (skipped)`);
      stats.lookupFail++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    const decision = decideUpdate(row.make_model || "", live.make, live.model);

    if (!decision.shouldUpdate) {
      if (decision.reason === "less-detail") {
        // Make matches and stored is more detailed than live — keep stored.
        stats.lessDetail++;
      } else {
        stats.ok++;
      }
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    if (decision.reason === "missing") {
      console.log(`${progress} + ${row.vrm} — was empty → "${decision.fresh}"`);
      stats.missing++;
    } else if (decision.reason === "wrong-make") {
      console.log(
        `${progress} ⚠ ${row.vrm} — "${row.make_model}" → "${decision.fresh}" [wrong make]`,
      );
      stats.wrongMake++;
    } else if (decision.reason === "undefined-suffix") {
      console.log(
        `${progress} ⚠ ${row.vrm} — "${row.make_model}" → "${decision.fresh}" [cleaning 'undefined']`,
      );
      stats.undefinedSuffix++;
    } else {
      console.log(
        `${progress} + ${row.vrm} — "${row.make_model}" → "${decision.fresh}" [more detail]`,
      );
      stats.ok++;
    }

    if (!DRY_RUN) {
      const { error: updateError } = await sb
        .from("mot_reminders")
        .update({
          make_model: decision.fresh,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (updateError) {
        console.log(`${progress} ✗ update failed: ${updateError.message}`);
        stats.updateError++;
      } else {
        stats.updated++;
      }
    }

    await sleep(RATE_LIMIT_MS);
  }

  const totalChangeable =
    stats.missing + stats.wrongMake + stats.undefinedSuffix;
  console.log("\n── Summary ──");
  console.log(`Total active reminders:        ${rows.length}`);
  console.log(`Already correct:               ${stats.ok}`);
  console.log(`Stored has more detail (kept): ${stats.lessDetail}`);
  console.log(`Missing make/model:            ${stats.missing}`);
  console.log(`Wrong make (real drift):       ${stats.wrongMake}`);
  console.log(`Had 'undefined' suffix:        ${stats.undefinedSuffix}`);
  console.log(`Lookup failures:               ${stats.lookupFail}`);
  if (DRY_RUN) {
    console.log(
      `\n[DRY RUN] No rows were updated. Re-run without --dry-run to apply (${totalChangeable} rows would change).`,
    );
  } else {
    console.log(`Rows updated:                  ${stats.updated}`);
    console.log(`Update errors:                 ${stats.updateError}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
