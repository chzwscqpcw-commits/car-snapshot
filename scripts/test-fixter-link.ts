/**
 * Fixter (Awin 18184) link checks: the tracker carries our affiliate id and
 * the merchant id, the clickref survives encoding, the destination is the
 * right Fixter page for the job, and no registration ever rides along.
 *
 *   npx tsx scripts/test-fixter-link.ts
 */
import { PARTNER_LINKS, isPartnerConfigured, getPartnerRel } from "../src/config/partners";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

console.log("Fixter links");
for (const [id, job, page] of [
  ["fixter", "service", "car-service"],
  ["fixterMot", "mot", "mot"],
] as const) {
  const partner = PARTNER_LINKS[id];
  check(`${id} is configured`, isPartnerConfigured(partner));
  const href = partner.buildLink!("AB12 CDE", `fixter-${job}-test`);
  const url = new URL(href);
  check(`${id} goes through Awin`, url.hostname === "www.awin1.com" && url.pathname === "/cread.php", href);
  check(`${id} carries merchant 18184 and our affiliate id`, url.searchParams.get("awinmid") === "18184" && url.searchParams.get("awinaffid") === "2729598");
  check(`${id} keeps the clickref`, url.searchParams.get("clickref") === `fixter-${job}-test`, url.searchParams.get("clickref"));
  check(`${id} lands on the ${page} page`, url.searchParams.get("ued") === `https://www.fixter.co.uk/${page}/`, url.searchParams.get("ued"));
  check(`${id} never carries the plate`, !/AB12/i.test(href));
  check(`${id} is marked sponsored`, getPartnerRel(partner).includes("sponsored"));
}

if (failed) {
  console.error(`\n${failed} Fixter check(s) failed`);
  process.exit(1);
}
console.log("\nAll Fixter checks passed");
