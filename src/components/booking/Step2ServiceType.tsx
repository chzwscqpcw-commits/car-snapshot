"use client";

import { ShieldCheck, Wrench, Settings, Search, Sparkles, ChevronRight } from "lucide-react";
import {
  formatPriceRange,
  priceRangeFor,
  serviceMeta,
  type RecommendationContext,
  type ServiceType,
  type VehicleCategory,
  type RegionInfo,
} from "@/lib/booking";
import { recommendService } from "@/lib/booking";

interface Props {
  onSelect: (service: ServiceType) => void;
  onBack: () => void;
  category: VehicleCategory;
  region: RegionInfo;
  recommendationContext: RecommendationContext;
}

const SERVICE_CARDS: { id: ServiceType; title: string; oneLiner: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "mot", title: "MOT test", oneLiner: "Annual safety check (legal req.)", icon: ShieldCheck },
  { id: "interim", title: "Interim service", oneLiner: "6-month / 6,000-mile check", icon: Settings },
  { id: "full", title: "Full service", oneLiner: "12-month / 12,000-mile service", icon: Wrench },
  { id: "diagnostic", title: "Diagnostic check", oneLiner: "Warning lights & fault codes", icon: Search },
];

export default function Step2ServiceType({
  onSelect,
  onBack,
  category,
  region,
  recommendationContext,
}: Props) {
  const recommendation = recommendService(recommendationContext);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">What service?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Pick what your car needs. Prices shown are typical for your vehicle and area —
          BookMyGarage will quote exact garage prices on the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {SERVICE_CARDS.map((card) => {
          const isRecommended = card.id === recommendation.service;
          const meta = serviceMeta(card.id);
          const price = priceRangeFor(card.id, category, region);
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className={`group relative text-left rounded-xl border p-3 sm:p-5 transition-all hover:translate-y-[-1px] ${
                isRecommended
                  ? "border-cyan-500/50 bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-900 shadow-md shadow-cyan-500/10"
                  : "border-slate-800 bg-slate-900 hover:border-slate-700"
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-cyan-500/30">
                  <Sparkles className="h-3 w-3" />
                  Recommended
                </span>
              )}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${isRecommended ? "text-cyan-300" : "text-slate-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 sm:block">
                    <p className="text-sm sm:text-base font-semibold text-white truncate">{card.title}</p>
                    <p
                      className={`sm:hidden text-sm font-mono tabular-nums shrink-0 ${isRecommended ? "text-cyan-300" : "text-emerald-300"}`}
                    >
                      {formatPriceRange(price)}
                    </p>
                  </div>
                  <p className="hidden sm:block text-xs text-slate-400 mt-0.5">{card.oneLiner}</p>
                  <p className="hidden sm:block mt-2 text-sm font-mono tabular-nums">
                    <span className={isRecommended ? "text-cyan-300" : "text-emerald-300"}>
                      {formatPriceRange(price)}
                    </span>
                    <span className="text-slate-600 ml-2">· ~{meta.durationMins} min</span>
                  </p>
                  <p className="sm:hidden text-[11px] text-slate-500 mt-0.5 truncate">
                    {card.oneLiner}
                  </p>
                  {isRecommended && (
                    <p className="mt-1.5 sm:mt-2 text-[11px] text-cyan-200/80 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {recommendation.reason}
                    </p>
                  )}
                </div>
                <ChevronRight className="hidden sm:block h-4 w-4 text-slate-600 shrink-0 mt-1 group-hover:text-slate-400 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="text-xs text-slate-500 hover:text-slate-400 transition-colors underline underline-offset-2"
      >
        ← Back
      </button>
    </div>
  );
}
