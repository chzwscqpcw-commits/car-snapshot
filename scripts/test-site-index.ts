/**
 * The site index (src/lib/site-index.ts) is what the command palette, the
 * mobile drawer and /tools show. It is hand-kept, so this walks src/app and
 * fails when a public page has no entry — the index had drifted by five pages
 * before this existed — and when an entry points at a page that no longer
 * exists.
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { PRIMARY_NAV, SITE_ITEMS, toolsPageItems } from "../src/lib/site-index";
import { SITE_ICONS } from "../src/components/site-icons";

const APP_DIR = join(process.cwd(), "src", "app");

// Pages that are deliberately not in the index. Legal pages may be in it (they
// are) but needn't be; the rest are admin, previews, demos, or reached only
// from an email link.
const NOT_INDEXED = [
  "/privacy",
  "/terms",
  "/results",
  "/data-health",
  "/unsubscribe",
  /^\/preview(\/|$)/,
  /^\/demo(\/|$)/,
];

function isAllowedOut(route: string): boolean {
  return NOT_INDEXED.some((rule) => (typeof rule === "string" ? rule === route : rule.test(route)));
}

/** Every static route with a page.tsx: "/", "/mot-check", "/stats/van-theft"… */
function staticRoutes(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...staticRoutes(full));
    } else if (name === "page.tsx") {
      const segments = relative(APP_DIR, dir)
        .split(sep)
        .filter((s) => s && !/^\(.*\)$/.test(s)); // route groups don't appear in the URL
      if (segments.some((s) => s.startsWith("["))) continue; // dynamic routes have no fixed address
      out.push("/" + segments.join("/"));
    }
  }
  return out.sort();
}

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}

const routes = staticRoutes(APP_DIR);
const routeSet = new Set(routes);
const pathOf = (href: string) => href.split(/[?#]/)[0];
const indexed = new Set(SITE_ITEMS.map((i) => pathOf(i.href)));

console.log("\nEvery public page is in the index:");
const missing = routes.filter((r) => !indexed.has(r) && !isAllowedOut(r));
check(`${routes.length} static pages found, ${missing.length} missing from the index`, missing.length === 0, missing.join(", "));

console.log("\nEvery index entry points at a page that exists:");
const dead = SITE_ITEMS.filter((i) => !routeSet.has(pathOf(i.href)));
check(`${SITE_ITEMS.length} entries, ${dead.length} dead`, dead.length === 0, dead.map((i) => i.href).join(", "));
const deadToolLinks = SITE_ITEMS.filter((i) => i.tools?.href && !routeSet.has(pathOf(i.tools.href)));
check("tool-card links resolve too", deadToolLinks.length === 0, deadToolLinks.map((i) => i.tools?.href).join(", "));
const deadNav = PRIMARY_NAV.filter((l) => !indexed.has(pathOf(l.href)));
check("primary nav links are indexed", deadNav.length === 0, deadNav.map((l) => l.href).join(", "));

console.log("\nThe index is well-formed:");
const seen = new Map<string, number>();
for (const i of SITE_ITEMS) seen.set(i.href, (seen.get(i.href) ?? 0) + 1);
const dupes = [...seen].filter(([, n]) => n > 1).map(([h]) => h);
check("no duplicate hrefs", dupes.length === 0, dupes.join(", "));
const badIcons = SITE_ITEMS.filter((i) => i.icon && !SITE_ICONS[i.icon]);
check("every icon name is known", badIcons.length === 0, badIcons.map((i) => `${i.href}: ${i.icon}`).join(", "));
const noPlate = SITE_ITEMS.filter((i) => /[?#]vrm=/i.test(i.href) || /[?#]vrm=/i.test(i.tools?.href ?? ""));
check("no entry carries a plate", noPlate.length === 0, noPlate.map((i) => i.href).join(", "));

console.log("\n/tools reads from the same list:");
const checks = toolsPageItems("checks");
const utilities = toolsPageItems("utilities");
check(`${checks.length} checks and ${utilities.length} utilities have cards`, checks.length >= 8 && utilities.length >= 6);
for (const href of ["/", "/booking", "/mot-prices", "/mot-reminder", "/check-before-you-buy", "/mot-exemption-check"]) {
  check(`${href} has a card`, [...checks, ...utilities].some((i) => i.href === href));
}
const thinBlurbs = [...checks, ...utilities].filter((i) => (i.tools?.blurb ?? "").length < 30);
check("every card has a real blurb", thinBlurbs.length === 0, thinBlurbs.map((i) => i.href).join(", "));
const reminder = SITE_ITEMS.find((i) => i.href === "/mot-reminder");
check("the reminder card no longer says we email you", !/we email you/i.test(reminder?.tools?.blurb ?? "") && !/we email you/i.test(reminder?.subtitle ?? ""));

if (failures) {
  console.error(`\n${failures} site-index check(s) failed`);
  process.exit(1);
}
console.log("\nAll site-index checks passed");
