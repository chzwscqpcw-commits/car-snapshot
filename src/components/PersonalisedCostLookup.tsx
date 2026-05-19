"use client";

import { useState } from "react";
import { Search, Wrench, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";
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
    const partnerHref = partnerConfig.buildLink
      ? partnerConfig.buildLink(vehicle.registrationNumber)
      : partnerConfig.url;
    const isNotApplicable = estimate.range === "n/a";

    return (
      <div className="my-8 rounded-xl border border-blue-700/40 bg-gradient-to-br from-blue-950/40 via-slate-900/70 to-slate-900/70 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-700/40 bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-300">
            <CheckCircle2 className="h-3 w-3" />
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
          <div className="mt-4 rounded-lg border border-emerald-700/40 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Estimated cost for your car
            </p>
            <p className="mt-1 text-3xl font-bold text-emerald-400">
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
              <a
                href={partnerHref}
                target="_blank"
                rel={partnerRel}
                onClick={() =>
                  trackPartnerClick(
                    partner,
                    `personalised-cost-${slug}`
                  )
                }
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-cyan-500/20"
              >
                Compare quotes for {vehicle.registrationNumber}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
              </a>
              <p className="mt-2 text-[11px] text-slate-500">
                Free Plate Check earns a small commission from BookMyGarage at no cost to you.
              </p>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Want the full picture for this car?{" "}
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
    );
  }

  // ─── Empty form state ───
  return (
    <div className="my-8 rounded-xl border border-blue-800/40 bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-900/60 p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <Search className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
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
              className="h-11 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 font-mono text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={submitting}
              className="h-11 whitespace-nowrap rounded-lg bg-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking&hellip;
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" />
                  Get my estimate
                </>
              )}
            </button>
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
