/**
 * Assertions for the insurance placements (src/config/insurance.ts,
 * src/config/partners.ts, InsuranceCTA, /go):
 *
 *   1. what is live: Confused.com for cars and vans; motorbikes and temporary
 *      cover show nothing;
 *   2. the links are the three from the publisher dashboard, and a placement
 *      reaches them as `u1` through /go, the only route a click takes;
 *   3. the card says what it is for and names the partner, and makes no claim
 *      (the partner approves every placement, so the wording is pinned here:
 *      a change to it is a change to send them first);
 *   4. a partner's logo is shown only from a file that exists in /public, and
 *      no insurance partner has one until the partner supplies it;
 *   5. there is no fallback insurer (Confused.com or nothing), and Cuvva
 *      comes behind Tempcover for temporary cover;
 *   6. no page links to an insurance comparison site that is not a partner:
 *      the partner's card is the site's only way out for insurance.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PARTNER_LINKS, isGoContext, isPartnerConfigured, isRakutenLink } from "../src/config/partners";
import { insuranceOffer, tempCoverOffer, type InsuranceKind } from "../src/config/insurance";
import InsuranceCTA from "../src/components/InsuranceCTA";

// /go must redirect without recording anything (analytics-writes.ts).
process.env.ANALYTICS_WRITES = "0";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${actual}, want ${expected}`}`);
}

const TRACKER = "https://click.linksynergy.com/fs-bin/click?id=%2aZ3mDbeym%2aI&offerid=";
const LINKS = {
  rvuCarInsurance: `${TRACKER}2164281.967&type=3&subid=0`,
  rvuVanInsurance: `${TRACKER}2164281.969&type=3&subid=0`,
  rvuBikeInsurance: `${TRACKER}2164281.968&type=3&subid=0`,
} as const;
const CONTEXTS = ["money-insurance", "running-costs-insurance"] as const;

async function main(): Promise<void> {
  console.log("\nWhat is live:");
  check("car → Confused.com", insuranceOffer("car")?.go, "rvu-car");
  check("van → Confused.com", insuranceOffer("van")?.go, "rvu-van");
  check("motorbike → nothing (its link's destination is broken)", insuranceOffer("motorbike"), null);
  check("no temporary cover offer", tempCoverOffer(), null);
  check("car entry is configured", isPartnerConfigured(PARTNER_LINKS.rvuCarInsurance), true);
  check("van entry is configured", isPartnerConfigured(PARTNER_LINKS.rvuVanInsurance), true);
  check("bike entry is not", isPartnerConfigured(PARTNER_LINKS.rvuBikeInsurance), false);
  check("Tempcover is not", isPartnerConfigured(PARTNER_LINKS.tempcover), false);

  console.log("\nLinks and brand name:");
  for (const [key, want] of Object.entries(LINKS)) {
    const p = PARTNER_LINKS[key];
    check(`${key}: the dashboard link`, p.url, want);
    check(`${key}: a Rakuten link`, isRakutenLink(p.url), true);
    check(`${key}: named as the brand writes it`, p.name, "Confused.com");
    for (const ctx of CONTEXTS) {
      check(`${key}: ${ctx} rides as u1`, p.buildLink?.("", ctx), `${want}&u1=${ctx}`);
    }
    check(`${key}: a plate never reaches the link`, p.buildLink?.("AB12CDE", "money-insurance").includes("AB12CDE"), false);
  }
  check("three different offers", new Set(Object.values(LINKS)).size, 3);

  console.log("\nThrough /go (the only route a click takes):");
  const { GET } = await import("../src/app/go/[partner]/route");
  const go = (partner: string, ctx: string, ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36") =>
    GET(new Request(`http://localhost/go/${partner}?ctx=${ctx}`, { headers: { cookie: "fpc_v=1", "user-agent": ua } }), {
      params: Promise.resolve({ partner }),
    });
  for (const ctx of CONTEXTS) {
    check(`${ctx} is a placement /go records`, isGoContext(ctx), true);
    const car = await go("rvu-car", ctx);
    check(`/go/rvu-car?ctx=${ctx} redirects`, car.status, 302);
    check(`  … to the car link with &u1=${ctx}`, car.headers.get("location"), `${LINKS.rvuCarInsurance}&u1=${ctx}`);
    const van = await go("rvu-van", ctx);
    check(`/go/rvu-van?ctx=${ctx} → the van link with &u1=${ctx}`, van.headers.get("location"), `${LINKS.rvuVanInsurance}&u1=${ctx}`);
  }
  const bike = await go("rvu-bike", "running-costs-insurance");
  check("/go/rvu-bike goes home while the entry is pending", bike.headers.get("location"), "http://localhost/");
  const temp = await go("tempcover", "buyer-check-temp-cover");
  check("/go/tempcover goes home too", temp.headers.get("location"), "http://localhost/");
  const bot = await go("rvu-car", "money-insurance", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");
  check("a crawler is not sent to the partner", bot.status, 204);
  for (const ctx of ["buyer-check-temp-cover", "car-check-temp-cover", "value-my-car-temp-cover"]) {
    check(`${ctx} is a placement /go records`, isGoContext(ctx), true);
  }

  console.log("\nThe card's wording (ours, and claim-free):");
  const cardText = (kind: InsuranceKind, vehicleName?: string) =>
    renderToStaticMarkup(<InsuranceCTA context="money-insurance" kind={kind} vehicleName={vehicleName} preview />)
      .replace(/<[^>]+>/g, " ")
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  const NOUN: Record<InsuranceKind, string> = { car: "car", van: "van", motorbike: "bike" };
  for (const [kind, name] of [["car", "Ford Fiesta"], ["van", "Ford Transit Custom"], ["motorbike", "Honda CB500F"]] as const) {
    const n = NOUN[kind];
    check(
      `${kind} card`,
      cardText(kind, name),
      `Insuring your ${name}? Insurance is the one running cost we can't work out from the ${n}: it depends on you as much as the ${n}. ` +
        `Compare quotes in one go to see what yours would cost. Compare ${n} insurance with Confused.com ↗ ` +
        `Free Plate Check may earn a small commission from this link.`,
    );
    // No saving, superlative, reward, price or figure, with or without a name.
    for (const text of [cardText(kind, name), cardText(kind)]) {
      const claim = /cheap|best|lowest|sav(e|ing)|reward|free gift|discount|deal|guarantee|trusted|leading|award|£|%|\d/i.exec(
        text.replace(name, "").replace("Free Plate Check", ""),
      );
      check(`${kind} card makes no claim${text.includes(name) ? "" : " (no vehicle name)"}`, claim?.[0] ?? null, null);
    }
  }
  check("no card is drawn where nothing is live", renderToStaticMarkup(<InsuranceCTA context="money-insurance" kind="motorbike" />), "");

  console.log("\nLogos:");
  for (const [key, p] of Object.entries(PARTNER_LINKS)) {
    if (!p.logo) continue;
    check(`${key}: logo file ${p.logo.src} is in /public`, p.logo.src.startsWith("/") && existsSync(join(process.cwd(), "public", p.logo.src)), true);
  }
  // Until the partner supplies an approved file. When it does: add the file,
  // name it on the entry, and change these three to expect it.
  for (const key of Object.keys(LINKS)) {
    check(`${key}: no logo, the card is text-only`, PARTNER_LINKS[key].logo, undefined);
  }
  check("so the card draws no logo plate", renderToStaticMarkup(<InsuranceCTA context="money-insurance" kind="car" preview />).includes("data-partner-logo"), false);
  PARTNER_LINKS.rvuCarInsurance.logo = { src: "/test-only.svg", width: 200, height: 40 };
  const withLogo = renderToStaticMarkup(<InsuranceCTA context="money-insurance" kind="car" preview />);
  check("a named logo is drawn on its plate, with the partner's name as its text", withLogo.includes("data-partner-logo") && withLogo.includes('alt="Confused.com"'), true);
  delete PARTNER_LINKS.rvuCarInsurance.logo;

  console.log("\nNo other comparison site is linked:");
  const OTHER_SITES = /comparethemarket\.|moneysupermarket\.|uswitch\.com|quotezone\./i;
  const offenders: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(entry.name) && OTHER_SITES.test(readFileSync(path, "utf8"))) offenders.push(path);
    }
  };
  walk(join(process.cwd(), "src", "app"));
  walk(join(process.cwd(), "src", "components"));
  check("no page or component links to another insurance comparison site", offenders.join(", "), "");

  console.log("\nFallbacks:");
  check("no other insurer is configured to stand in", "goCompare" in PARTNER_LINKS, false);
  PARTNER_LINKS.rvuCarInsurance.pending = true;
  check("car → nothing if Confused.com is stood down", insuranceOffer("car"), null);
  PARTNER_LINKS.rvuVanInsurance.pending = true;
  check("van → nothing likewise", insuranceOffer("van"), null);
  PARTNER_LINKS.rvuBikeInsurance.pending = false;
  check("bike → Confused.com once its entry is switched on", insuranceOffer("motorbike")?.go, "rvu-bike");

  PARTNER_LINKS.cuvva.url = "https://www.awin1.com/cread.php?awinmid=1&awinaffid=2729598";
  PARTNER_LINKS.cuvva.pending = false;
  check("Cuvva when Tempcover isn't live", tempCoverOffer()?.go, "cuvva");
  PARTNER_LINKS.tempcover.url = "https://click.linksynergy.com/fs-bin/click?id=X&offerid=2.1&type=3&subid=0";
  PARTNER_LINKS.tempcover.pending = false;
  check("Tempcover ahead of Cuvva", tempCoverOffer()?.go, "tempcover");

  if (failures > 0) {
    console.error(`\n${failures} insurance check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll insurance checks passed");
}

void main();
