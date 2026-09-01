"use client";

import { useMemo, useState } from "react";
import { MapPin, Calendar, ChevronRight } from "lucide-react";
import Button from "@/components/Button";
import {
  estimateGarageDensity,
  flexibilityLabel,
  formatPriceRange,
  priceRangeFor,
  resolveRegion,
  type FlexibilityChip,
  type ServiceType,
  type VehicleCategory,
} from "@/lib/booking";

interface Props {
  initialPostcode: string;
  initialDate: string;
  initialFlexibility: FlexibilityChip;
  service: ServiceType;
  category: VehicleCategory;
  onContinue: (postcode: string, date: string, flexibility: FlexibilityChip) => void;
  onBack: () => void;
  onSkipPostcode: (date: string, flexibility: FlexibilityChip) => void;
}

const CHIPS: FlexibilityChip[] = ["asap", "within_week", "within_two_weeks", "browsing"];

/**
 * Mid-sentence form of the service name. `serviceLabel` is title-cased for
 * standalone use ("Full service"), and lower-casing it wholesale would mangle
 * the acronym into "mot test".
 */
function servicePhrase(service: ServiceType): string {
  switch (service) {
    case "mot":
      return "MOT test";
    case "interim":
      return "interim service";
    case "full":
      return "full service";
    case "diagnostic":
      return "diagnostic check";
  }
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Step3Location({
  initialPostcode,
  initialDate,
  initialFlexibility,
  service,
  category,
  onContinue,
  onBack,
  onSkipPostcode,
}: Props) {
  const [postcode, setPostcode] = useState(initialPostcode);
  const [date, setDate] = useState(initialDate || todayPlus(3));
  const [flexibility, setFlexibility] = useState<FlexibilityChip>(initialFlexibility);

  const region = useMemo(() => resolveRegion(postcode), [postcode]);
  const garages = useMemo(() => estimateGarageDensity(postcode), [postcode]);
  const livePrice = useMemo(
    () => priceRangeFor(service, category, region),
    [service, category, region],
  );

  const postcodeValid = postcode.trim().length >= 2;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Your estimated {servicePhrase(service)} price
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Here&apos;s the typical range for your vehicle. Add a postcode to narrow it to
          your area — or carry straight on to live garage quotes.
        </p>
      </div>

      {/*
        The estimate is shown BEFORE anything is asked for.

        This step used to open with an empty postcode box and no price at all —
        the range only appeared once a valid postcode had been typed. Users
        arrived here having just clicked a button that said "Compare prices",
        and were met with a form instead of an answer. It showed in the funnel:
        of the sessions arriving from the results-page MOT CTA, 36 reached this
        step in 9 days and 5 went on to Step 4 — a 14% pass rate, against 94%
        for the same step reached from /cheap-mot, where the visitor had already
        decided they were shopping. Leading with the number keeps the promise
        the CTA made, and makes the postcode an upgrade rather than a toll.
      */}
      <div className="rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/30 to-slate-900/40 p-4">
        <p className="text-xs uppercase font-semibold tracking-wider text-slate-400">
          {postcodeValid ? `Typical near ${postcode}` : "Typical UK price"}
        </p>
        <p className="mt-1 font-mono text-2xl font-bold text-emerald-300 tabular-nums">
          {formatPriceRange(livePrice)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {postcodeValid ? (
            <>
              {region.label} &middot; ~{garages.label} BookMyGarage partner garages near you
            </>
          ) : (
            <>UK average &middot; add a postcode below for local pricing</>
          )}
        </p>
      </div>

      {/* Postcode */}
      <div>
        <label htmlFor="postcode" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Postcode <span className="font-normal normal-case tracking-normal text-slate-500">(optional)</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
          <input
            id="postcode"
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            placeholder="e.g. SW1A 1AA"
            maxLength={8}
            className="w-full h-12 rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-4 font-mono text-base tracking-wider text-white placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-sm focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
          />
        </div>
        {/* The live figure now lives in the panel above, which updates as this
            field is typed — repeating it here would say the same thing twice. */}
      </div>

      {/* Flexibility */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">How urgently?</p>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => {
            const selected = chip === flexibility;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setFlexibility(chip)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selected
                    ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20"
                    : "bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
              >
                {flexibilityLabel(chip)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred date */}
      {flexibility !== "browsing" && (
        <div>
          <label htmlFor="date" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Preferred date <span className="font-normal lowercase text-slate-500">(BMG confirms actual slots)</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={todayPlus(1)}
              max={todayPlus(60)}
              className="w-full h-12 rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-4 text-base text-white focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>
        </div>
      )}

      {/* Continue */}
      <div className="space-y-2">
        <Button
          type="button"
          onClick={() =>
            postcodeValid
              ? onContinue(postcode, date, flexibility)
              : onSkipPostcode(date, flexibility)
          }
          className="w-full"
        >
          Review &amp; compare prices
          <ChevronRight className="h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors underline underline-offset-2"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
