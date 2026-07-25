"use client";

import { useState } from "react";
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick, trackConversion } from "@/lib/tracking";
import Button from "@/components/Button";
import BoltMark from "@/components/BoltMark";
import ScanBeamReveal from "@/components/ScanBeamReveal";
import {
  calculateRepairCost,
  type RepairCostSlug,
  type VehicleSummary,
  type CostEstimate,
} from "@/lib/repair-cost-calculators";

interface PersonalisedCostLookupProps {
  slug: RepairCostSlug;
  jobName: string;
  partner?: "bookMyGarage" | "bookMyGarageService" | "bookMyGarageRepair";
}

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function isValidReg(reg: string): boolean {
  const cleaned = cleanReg(reg);
  return cleaned.length >= 2 && cleaned.length <= 8;
}

/**
 * The differentiator. Competitor cost guides redirect to a generic vehicle
 * search; we fetch the vehicle and render a personalised estimate inline.
 *
 * Renders three states: empty form → loading → personalised result. The
 * result includes a vehicle-specific cost range, an explanation tailored to
 * the car's age/fuel/year, and a BMG affiliate CTA with the reg pre-loaded.
 */
export default function PersonalisedCostLookup({
  slug,
  jobName,
  partner = "bookMyGarageRepair",
}: PersonalisedCostLookupProps) {
  const [reg, setReg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    vehicle: VehicleSummary;
    estimate: CostEstimate;
  } | null>(null);

  const partnerConfig = PARTNER_LINKS[partner];
  const partnerRel = getPartnerRel(partnerConfig);

  async function handleLookup() {
    const cleaned = cleanReg(reg);
    if (!cleaned) {
      setError("Please enter a registration number");
      return;
    }
    if (!isValidReg(reg)) {
      setError("That doesn’t look like a valid UK registration");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: cleaned }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Couldn’t find that vehicle — check the reg and try again.");
        setSubmitting(false);
        return;
      }

      const payload = await res.json();
      const data = payload?.data;
      if (!data) {
        setError("Couldn’t read the vehicle details — try again in a moment.");
        setSubmitting(false);
        return;
      }

      const vehicle: VehicleSummary = {
        registrationNumber: data.registrationNumber || cleaned,
        make: data.make,
        model: data.model,
        yearOfManufacture: data.yearOfManufacture,
        fuelType: data.fuelType,
        motTests: data.motTests,
      };

      const estimate = calculateRepairCost(slug, vehicle);

      // A successful reg lookup is a genuine reg_search — count it so
      // repair-cost bridging is visible in the funnel (it was previously
      // invisible: this component only ever fired trackPartnerClick). flow
      // "tool" matches the widget searches; source "repair-cost" + slug make
      // these countable per guide. NB: this inline lookup shows the estimate in
      // place rather than navigating, so these reg_search events have no paired
      // results_view — a deliberate denominator change.
      trackConversion("reg_search", {
        vrm: cleaned,
        flow: "tool",
        source: "repair-cost",
        slug,
        target_path: `/repair-costs/${slug}`,
      });

      setResult({ vehicle, estimate });
    } catch {
      setError("Couldn’t reach the lookup service — try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setResult(null);
    setReg("");
    setError("");
  }

  // ─── Personalised result state ───
  if (result) {
    const { vehicle, estimate } = result;
    const partnerClickref = `personalised-cost-${slug}`;
    const partnerHref = partnerConfig.buildLink
      ? partnerConfig.buildLink(vehicle.registrationNumber, partnerClickref)
      : partnerConfig.url;
    const isNotApplicable = estimate.range === "n/a";

    return (
      <div className="my-8 relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-900/25 via-slate-900/80 to-slate-950 p-6 sm:p-7">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-30 pointer-events-none bg-cyan-500/40" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <BoltMark className="h-3 w-3" />
              Personalised estimate for {vehicle.registrationNumber}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Try another reg
            </button>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white">
            {estimate.headline}
          </h3>

        {!isNotApplicable && (
          <div className="mt-4 relative overflow-hidden rounded-xl border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-[#04080f] to-slate-950 p-5">
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-[family-name:var(--font-geist-mono)]">
              Estimated cost
            </p>
            <p
              className="mt-1 font-[family-name:var(--font-geist-mono)] text-3xl sm:text-4xl font-bold text-cyan-100 tabular-nums tracking-tight"
              style={{ textShadow: "0 0 16px rgba(34,211,238,0.4), 0 0 3px rgba(165,243,252,0.6)" }}
            >
              {estimate.range}
            </p>
          </div>
        )}

        {isNotApplicable && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-700/40 bg-amber-950/30 p-4">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-100">
              This repair doesn&apos;t apply to your vehicle.
            </p>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
          {estimate.body}
        </p>

        {estimate.recommendation && (
          <div className="mt-4 rounded-lg border border-slate-700/60 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              What to ask the garage
            </p>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              {estimate.recommendation}
            </p>
          </div>
        )}

        {!isNotApplicable && (
          <>
            <div className="mt-5 border-t border-slate-800 pt-5">
              <p className="text-sm font-semibold text-white">
                Get real quotes for {vehicle.registrationNumber}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                BookMyGarage will use your reg to find local garages and show
                actual prices — no booking fee, no obligation.
              </p>
              <Button
                href={partnerHref}
                target="_blank"
                rel={partnerRel}
                onClick={() =>
                  trackPartnerClick(
                    partner,
                    `personalised-cost-${slug}`
                  )
                }
                className="mt-3"
              >
                Compare quotes for {vehicle.registrationNumber}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <p className="mt-2 text-[11px] text-slate-500">
                Free Plate Check earns a small commission from BookMyGarage at no cost to you.
              </p>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-800 flex flex-col items-center gap-2">
              <p className="text-xs text-slate-500">
                Want everything we know about this car?
              </p>
              <ScanBeamReveal
                vrm={vehicle.registrationNumber}
                destination="/"
                label={`Pull full report for ${vehicle.registrationNumber}`}
                subLabel="MOT, tax, valuation, recalls, more"
              />
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Or jump to{" "}
              <a
                href={`/?vrm=${vehicle.registrationNumber}`}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                See MOT history, tax status, recalls and more &rarr;
              </a>
            </p>
          </>
        )}
        </div>
      </div>
    );
  }

  // ─── Empty form state ───
  return (
    <div className="my-8 relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-900/15 via-slate-900/70 to-slate-950 p-6 sm:p-7">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-25 pointer-events-none bg-cyan-500/40" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 shadow-md shadow-cyan-500/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">
            Get a personalised {jobName} estimate
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Enter your reg and we&apos;ll pull your car&apos;s year, make and
            fuel type to give a price range based on{" "}
            <em>your</em> car — not just a generic UK average.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={reg}
              onChange={(e) => {
                setReg(e.target.value.toUpperCase());
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLookup();
              }}
              placeholder="e.g. AB12 CDE"
              maxLength={10}
              disabled={submitting}
              className="h-11 flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 font-[family-name:var(--font-geist-mono)] text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/40 disabled:opacity-60"
            />
            <Button
              type="button"
              onClick={handleLookup}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking&hellip;
                </>
              ) : (
                <>
                  <BoltMark className="h-4 w-4" />
                  Get my estimate
                </>
              )}
            </Button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            Free · No signup · Uses official DVLA data
          </p>
        </div>
      </div>
    </div>
  );
}
