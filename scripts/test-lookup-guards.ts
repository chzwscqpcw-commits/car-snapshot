/**
 * Assertions for src/lib/lookup-guards.ts and how /api/lookup uses it.
 *
 * What this pins (November 2026): a script calling the route directly was
 * counted as visitors' lookups, and asked for one unregistered plate 112
 * times in four minutes, each one a real call to DVLA and to DVSA.
 *
 * The second half runs the real route. `fetch` is replaced for the whole
 * run: DVLA and the database are stand-ins in this file, and a request to
 * anywhere else fails the test. Nothing leaves this machine. The plates are
 * made up.
 */
import { calledFromOurPages, UnknownPlates, UNKNOWN_PLATE_TTL_MS } from "../src/lib/lookup-guards";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

const HOST = "www.example.test";
const h = (init: Record<string, string>) => new Headers({ host: HOST, ...init });

console.log("\nWho made the request:");
check("a current browser on our page", calledFromOurPages(h({ "sec-fetch-site": "same-origin", origin: `https://${HOST}` })), true);
check("an older browser on our page (Origin only)", calledFromOurPages(h({ origin: `https://${HOST}` })), true);
check("behind the platform's proxy (forwarded host)", calledFromOurPages(new Headers({ host: "internal:3000", "x-forwarded-host": HOST, origin: `https://${HOST}` })), true);
check("a script with no browser headers", calledFromOurPages(h({ "user-agent": "python-requests/2.32" })), false);
check("a page on another site", calledFromOurPages(h({ "sec-fetch-site": "cross-site", origin: "https://elsewhere.test" })), false);
check("a sibling subdomain is not this site", calledFromOurPages(h({ "sec-fetch-site": "same-site", origin: "https://other.example.test" })), false);
check("an Origin that is not a URL", calledFromOurPages(h({ origin: "null" })), false);
check("no headers at all", calledFromOurPages(new Headers()), false);

console.log("\nRemembering unknown plates:");
const t0 = 1_800_000_000_000;
const plates = new UnknownPlates();
check("nothing remembered at first", plates.recall("a", t0), null);
plates.remember("a", { error: "Vehicle not found.", status: 404 }, t0);
check("remembered a second later", plates.recall("a", t0 + 1000)?.status, 404);
check("with DVLA's message", plates.recall("a", t0 + 1000)?.error, "Vehicle not found.");
check("another plate is not", plates.recall("b", t0 + 1000), null);
check("still remembered just inside ten minutes", plates.recall("a", t0 + UNKNOWN_PLATE_TTL_MS - 1)?.status, 404);
check("forgotten at ten minutes", plates.recall("a", t0 + UNKNOWN_PLATE_TTL_MS), null);
check("and dropped", plates.size, 0);
const small = new UnknownPlates(UNKNOWN_PLATE_TTL_MS, 3);
for (const k of ["p1", "p2", "p3"]) small.remember(k, { error: "x", status: 404 }, t0);
small.remember("p1", { error: "x", status: 404 }, t0 + 1); // asked again: now the newest
small.remember("p4", { error: "x", status: 404 }, t0 + 2);
check("never holds more than its limit", small.size, 3);
check("the oldest goes first", small.recall("p2", t0 + 3), null);
check("one asked about again is kept", small.recall("p1", t0 + 3)?.status, 404);

// ── The route ──────────────────────────────────────────────────────────────

const DB = "http://db.stand-in.test";
const UNKNOWN = "ZZ99ZZZ"; // DVLA has no record
const KNOWN = "AA11AAA";
const calls = { dvla: [] as string[], events: [] as { event_type: string; metadata: Record<string, unknown> }[], strays: [] as string[] };
let dvlaDown = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  const method = init?.method ?? (input instanceof Request ? input.method : "GET");
  const body = typeof init?.body === "string" ? init.body : "";

  if (url.includes("driver-vehicle-licensing.api.gov.uk")) {
    const reg = (JSON.parse(body) as { registrationNumber: string }).registrationNumber;
    calls.dvla.push(reg);
    if (dvlaDown) return json({ message: "Service unavailable" }, 503);
    return reg === KNOWN ? json({ registrationNumber: reg, make: "TESTMAKE" }) : json({ errors: [{ status: "404" }] }, 404);
  }
  if (url.startsWith(`${DB}/rest/v1/vehicle_lookups`)) {
    return method === "GET" ? json([]) : json(null, 201); // never cached
  }
  if (url.startsWith(`${DB}/rest/v1/site_events`)) {
    calls.events.push(JSON.parse(body) as (typeof calls.events)[number]);
    return json(null, 201);
  }
  calls.strays.push(`${method} ${url.split("?")[0]}`);
  return json({ error: "this test does not talk to the outside world" }, 599);
}) as typeof fetch;

async function main(): Promise<void> {
  // Set before the route loads: it reads the DVLA key once.
  process.env.DVLA_X_API_KEY = "test-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = DB;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.ANALYTICS_WRITES = "1"; // to the stand-in above, nowhere else
  for (const k of Object.keys(process.env)) if (/^(MOT_|DVSA_)/.test(k)) delete process.env[k]; // no MOT credentials: no MOT calls

  // The route logs every step; keep the test's own output readable.
  const real = { log: console.log, warn: console.warn, error: console.error };
  const quiet = <T>(fn: () => Promise<T>): Promise<T> => {
    console.log = console.warn = console.error = () => {};
    return fn().finally(() => Object.assign(console, real));
  };

  const { POST } = await import("../src/app/api/lookup/route");
  let ipCounter = 0;
  const lookup = (vrm: string, headers: Record<string, string> = {}) =>
    quiet(async () => {
      const res = await POST(
        new Request(`https://${HOST}/api/lookup`, {
          method: "POST",
          // A new address each time, so the per-address rate limit is not what is being tested.
          headers: { "Content-Type": "application/json", host: HOST, "x-forwarded-for": `203.0.113.${++ipCounter}`, ...headers },
          body: JSON.stringify({ vrm }),
        }),
      );
      await new Promise((r) => setTimeout(r, 20)); // let the fire-and-forget event write land
      return res.status;
    });
  const fromPage = { "sec-fetch-site": "same-origin", origin: `https://${HOST}` };

  console.log("\nA plate DVLA does not know, asked for again and again:");
  check("the first request is a 404", await lookup(UNKNOWN), 404);
  check("and reached DVLA once", calls.dvla.length, 1);
  let statuses = "";
  for (let i = 0; i < 20; i++) statuses += await lookup(UNKNOWN, i % 2 ? fromPage : {});
  check("twenty more are all 404", statuses, "404".repeat(20));
  check("and none of them reached DVLA", calls.dvla.length, 1);
  check("written with spaces and lower case, still not asked again", await lookup("zz99 zzz"), 404);
  check("DVLA still asked only once", calls.dvla.length, 1);
  check("an unknown plate is not recorded as a lookup", calls.events.length, 0);

  console.log("\nWho gets counted as a visitor's lookup:");
  check("a lookup from our page succeeds", await lookup(KNOWN, fromPage), 200);
  check("and is recorded as `lookup`", calls.events.at(-1)?.event_type, "lookup");
  check("a script's lookup succeeds too (nobody is blocked)", await lookup(KNOWN), 200);
  check("but is recorded as `lookup_direct`", calls.events.at(-1)?.event_type, "lookup_direct");
  check("with the make, like any lookup", calls.events.at(-1)?.metadata.make, "TESTMAKE");
  check("our own server-side re-check succeeds", await lookup(KNOWN, { "x-fpc-internal": "1" }), 200);
  check("and stays a `lookup`", calls.events.at(-1)?.event_type, "lookup");
  check("flagged internal, as before", calls.events.at(-1)?.metadata.internal, true);

  console.log("\nDVLA down is not 'unknown':");
  dvlaDown = true;
  const before = calls.dvla.length;
  check("an outage answers 503", await lookup("BB22BBB", fromPage), 503);
  check("and is recorded as an error", calls.events.at(-1)?.event_type, "lookup_error");
  check("not marked direct, from our page", calls.events.at(-1)?.metadata.direct, undefined);
  await lookup("BB22BBB", fromPage);
  check("the plate is asked about again next time", calls.dvla.length > before + 2, true);
  await lookup("CC33CCC");
  check("a script's failure is marked direct", calls.events.at(-1)?.metadata.direct, true);

  console.log("\nIsolation:");
  check("no request went anywhere but the stand-ins", calls.strays.join(", "), "");

  if (failures > 0) {
    console.error(`\n${failures} lookup-guard assertion(s) failed`);
    process.exit(1);
  }
  console.log("\nAll lookup-guard assertions passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
