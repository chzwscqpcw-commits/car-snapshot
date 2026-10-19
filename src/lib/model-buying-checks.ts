// "Buying a used {model}: what to check" — the buyer section on
// /cars/[make]/[model]. Pure, so scripts/test-model-buying-checks.ts can run it.
//
// Why: the model pages are the site's largest set of buyer-intent pages (154
// of them), but until Oct 2026 they read as spec sheets — reliability,
// depreciation, running costs — with nothing telling someone looking at a
// used example what to check on THAT model. Every check here comes from data
// the page already holds (DVSA MOT failure areas, DVLA theft FOI, DVSA
// recalls, licensing counts); nothing is invented per model.

import type { ModelGuideData } from "@/lib/model-guides";
import theftStats from "@/data/theft-stats.json";

export type BuyingCheckTone = "risk" | "warn" | "info";

export interface BuyingCheck {
  id: string;
  tone: BuyingCheckTone;
  title: string;
  detail: string;
}

type Input = Pick<
  ModelGuideData,
  "displayModel" | "motPassRate" | "theftRisk" | "recalls" | "rarity" | "isEv"
>;

function listAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function buildModelBuyingChecks(d: Input): BuyingCheck[] {
  const checks: BuyingCheck[] = [];
  const m = d.displayModel;

  const areas = (d.motPassRate?.commonFailureReasons ?? []).slice(0, 3);
  if (areas.length > 0 && d.motPassRate) {
    const below = !d.motPassRate.aboveAverage;
    checks.push({
      id: "mot-failure-areas",
      tone: below ? "warn" : "info",
      title: `Where the ${m} fails its MOT: ${listAnd(areas.map((a) => a.toLowerCase()))}`,
      detail:
        `These are the ${m}'s most common MOT failure areas in DVSA's test data` +
        (below
          ? `, and its first-time pass rate (${d.motPassRate.passRate}%) is below the UK average of ${d.motPassRate.nationalAverage}%.`
          : ` (first-time pass rate ${d.motPassRate.passRate}% vs ${d.motPassRate.nationalAverage}% UK average).`) +
        " Look closely at them on the viewing, and check whether they show up as advisories in the car's own MOT history.",
    });
  }

  if (d.theftRisk && (d.theftRisk.riskCategory === "very-high" || d.theftRisk.riskCategory === "high")) {
    const times = d.theftRisk.rateMultiplier;
    checks.push({
      id: "theft",
      tone: "risk",
      title: `A target for thieves — check it isn't stolen or cloned`,
      detail:
        // "of these on the road" rather than "{model}s": plurals of model
        // names go wrong ("4 Seriess", "X5s").
        `${d.theftRisk.theftsPer1000} in every 1,000 of these on the road were stolen in ${theftStats.year}` +
        (times >= 1.5 ? `, about ${Math.round(times * 10) / 10}× the national rate` : "") +
        `. Stolen cars are often given a clean car's plates and resold. Check the VIN on the car matches the logbook, and run a stolen-vehicle check before paying.`,
    });
  }

  if (d.recalls.length > 0) {
    const n = d.recalls.length;
    checks.push({
      id: "recalls",
      tone: "warn",
      // Counts every recall across all build years (the BMW 4 Series has 50),
      // so the copy must not read as "this car has 50 faults".
      title: `${n} safety recall${n === 1 ? " has" : "s have"} been issued for the ${m}`,
      detail:
        `Each covers cars built in a set date range, so not every one applies to a given car. Enter the reg to see which do, then ask the seller for proof the work was done — recall work is free at a franchised dealer.`,
    });
  }

  if (d.isEv) {
    checks.push({
      id: "ev-battery",
      tone: "info",
      // Worded for plug-in hybrids too: `isEv` is true whenever ev-specs.json
      // holds ANY variant of the model, so the BMW X5 (xDrive45e) counts.
      title: "Electric or plug-in hybrid? Ask for a battery health report",
      detail:
        "The battery is a big part of the car's value. Ask for a state-of-health report, check the electric range the car actually shows when fully charged, and confirm the charging cable comes with it.",
    });
  }

  if (d.rarity && (d.rarity.category === "very-rare" || d.rarity.category === "rare")) {
    checks.push({
      id: "rarity",
      tone: "info",
      title: `Only ${d.rarity.licensed.toLocaleString("en-GB")} still licensed in the UK`,
      detail: "Fewer to choose from and fewer specialists who know them. Check parts availability and service history carefully.",
    });
  }

  checks.push({
    id: "hidden-history",
    tone: "info",
    title: "What no free check can show",
    detail:
      "Outstanding finance, insurance write-offs and police stolen markers aren't in public DVLA or MOT data. A car with finance owing can be repossessed from its new owner — check before you pay.",
  });

  return checks;
}

/** The same checks as one FAQ answer, for the page's FAQ + FAQPage schema. */
export function buyingChecksFaqAnswer(d: Input): string {
  const checks = buildModelBuyingChecks(d);
  const parts = checks
    .filter((c) => c.id !== "hidden-history")
    .map((c) => `${c.title}. ${c.detail}`);
  parts.push(
    "Whatever the model, check the car matches its logbook and the advert, read its MOT history for mileage that goes backwards or advisories that keep coming back, and get a history check for finance and write-offs.",
  );
  return parts.join(" ");
}
