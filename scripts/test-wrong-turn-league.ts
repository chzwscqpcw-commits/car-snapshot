/**
 * Assertions for src/lib/wrong-turn-league.ts — the weekly league for the
 * 404 game: which runs can be entered, which initials are allowed, and when
 * the week turns over.
 */
import { bestPerInitials, checkRun, cleanInitials, MIN_SECONDS, newRunToken, weekStart } from "../src/lib/wrong-turn-league";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}
const reason = (r: ReturnType<typeof checkRun>) => (r.ok ? "ok" : r.reason);

console.log("\nRuns:");
const t0 = Date.UTC(2026, 9, 29, 12, 0, 0);
const token = newRunToken(t0);
check("a real run 40s after starting", reason(checkRun(token, 36.4, t0 + 40_000)), "ok");
check("faster than the track allows", reason(checkRun(token, MIN_SECONDS - 0.5, t0 + 60_000)), "impossible_time");
check("entered before that much time passed", reason(checkRun(token, 36.4, t0 + 20_000)), "clock_mismatch");
check("token over 30 minutes old", reason(checkRun(token, 36.4, t0 + 31 * 60_000)), "expired");
check("tampered start time", reason(checkRun(token.replace(String(t0), String(t0 - 100_000)), 36.4, t0 + 40_000)), "bad_token");
check("no token", reason(checkRun(undefined, 36.4, t0 + 40_000)), "no_token");
check("not a number", reason(checkRun(token, "36.4", t0 + 40_000)), "bad_time");
const a = checkRun(token, 36.4, t0 + 40_000);
const b = checkRun(token, 37.0, t0 + 41_000);
check("same token, same run id (so it can only go in once)", a.ok && b.ok && a.runId === b.runId, true);

console.log("\nInitials:");
check("lower case and punctuation", cleanInitials("s.g-x"), "SGX");
check("too short", cleanInitials("SG"), null);
check("too long", cleanInitials("SGXY"), null);
check("rude", cleanInitials("fuk"), null);
check("not a string", cleanInitials(42), null);

console.log("\nWeek (UK time, Monday start):");
check("Thursday", weekStart(new Date("2026-10-29T12:00:00Z")), "2026-10-26");
check("Sunday night, 23:30 UK", weekStart(new Date("2026-11-01T23:30:00Z")), "2026-10-26");
check("Monday 00:30 UK", weekStart(new Date("2026-11-02T00:30:00Z")), "2026-11-02");
check("Monday 00:30 BST is still Sunday in UTC", weekStart(new Date("2026-06-28T23:30:00Z")), "2026-06-29");

console.log("\nLeague order:");
const rows = bestPerInitials([
  { initials: "AAA", seconds: 35.2 },
  { initials: "BBB", seconds: 33.0 },
  { initials: "AAA", seconds: 31.9 },
]);
check("best time per initials, fastest first", rows.map((r) => `${r.initials}${r.seconds}`).join(" "), "AAA31.9 BBB33");

if (failures > 0) {
  console.error(`\n${failures} league check(s) failed`);
  process.exit(1);
}
console.log("\nAll league checks passed");
