/**
 * Pull Awin transactions and group them by clickRef.
 *
 * WHY: our own `site_events` can see clicks but never sales — a booking exists
 * only on Awin's side. Every BookMyGarage hand-off carries a clickref
 * (`booking-flow-<service>` from Step 4, `blog-inline-*` from prose, and so
 * on), and Awin passes it through to the commission record. Grouping the
 * transactions by that field is the only way to answer "which surface actually
 * sells", as opposed to "which surface gets clicked".
 *
 * USAGE:
 *   AWIN_API_TOKEN=xxx npx tsx scripts/awin-transactions.ts [startDate] [endDate]
 *
 * Dates are ISO (YYYY-MM-DD) and default to the window of the merchant-
 * performance export already in the repo, 2026-05-01 to 2026-09-10.
 *
 * GETTING A TOKEN: Awin UI → your account menu → Account Settings → API
 * credentials → generate an OAuth2 token. It's a read-only bearer token for
 * the publisher account; it is NOT stored by this script and should not be
 * committed. Pass it on the command line as above.
 */

const PUBLISHER_ID = "2729598"; // Free Plate Check — matches awinaffid in partners.ts
const API = "https://api.awin.com";

interface AwinTransaction {
  id: number;
  advertiserId: number;
  commissionStatus: string;
  transactionDate: string;
  saleAmount?: { amount: number; currency: string };
  commissionAmount?: { amount: number; currency: string };
  clickRefs?: Record<string, string>;
  clickRef?: string;
}

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function money(n: number): string {
  return `£${n.toFixed(2)}`;
}

async function main(): Promise<void> {
  const token = process.env.AWIN_API_TOKEN;
  if (!token) {
    fail(
      "AWIN_API_TOKEN is not set.\n" +
        "  Generate one in the Awin UI (Account Settings → API credentials), then:\n" +
        "  AWIN_API_TOKEN=xxx npx tsx scripts/awin-transactions.ts",
    );
  }

  const startDate = process.argv[2] ?? "2026-05-01";
  const endDate = process.argv[3] ?? "2026-09-10";

  // Awin caps a single transaction query at 31 days, so walk the window in
  // month-sized chunks rather than asking for the lot and getting a 400.
  const all: AwinTransaction[] = [];
  let cursor = new Date(`${startDate}T00:00:00Z`);
  const final = new Date(`${endDate}T23:59:59Z`);

  while (cursor < final) {
    const chunkEnd = new Date(Math.min(cursor.getTime() + 30 * 864e5, final.getTime()));
    const params = new URLSearchParams({
      startDate: `${cursor.toISOString().slice(0, 10)}T00:00:00`,
      endDate: `${chunkEnd.toISOString().slice(0, 10)}T23:59:59`,
      timezone: "Europe/London",
      dateType: "transaction",
    });
    const url = `${API}/publishers/${PUBLISHER_ID}/transactions/?${params}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      fail(`Awin returned ${res.status} for ${cursor.toISOString().slice(0, 10)}\n  ${body.slice(0, 300)}`);
    }
    const batch = (await res.json()) as AwinTransaction[];
    all.push(...batch);
    cursor = new Date(chunkEnd.getTime() + 864e5);
  }

  if (all.length === 0) {
    console.log("\nNo transactions returned for that window.\n");
    return;
  }

  console.log(`\nAwin transactions ${startDate} → ${endDate}: ${all.length}\n`);

  // The clickref may arrive as a bare `clickRef` or inside a `clickRefs` map
  // depending on the endpoint version — check both before giving up.
  const refOf = (t: AwinTransaction): string =>
    t.clickRef || t.clickRefs?.clickRef || t.clickRefs?.["clickRef"] || "(no clickref)";

  const byRef = new Map<string, { count: number; commission: number; sale: number; statuses: string[] }>();
  for (const t of all) {
    const key = refOf(t);
    const row = byRef.get(key) ?? { count: 0, commission: 0, sale: 0, statuses: [] };
    row.count += 1;
    row.commission += t.commissionAmount?.amount ?? 0;
    row.sale += t.saleAmount?.amount ?? 0;
    row.statuses.push(t.commissionStatus);
    byRef.set(key, row);
  }

  console.log("BY CLICKREF — which surface actually sells:");
  const rows = [...byRef.entries()].sort((a, b) => b[1].commission - a[1].commission);
  for (const [ref, r] of rows) {
    console.log(
      `  ${String(r.count).padStart(3)}  ${money(r.commission).padStart(8)}  ` +
        `basket ${money(r.sale).padStart(9)}  ${ref}  [${[...new Set(r.statuses)].join(", ")}]`,
    );
  }

  console.log("\nBY ADVERTISER:");
  const byAdv = new Map<number, { count: number; commission: number }>();
  for (const t of all) {
    const row = byAdv.get(t.advertiserId) ?? { count: 0, commission: 0 };
    row.count += 1;
    row.commission += t.commissionAmount?.amount ?? 0;
    byAdv.set(t.advertiserId, row);
  }
  for (const [id, r] of [...byAdv.entries()].sort((a, b) => b[1].commission - a[1].commission)) {
    console.log(`  ${String(r.count).padStart(3)}  ${money(r.commission).padStart(8)}  advertiser ${id}`);
  }

  const noRef = byRef.get("(no clickref)")?.count ?? 0;
  if (noRef > 0) {
    console.log(
      `\n⚠  ${noRef} transaction(s) carry no clickref — those came through a link ` +
        `that wasn't tagged, so they can't be attributed to a surface.`,
    );
  }
  console.log("");
}

main().catch((err) => fail(String(err)));
