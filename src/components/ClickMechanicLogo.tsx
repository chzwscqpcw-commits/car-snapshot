// Placeholder ClickMechanic wordmark for the mock-ups. Swap for ClickMechanic's
// official logo asset (Scott offered creative) before anything goes live. The
// "CM blue" accent below is a placeholder echoing their site's blue — replace
// with their exact brand colour on launch.
export default function ClickMechanicLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className="text-[#0a9cd8]">Click</span>
      <span className="text-slate-200">Mechanic</span>
    </span>
  );
}
