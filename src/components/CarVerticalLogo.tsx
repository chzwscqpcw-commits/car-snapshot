/**
 * Text wordmark approximation of the carVertical logo, used in the dormant
 * report CTA + the mock-up. On go-live, swap for carVertical's OFFICIAL logo
 * asset from their affiliate dashboard — their brand guidelines (agreement
 * clauses 1.3 / 3.8) govern real trademark usage.
 */
export default function CarVerticalLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-extrabold tracking-tight text-[#1b54ff] ${className}`}
      aria-label="carVertical"
    >
      carVertical
    </span>
  );
}
