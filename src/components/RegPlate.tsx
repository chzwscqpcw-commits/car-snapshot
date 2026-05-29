/**
 * Site-wide reg display component. Two visual variants:
 *
 * - "pill" (default for sm size): compact yellow rounded pill, black
 *   bold text. Reads instantly as "this is a UK number plate" at a
 *   glance. Best for inline labels next to make/model, in lists,
 *   inside cards. Subtle enough not to dominate; distinctive enough
 *   not to be confused with any other badge.
 *
 * - "frosted" (default for md/lg size): cyan-tinted backdrop-blur
 *   plate with a soft glow halo. Used for hero moments where the reg
 *   is the focal point — the loading skeleton centerpiece, or any
 *   place we want the plate to BE the design rather than a label.
 *
 * Pick the variant explicitly when context calls for it (e.g. force
 * "pill" at lg size for a compact-but-prominent header, or "frosted"
 * at sm size in a darker card where yellow would clash).
 *
 * NOT for inputs — the reg input on the homepage and /compare uses
 * a darker, more conventional input look. Plate styling is for
 * DISPLAY only.
 */

interface Props {
  reg: string;
  size?: "sm" | "md" | "lg";
  variant?: "pill" | "frosted";
  className?: string;
}

export function RegPlate({ reg, size = "md", variant, className }: Props) {
  const formatted = reg.trim().toUpperCase() || "AB12 CDE";
  // Default variant follows size: sm → pill, md/lg → frosted. Override
  // with the prop when the surrounding context demands otherwise.
  const chosenVariant = variant ?? (size === "sm" ? "pill" : "frosted");

  if (chosenVariant === "pill") {
    return <PillPlate reg={formatted} size={size} className={className} />;
  }
  return <FrostedPlate reg={formatted} size={size} className={className} />;
}

function PillPlate({
  reg,
  size,
  className,
}: {
  reg: string;
  size: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizing = (() => {
    switch (size) {
      case "sm":
        return { padX: "px-3", padY: "py-1", text: "text-sm" };
      case "lg":
        return { padX: "px-5", padY: "py-2", text: "text-2xl" };
      default:
        return { padX: "px-4", padY: "py-1.5", text: "text-base" };
    }
  })();

  return (
    <span
      className={[
        "inline-flex items-center rounded-full bg-amber-400 shadow-inner",
        sizing.padX,
        sizing.padY,
        className ?? "",
      ].join(" ")}
    >
      <span
        className={[
          "font-mono font-bold tracking-wider text-slate-900 whitespace-nowrap select-all",
          sizing.text,
        ].join(" ")}
      >
        {reg}
      </span>
    </span>
  );
}

function FrostedPlate({
  reg,
  size,
  className,
}: {
  reg: string;
  size: "sm" | "md" | "lg";
  className?: string;
}) {
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

  const showGlow = size !== "sm";

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
          {reg}
        </span>
      </span>
    </span>
  );
}
