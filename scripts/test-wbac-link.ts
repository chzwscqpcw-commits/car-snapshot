/**
 * Assertions for the We Buy Any Car tracker link (partners.ts) and the van
 * gate. The plate must not leave the site (webuyanycar.com can't pre-fill it),
 * the placement must reach Rakuten as `u1` — it's the only per-placement
 * detail a sale can carry back — and vans must never qualify (WBAC's
 * programme is cars only).
 */
import { PARTNER_LINKS, WBAC_PREFILLS_PLATE, isPartnerConfigured } from "../src/config/partners";
import { isVan } from "../src/lib/report-v2/format";

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — ${detail}`}`);
}

const wbac = PARTNER_LINKS.weBuyAnyCar;
const link = wbac.buildLink!("AB12 CDE", "valuation-result-wbac");
const params = new URL(link).searchParams;

console.log("\nWe Buy Any Car link:");
check("goes through the Rakuten tracker", link.startsWith("https://click.linksynergy.com/fs-bin/click?"), link);
check("carries our publisher token", params.get("id") === "*Z3mDbeym*I", link);
check("uses WBAC's text link", params.get("offerid") === "2128398.2", link);
check("carries the placement as u1", params.get("u1") === "valuation-result-wbac", link);
check("sends no plate", !WBAC_PREFILLS_PLATE && !/AB12CDE/i.test(link), link);
check("an empty plate still builds a link", !!wbac.buildLink!("", "money-wbac"));
check("is live", isPartnerConfigured(wbac));

console.log("\nVan gate:");
check("N1 type approval is a van", isVan({ typeApproval: "N1" }));
check("a 'Panel Van' body style is a van", isVan({}, "Panel Van"));
check("an M1 car is not", !isVan({ typeApproval: "M1" }, "Hatchback"));
check("no data is not a van", !isVan({}));

console.log(failures ? `\n${failures} failure(s)` : "\nAll We Buy Any Car link checks passed");
process.exit(failures ? 1 : 0);
