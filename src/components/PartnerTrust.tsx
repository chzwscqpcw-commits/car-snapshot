import { Star } from "lucide-react";

/**
 * Point-of-action trust signal shown beside a partner CTA — the pattern proven
 * to lift affiliate click-through (site-audit Q2: partners like BookMyGarage and
 * ClickMechanic surface a rating right at the button). Facts only: BookMyGarage's
 * public Trustpilot rating, and carVertical's stated data-source coverage. Kept
 * as one component so the signal reads consistently across every placement.
 */
export default function PartnerTrust({
  partner,
  className = "",
}: {
  partner: "bookMyGarage" | "carVertical";
  className?: string;
}) {
  const label =
    partner === "bookMyGarage" ? (
      <>
        <span className="font-semibold text-slate-400">4.8/5</span> on Trustpilot · 9,000+ reviews
      </>
    ) : (
      <>Cross-checks 1,000+ data sources across 45+ countries</>
    );

  return (
    <p className={`flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span>{label}</span>
    </p>
  );
}
