"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Wrench } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";

interface RepairCostCTAProps {
  /** What the user is reading about — used in CTA copy */
  jobName: string;
  /** Which BMG destination this CTA points to */
  partner?: "bookMyGarage" | "bookMyGarageService" | "bookMyGarageRepair";
  /** Hide the reg-lookup widget and only show the BMG link (use on narrow contexts) */
  hideRegLookup?: boolean;
}

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function isValidReg(reg: string): boolean {
  const cleaned = cleanReg(reg);
  return cleaned.length >= 2 && cleaned.length <= 8;
}

/**
 * Combined reg-lookup + BMG affiliate CTA for repair-cost guide pages.
 *
 * The reg lookup is our differentiator vs. competitor cost guides — it routes
 * to the main results page where the user sees their actual car's details,
 * which then drives them back through the reminder/booking funnel.
 */
export default function RepairCostCTA({
  jobName,
  partner = "bookMyGarageRepair",
  hideRegLookup = false,
}: RepairCostCTAProps) {
  const router = useRouter();
  const [reg, setReg] = useState("");
  const [regError, setRegError] = useState("");

  const partnerConfig = PARTNER_LINKS[partner];
  const clickref = `repair-cost-cta-${jobName.replace(/\s+/g, "-").toLowerCase()}`;
  const partnerHref = partnerConfig.buildLink
    ? cleanReg(reg)
      ? partnerConfig.buildLink(cleanReg(reg), clickref)
      : partnerConfig.url
    : partnerConfig.url;
  const partnerRel = getPartnerRel(partnerConfig);

  function handleLookup() {
    const cleaned = cleanReg(reg);
    if (!cleaned) {
      setRegError("Please enter a registration number");
      return;
    }
    if (!isValidReg(reg)) {
      setRegError("That doesn’t look like a valid UK registration");
      return;
    }
    setRegError("");
    router.push(`/?vrm=${cleaned}`);
  }

  return (
    <div className="my-8 rounded-xl border border-blue-800/40 bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-900/60 p-6 sm:p-7">
      {/* Reg lookup — our unique angle */}
      {!hideRegLookup && (
        <>
          <div className="flex items-start gap-3">
            <Search className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-white">
                Get a personalised {jobName} estimate
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Enter your reg — we&apos;ll pull your year, model and mileage so
                you can refine the price range to your specific car before
                contacting a garage.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={reg}
                  onChange={(e) => {
                    setReg(e.target.value.toUpperCase());
                    setRegError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLookup();
                  }}
                  placeholder="e.g. AB12 CDE"
                  maxLength={10}
                  className="h-11 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 font-mono text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleLookup}
                  className="h-11 whitespace-nowrap rounded-lg bg-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                >
                  Check my car
                </button>
              </div>

              {regError && (
                <p className="mt-2 text-xs text-red-400">{regError}</p>
              )}

              <p className="mt-2 text-xs text-slate-500">
                Free · No signup · Full vehicle details in seconds
              </p>
            </div>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            <span className="font-medium">OR</span>
            <span className="h-px flex-1 bg-slate-800" />
          </div>
        </>
      )}

      {/* BMG CTA */}
      <div className="flex items-start gap-3">
        <Wrench className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">
            Get real quotes for {jobName} near you
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Compare prices from local garages in seconds — no booking fee, no
            obligation.
          </p>

          <a
            href={partnerHref}
            target="_blank"
            rel={partnerRel}
            onClick={() => trackPartnerClick(partner, `repair-cost-cta-${jobName.replace(/\s+/g, "-").toLowerCase()}`)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-cyan-500/20"
          >
            Compare quotes &mdash; BookMyGarage
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
          </a>

          <p className="mt-2 text-xs text-slate-500">
            Free comparison · Free Plate Check earns a small commission, at no
            cost to you.
          </p>
        </div>
      </div>
    </div>
  );
}
