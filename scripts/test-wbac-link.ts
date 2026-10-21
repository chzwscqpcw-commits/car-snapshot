/**
 * Assertions for the We Buy Any Car tracker link (partners.ts). The plate must
 * not leave the site until pre-fill is confirmed (WBAC_PREFILLS_PLATE), and the
 * placement must reach Webgains as `clickref` — it's the only per-placement
 * detail a sale can carry back.
 */
import { PARTNER_LINKS, WBAC_PREFILLS_PLATE, isPartnerConfigured } from "../src/config/partners";

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — ${detail}`}`);
}

const wbac = PARTNER_LINKS.weBuyAnyCar;
const link = wbac.buildLink!("AB12 CDE", "valuation-result-wbac");
const target = decodeURIComponent(new URL(link).searchParams.get("wgtarget") ?? "");

console.log("\nWe Buy Any Car link:");
check("goes through the Webgains tracker", link.startsWith("https://track.webgains.com/click.html?"), link);
check("lands on webuyanycar.com", target.startsWith("https://www.webuyanycar.com/"), target);
check("carries the placement as clickref", new URL(link).searchParams.get("clickref") === "valuation-result-wbac", link);
if (!WBAC_PREFILLS_PLATE) check("sends no plate while pre-fill is unconfirmed", !/AB12CDE/i.test(link), link);
else check("pre-fill sends the cleaned plate", target.includes("AB12CDE"), target);
check("an empty plate still builds a link", !!wbac.buildLink!("", "money-wbac"));
if (wbac.url.includes("PENDING")) check("stays hidden while the Webgains IDs are placeholders", !isPartnerConfigured(wbac));

console.log(failures ? `\n${failures} failure(s)` : "\nAll We Buy Any Car link checks passed");
process.exit(failures ? 1 : 0);
