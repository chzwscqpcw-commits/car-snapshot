"use client";

import { Shield, Tag } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";

/**
 * `generic` — standalone tool-landing pages, no vehicle context.
 * `mot`      — an out-of-warranty car whose last MOT flagged advisories/defects.
 * `runningCosts` — the running-cost forecast, whose one unmodellable line is repairs.
 * `repair`   — a repair-cost guide for a job a warranty would actually have paid for.
 * `classic`  — a 1980s–2000s survivor, routed to their CLASSIC plan instead.
 * `model`    — a model page whose readers are asking "is the X reliable?".
 * `report`   — the full free vehicle report, as a next step.
 */
type Variant = "generic" | "mot" | "runningCosts" | "repair" | "classic" | "model" | "report";

interface WarrantyCTAProps {
  /**
   * Placement tag. Used as BOTH the `click_context` on our own partner_click
   * event AND the Awin `clickref`, so a commission line in Awin's dashboard can
   * be matched to the placement that earned it. Keep them identical — that
   * pairing is the whole point (see the buildLink note in partners.ts).
   */
  context: string;
  /** Reg to pre-fill on Warrantywise, where the placement knows one. */
  regNumber?: string;
  /** Which copy preset to render. */
  variant?: Variant;
  /**
   * Variant-specific detail woven into the copy — the flagged-item count for
   * `mot`, the job name for `repair`. Ignored by the other variants.
   */
  detail?: string;
  /**
   * `block` = standalone panel for static pages (default). `inline` = tighter
   * card that matches the rounded-2xl rhythm of the result-page sections it
   * sits among.
   */
  layout?: "block" | "inline";
}

function copyFor(variant: Variant, detail?: string): { title: string; body: React.ReactNode } {
  switch (variant) {
    case "mot":
      return {
        title: "The repairs your MOT just warned about aren't covered",
        body: (
          <>
            This car has {detail ?? "items flagged at its last MOT"} and is past the age
            where manufacturer cover normally runs.{" "}
            <strong className="text-slate-100">Warrantywise</strong> extended warranties
            pay for major mechanical and electrical failures — engine, gearbox,
            electronics, air-con — so the next advisory that turns into a real fault
            doesn&apos;t land as a four-figure bill.
          </>
        ),
      };
    case "runningCosts":
      return {
        title: "The one running cost this forecast can't predict",
        body: (
          <>
            Fuel, tax, insurance and servicing are all predictable — that&apos;s why we can
            forecast them. A failed gearbox, turbo or ECU isn&apos;t, and it&apos;s the
            single line that wrecks a car budget.{" "}
            <strong className="text-slate-100">Warrantywise</strong> extended warranties
            cover exactly those failures, turning an unknown into a monthly figure.
          </>
        ),
      };
    case "repair":
      // Deliberately does NOT claim this job is covered. Cambelts, clutches and
      // DPFs are service/wear items that virtually every extended warranty
      // excludes — selling them as covered would be untrue, and the click would
      // die at the small print. The honest pitch uses the price the reader has
      // just absorbed as an anchor for the failures that ARE covered.
      return {
        title: "This is what one out-of-warranty bill looks like",
        body: (
          <>
            A {detail ?? "job like this"} is normally classed as a service or wear item,
            so no extended warranty covers it. Engine, gearbox, turbo and ECU failures
            cost several times more — and those are what{" "}
            <strong className="text-slate-100">Warrantywise</strong> cover. Worth knowing
            which side of that line your next bill falls on.
          </>
        ),
      };
    case "classic":
      // Routed to their classic plan by buildLink (see partners.ts). Their own
      // definition of a "modern classic" is a 1980s–2000s vehicle, so this is
      // their product for this reader, not a stretch of the mainstream one.
      return {
        title: "Still running one of the survivors?",
        body: (
          <>
            Parts get scarcer and specialists get pricier as a model thins out — the
            reason these cars disappear is usually one bill the owner decided not to pay.{" "}
            <strong className="text-slate-100">Warrantywise</strong> cover modern classics
            (their term for 1980s–2000s cars) as a separate plan, built around exactly
            that problem.
          </>
        ),
      };
    case "model":
      return {
        title: `Worried what ${detail ?? "this model"} costs when it goes wrong?`,
        body: (
          <>
            Reliability data tells you the odds; it doesn&apos;t pay the bill when you land
            on the wrong side of them.{" "}
            <strong className="text-slate-100">Warrantywise</strong> extended warranties
            cover major mechanical and electrical failures — engine, gearbox, electronics,
            air-con — on cars past their manufacturer cover.
          </>
        ),
      };
    case "report":
      return {
        title: "Your report is free. The next repair bill won't be.",
        body: (
          <>
            You now know this car&apos;s MOT record, mileage and advisories. What none of
            that predicts is the failure that hasn&apos;t happened yet.{" "}
            <strong className="text-slate-100">Warrantywise</strong> extended warranties
            cover major mechanical and electrical breakdowns on cars past their factory
            warranty.
          </>
        ),
      };
    case "generic":
    default:
      return {
        title: "Protect your car against unexpected bills",
        body: (
          <>
            Older or higher-mileage cars are most at risk of expensive component failures.{" "}
            <strong className="text-slate-100">Warrantywise</strong> extended warranties
            cover major mechanical and electrical breakdowns — engine, gearbox,
            electronics, AC — so a single repair doesn&apos;t wipe out months of savings.
          </>
        ),
      };
  }
}

/**
 * Warrantywise extended-warranty CTA, placed contextually on surfaces where the
 * vehicle data signals warranty value (advisories, age, high mileage, a
 * big-ticket repair the reader is already pricing up).
 *
 * Returns null while the partner is in `pending: true` state (merchant ID not
 * yet filled in). Flip pending to false in partners.ts and replace
 * PENDING_AWINMID with the real numeric ID to activate everywhere it's mounted.
 */
export default function WarrantyCTA({
  context,
  regNumber,
  variant = "generic",
  detail,
  layout = "block",
}: WarrantyCTAProps) {
  const partner = PARTNER_LINKS.warrantywise;
  if (!isPartnerConfigured(partner)) return null;

  // Always go through buildLink, even with no reg — it's what carries the
  // clickref. `partner.url` is the bare tracker and would drop attribution.
  const href = partner.buildLink
    ? partner.buildLink(regNumber ?? "", context)
    : partner.url;

  const { title, body } = copyFor(variant, detail);
  const inline = layout === "inline";
  const indent = inline ? "" : "ml-8";

  return (
    <div
      className={
        inline
          ? "rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/30 via-slate-900/70 to-slate-900 p-5 sm:p-6"
          : "rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/30 to-slate-900/30 p-5 sm:p-6"
      }
    >
      <div className="flex items-start gap-3 mb-3">
        <Shield className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
        <h3 className={`font-semibold text-white ${inline ? "text-sm" : "text-base sm:text-lg"}`}>
          {title}
        </h3>
      </div>

      <p className={`text-slate-300 leading-relaxed mb-4 ${indent} ${inline ? "text-xs" : "text-sm"}`}>
        {body}
      </p>

      {/* Discount badge — mirrors the carVertical pattern. `affiliate10` is the
          GENERIC Awin affiliate code shipped in Warrantywise's own creatives,
          not one issued to us, so unlike `freeplatecheck` it proves nothing
          about where a sale came from. Swap it for a Free-Plate-Check-specific
          code the moment Jack Fisher supplies one — with commission arriving as
          untracked bonus payments, a unique code is the only thing that would
          make a sale attributable to us. */}
      <p className={`${indent} mb-3 inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300`}>
        <Tag className="h-3 w-3 shrink-0" aria-hidden />
        10% off with code
        <span className="font-mono font-bold tracking-wide text-emerald-200">affiliate10</span>
      </p>

      <div className={`${indent} flex flex-col sm:flex-row sm:items-center gap-3`}>
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          onClick={() => trackPartnerClick("warrantywise", context)}
          className="inline-flex items-center justify-center whitespace-nowrap px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {inline ? "Get a warranty quote" : "Get a warranty quote — Warrantywise"} &#8599;
        </a>
        <span className="text-xs text-slate-500">
          FCA regulated &middot; 30-day money-back
        </span>
      </div>

      <p className={`text-xs text-slate-500 mt-3 ${indent}`}>
        Free Plate Check may earn a small commission from this link.
      </p>
    </div>
  );
}
