/**
 * Assertions for src/lib/admin-auth.ts, the gate in front of /api/admin/*.
 *
 * What this pins (November 2026): the gate used to fall back to a PIN written
 * in the source when ADMIN_PIN was not set, and this repository is public. A
 * deployment without its own ADMIN_PIN must now refuse every request.
 *
 * The PINs here are made up for the test and are not used anywhere.
 */
import { adminGate } from "../src/lib/admin-auth";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

const req = (pin?: string) =>
  new Request("https://www.example.test/api/admin/health", {
    headers: pin === undefined ? {} : { "x-admin-pin": pin },
  });
const status = (pin?: string) => adminGate(req(pin))?.status ?? 200;

const saved = process.env.ADMIN_PIN;

console.log("\nNo ADMIN_PIN on the deployment:");
delete process.env.ADMIN_PIN;
check("no PIN sent is refused", status(), 401);
check("an empty PIN is refused", status(""), 401);
check("any four digits are refused", status("0000"), 401);
check("the literal text 'undefined' is refused", status("undefined"), 401);

console.log("\nADMIN_PIN set but blank:");
process.env.ADMIN_PIN = "";
check("empty value: an empty PIN is refused", status(""), 401);
process.env.ADMIN_PIN = "   ";
check("spaces only: the same spaces are refused", status("   "), 401);

console.log("\nADMIN_PIN set:");
process.env.ADMIN_PIN = "test-pin-for-this-file";
check("the right PIN is let through", status("test-pin-for-this-file"), 200);
check("a wrong PIN is refused", status("test-pin-for-this-fil"), 401);
check("no PIN sent is refused", status(), 401);
check("a refusal is JSON the dashboard can read", adminGate(req("nope"))?.headers.get("content-type")?.includes("json"), true);

if (saved === undefined) delete process.env.ADMIN_PIN;
else process.env.ADMIN_PIN = saved;

console.log(failures === 0 ? "\nAll admin-auth checks passed.\n" : `\n${failures} admin-auth check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
