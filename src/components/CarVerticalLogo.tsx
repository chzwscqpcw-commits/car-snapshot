import Image from "next/image";

/**
 * carVertical's official wordmark (white variant, for dark backgrounds) —
 * supplied by carVertical 2026-06-11. Used in the report/mileage CTAs. Usage is
 * governed by carVertical's Brand Asset Usage Rules (agreement clauses 1.3/3.8).
 */
export default function CarVerticalLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/carvertical/carvertical-logo-white.png"
      alt="carVertical"
      width={507}
      height={73}
      className={`h-4 w-auto ${className}`}
    />
  );
}
