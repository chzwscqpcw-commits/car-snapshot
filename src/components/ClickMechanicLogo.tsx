import { Wrench } from "lucide-react";

// ClickMechanic logo recreated from their brand mark: a location pin containing a
// wrench (the "mechanic who comes to you" idea), in their exact brand blue
// #009dff, beside the "ClickMechanic" wordmark. Sized in `em` so it scales with
// the surrounding font-size. For launch, swap the recreated mark for CM's
// official SVG (Scott offered creative) — this is a faithful stand-in.
const CM_BLUE = "#009dff";

export default function ClickMechanicLogo({
  className = "",
  withMark = true,
}: {
  className?: string;
  withMark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-[0.3em] font-extrabold tracking-tight ${className}`}>
      {withMark && (
        <span className="relative inline-block align-middle" style={{ width: "0.82em", height: "1.02em" }}>
          <svg viewBox="0 0 24 30" className="h-full w-full" aria-hidden>
            <path
              d="M12 0C5.373 0 0 5.373 0 12c0 7.6 9.4 16.2 11.36 17.9a1 1 0 0 0 1.28 0C14.6 28.2 24 19.6 24 12 24 5.373 18.627 0 12 0Z"
              fill={CM_BLUE}
            />
          </svg>
          <Wrench
            className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 -rotate-45 text-white"
            style={{ width: "0.44em", height: "0.44em" }}
            strokeWidth={2.75}
            aria-hidden
          />
        </span>
      )}
      <span className="text-current">ClickMechanic</span>
    </span>
  );
}
