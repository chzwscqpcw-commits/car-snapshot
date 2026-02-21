#!/usr/bin/env npx tsx
/**
 * Data file validator — CLI entry point + prebuild hook
 *
 * Usage:
 *   npx tsx scripts/validate-data.ts          # human-readable summary
 *   npx tsx scripts/validate-data.ts --json   # machine-readable JSON
 *
 * Exit code 0 = all pass, 1 = any fail
 */

import { validateAll, type ValidationResult } from "./lib/validators";

const jsonMode = process.argv.includes("--json");

const results = validateAll();
const failures = results.filter((r) => r.status === "fail");

if (jsonMode) {
  console.log(JSON.stringify(results, null, 2));
} else {
  const maxFileLen = Math.max(...results.map((r) => r.file.length));

  console.log("\n  Data File Validation Report");
  console.log("  " + "=".repeat(50));
  console.log();

  for (const r of results) {
    const icon = r.status === "pass" ? "\x1b[32m PASS \x1b[0m" : "\x1b[31m FAIL \x1b[0m";
    const padded = r.file.padEnd(maxFileLen);
    console.log(`  ${icon}  ${padded}  (${r.entryCount.toLocaleString()} entries)`);

    for (const err of r.errors) {
      console.log(`           \x1b[31m- ${err}\x1b[0m`);
    }
    for (const warn of r.warnings) {
      console.log(`           \x1b[33m! ${warn}\x1b[0m`);
    }
  }

  console.log();
  const passed = results.length - failures.length;
  console.log(`  ${passed}/${results.length} files passed`);

  if (failures.length > 0) {
    console.log(`  \x1b[31m${failures.length} file(s) failed validation\x1b[0m`);
  } else {
    console.log("  \x1b[32mAll data files are valid\x1b[0m");
  }
  console.log();
}

process.exit(failures.length > 0 ? 1 : 0);
