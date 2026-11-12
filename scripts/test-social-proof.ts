/**
 * Assertions for GET /api/social-proof — the homepage's "N+ checked" figure.
 *
 * The failure this pins: the route asked the database for an exact count of
 * every lookup, the table outgrew the 3-second statement timeout, and the
 * route answered 500 on most requests for weeks.
 *
 * The route runs for real here, with the real Supabase client, against a
 * local stand-in for the database's REST API that behaves as production did
 * on 12 Nov 2026: an exact count is cancelled with Postgres 57014, the
 * planner's estimate comes back at once. Nothing leaves this machine.
 */
import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

/** What the stand-in database does with the next requests. */
let mode: "healthy" | "timeout" | "garbage" | "hang" = "healthy";
let estimate = 122_723;
const seen: { method: string; url: string; prefer: string }[] = [];

const TIMEOUT_BODY = JSON.stringify({
  code: "57014",
  details: null,
  hint: null,
  message: "canceling statement due to statement timeout",
});

const db = createServer((req: IncomingMessage, res) => {
  const prefer = String(req.headers.prefer ?? "");
  seen.push({ method: req.method ?? "", url: req.url ?? "", prefer });

  if (mode === "hang") return; // never answers; the route has to give up
  if (mode === "garbage") {
    res.writeHead(200, { "Content-Type": "application/json" }).end("[]"); // no Content-Range
    return;
  }
  // The table is too big to count row by row, whatever the mode.
  if (mode === "timeout" || prefer.includes("count=exact")) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(req.method === "HEAD" ? undefined : TIMEOUT_BODY);
    return;
  }
  res.writeHead(206, { "Content-Type": "application/json", "Content-Range": `*/${estimate}` });
  res.end(req.method === "HEAD" ? undefined : "[]");
});

async function main(): Promise<void> {
  await new Promise<void>((resolve) => db.listen(0, "127.0.0.1", resolve));
  const { port } = db.address() as AddressInfo;

  // Quiet the route's own error logging, and keep what it said.
  const logged: string[] = [];
  const realError = console.error;
  console.error = (...args: unknown[]) => void logged.push(args.map(String).join(" "));

  const { resetLookupTotal } = await import("../src/lib/social-proof");
  const { GET } = await import("../src/app/api/social-proof/route");
  const call = async () => {
    const res = await GET();
    return { status: res.status, cache: res.headers.get("cache-control") ?? "", body: (await res.json()) as { total: unknown } };
  };

  console.log("\nNo database configured:");
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let r = await call();
  check("answers 200, not 500", r.status, 200);
  check("with no figure", r.body.total, null);

  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

  console.log("\nA table too big to count exactly (production, Oct–Nov 2026):");
  mode = "healthy";
  seen.length = 0;
  r = await call();
  check("answers 200", r.status, 200);
  check("with the planner's estimate", r.body.total, 122_723);
  check("cached for ten minutes in the browser", r.cache.includes("max-age=600"), true);
  check("one request to the database", seen.length, 1);
  check("to site_events", seen[0]?.url.startsWith("/rest/v1/site_events?"), true);
  check("for lookups only", seen[0]?.url.includes("event_type=eq.lookup"), true);
  check("asking for the estimate", seen[0]?.prefer.includes("count=planned"), true);
  check("never an exact count", seen.some((s) => s.prefer.includes("count=exact")), false);
  check("as a GET, so an error comes with its reason", seen[0]?.method, "GET");
  check("for no rows", seen[0]?.url.includes("limit=0"), true);

  console.log("\nThe estimate steps down after a statistics refresh:");
  estimate = 121_900;
  r = await call();
  check("the figure does not go backwards", r.body.total, 122_723);
  estimate = 123_400;
  r = await call();
  check("and moves up when the estimate does", r.body.total, 123_400);

  console.log("\nThe database times out after a good read:");
  mode = "timeout";
  logged.length = 0;
  r = await call();
  check("answers 200, not 500", r.status, 200);
  check("with the last good figure", r.body.total, 123_400);
  check("cached for a minute only", r.cache, "public, max-age=60, s-maxage=60");
  check("and the log says why (it used to be blank)", logged.some((l) => l.includes("57014") && l.includes("statement timeout")), true);

  console.log("\nThe database times out on a fresh server instance:");
  resetLookupTotal();
  r = await call();
  check("answers 200, not 500", r.status, 200);
  check("with no figure, so the page leaves the counter out", r.body.total, null);
  check("cached for a minute only", r.cache, "public, max-age=60, s-maxage=60");

  console.log("\nAn answer with no count in it:");
  mode = "garbage";
  r = await call();
  check("answers 200", r.status, 200);
  check("with no figure", r.body.total, null);

  console.log("\nThe database never answers:");
  mode = "hang";
  const started = Date.now();
  r = await call();
  check("answers 200", r.status, 200);
  check("with no figure", r.body.total, null);
  check("without waiting past the database's own 3s limit", Date.now() - started < 3000, true);

  console.error = realError;
  db.closeAllConnections();
  db.close();

  if (failures > 0) {
    console.error(`\n${failures} social-proof assertion(s) failed`);
    process.exit(1);
  }
  console.log("\nAll social-proof assertions passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
