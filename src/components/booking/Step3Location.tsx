"use client";

import { useMemo, useState } from "react";
import { MapPin, Calendar, ChevronRight } from "lucide-react";
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
        <h2 className="text-xl sm:text-2xl font-bold text-white">Where &amp; when?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Postcode lets us show local price ranges. Skip it if you&apos;d rather BookMyGarage
          asks — same result.
        </p>
      </div>

      {/* Postcode */}
      <div>
        <label htmlFor="postcode" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Postcode
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
        {postcodeValid && (
          <div className="mt-2 rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Typical price for your vehicle near{" "}
              <span className="font-mono text-cyan-300">{postcode}</span> ({region.label}):{" "}
              <span className="font-mono font-semibold text-emerald-300">{formatPriceRange(livePrice)}</span>
            </p>
            <p className="mt-1 text-slate-500">
              ~{garages.label} BookMyGarage partner garages in your area
            </p>
          </div>
        )}
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
        <button
          type="button"
          onClick={() =>
            postcodeValid
              ? onContinue(postcode, date, flexibility)
              : onSkipPostcode(date, flexibility)
          }
          className="w-full flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-md shadow-cyan-500/20 transition-all hover:from-blue-600 hover:to-cyan-600"
        >
          Review &amp; compare prices
          <ChevronRight className="h-4 w-4" />
        </button>
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
