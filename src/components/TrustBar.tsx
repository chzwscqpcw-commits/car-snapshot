import { Check } from "lucide-react";

/**
 * Site-wide trust strip — Free Plate Check's core wedge: free, no email, your
 * data isn't sold, official data. Deliberately restrained per the brand guide
 * (slate text, emerald "positive" ticks, one calm supporting line — not loud).
 * Placed under the homepage reg box, in the landing-page hero, and the footer.
 */
const TRUST_POINTS = [
  "100% free, always",
  "No email or signup",
  "We never sell your data",
  "Official DVLA & DVSA data",
];

export default function TrustBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-400 ${className}`}
    >
      {TRUST_POINTS.map((point) => (
        <span key={point} className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" strokeWidth={2.5} />
          {point}
        </span>
      ))}
    </div>
  );
}
