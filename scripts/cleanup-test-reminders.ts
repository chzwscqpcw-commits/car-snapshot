#!/usr/bin/env npx tsx
/**
 * Delete MOT reminder rows that were created by verification / test runs.
 *
 * Identifies rows whose email matches a known test pattern (a `verify-test+`
 * local-part, OR one of the RFC 2606 reserved domains: example.com / .org /
 * .net). Real users should never have these addresses, so they're safe to
 * remove.
 *
 * Usage:
 *   # Preview without deleting
 *   npx tsx scripts/cleanup-test-reminders.ts --dry-run
 *
 *   # Apply
 *   npx tsx scripts/cleanup-test-reminders.ts
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually load .env.local — scripts don't auto-load it and we don't want
// to add dotenv as a dependency just for this. Matches the pattern used by
// scripts/deactivate-not-found-reminders.ts.
(function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
})();

const dryRun = process.argv.includes("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // Build the filter using multiple .or() conditions: emails like
  // 'verify-test+%' OR ending in any reserved-domain TLD.
  const orFilter = [
    "email.ilike.verify-test+%",
    "email.ilike.%@example.com",
    "email.ilike.%@example.org",
    "email.ilike.%@example.net",
    "email.ilike.%@test.invalid",
  ].join(",");

  const { data: rows, error } = await sb
    .from("mot_reminders")
    .select("id, email, vrm, make_model, created_at, active")
    .or(orFilter)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No test rows found.");
    return;
  }

  console.log(`Found ${rows.length} test row${rows.length === 1 ? "" : "s"}:`);
  for (const r of rows) {
    console.log(
      `  - ${r.id}  ${r.email}  ${r.vrm}  ${r.make_model || "(no make)"}  ` +
        `${r.created_at}  active=${r.active}`,
    );
  }

  if (dryRun) {
    console.log("\nDry run — nothing deleted. Re-run without --dry-run to apply.");
    return;
  }

  const ids = rows.map((r) => r.id);
  const { error: delError } = await sb.from("mot_reminders").delete().in("id", ids);
  if (delError) {
    console.error("Delete failed:", delError.message);
    process.exit(1);
  }

  console.log(`\nDeleted ${ids.length} row${ids.length === 1 ? "" : "s"}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
