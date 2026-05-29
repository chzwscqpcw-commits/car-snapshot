/**
 * Site-wide reg display component (variant B — "Frosted glass" from the
 * preview gallery). Use this every place we render a UK plate number as
 * a label, badge or hero element so the look is consistent across:
 * - homepage results header
 * - homepage loading skeleton top card
 * - tool result pages (/mot-check, /tax-check, /ulez-check, etc.)
 * - any future surface that surfaces a chosen reg
 *
 * NOT for inputs — the entry-state reg input on the homepage uses a
 * darker, more conventional input look. Plate styling is for DISPLAY
 * only ("this is the vehicle you searched").
 */

interface Props {
  reg: string;
  /**
   * Size affects font, padding and the surrounding glow halo intensity.
   * - sm: inline label inside other UI (recent-vehicles list, tooltips)
   * - md: tool-page headers and skeleton top cards (default)
   * - lg: homepage hero result header where the plate is the focal point
   */
  size?: "sm" | "md" | "lg";
  /**
   * When true, an outer cyan glow is rendered. Default on for md/lg,
   * off for sm. Override when placing on a busy background.
   */
  glow?: boolean;
  className?: string;
}

export function RegPlate({ reg, size = "md", glow, className }: Props) {
  const formatted = reg.trim().toUpperCase() || "AB12 CDE";
  const showGlow = glow ?? (size !== "sm");

  const sizing = (() => {
    switch (size) {
      case "sm":
        return {
          padX: "px-3",
          padY: "py-1",
          text: "text-sm",
          tracking: "tracking-[0.14em]",
          radius: "rounded-md",
        };
      case "lg":
        return {
          padX: "px-6 sm:px-7",
          padY: "py-3.5 sm:py-4",
          text: "text-2xl sm:text-3xl",
          tracking: "tracking-[0.18em]",
          radius: "rounded-xl",
        };
      default:
        return {
          padX: "px-5",
          padY: "py-3",
          text: "text-xl sm:text-2xl",
          tracking: "tracking-[0.16em]",
          radius: "rounded-lg",
        };
    }
  })();

  return (
    <span className={`relative inline-flex ${className ?? ""}`}>
      {showGlow && (
        <span
          aria-hidden="true"
          className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 blur-2xl rounded-3xl pointer-events-none"
        />
      )}
      <span
        className={[
          "relative inline-flex items-center border border-cyan-500/40 bg-slate-900/60 backdrop-blur-xl shadow-lg",
          sizing.radius,
          sizing.padX,
          sizing.padY,
        ].join(" ")}
      >
        <span
          className={[
            "font-mono font-bold text-cyan-100 select-all whitespace-nowrap",
            sizing.text,
            sizing.tracking,
          ].join(" ")}
        >
          {formatted}
        </span>
      </span>
    </span>
  );
}
