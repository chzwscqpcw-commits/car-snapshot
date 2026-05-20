/**
 * Color-coded category pill for blog posts. Tag → tone mapping makes
 * the category scannable at a glance — Tax always amber, ULEZ always
 * cyan, Recalls always rose, etc. Used on the index and inside posts.
 */
type Tone = { border: string; bg: string; text: string };

const TAG_TONES: Record<string, Tone> = {
  mot: { bg: "bg-blue-900/40", border: "border-blue-700/50", text: "text-blue-200" },
  tax: { bg: "bg-amber-900/40", border: "border-amber-700/50", text: "text-amber-200" },
  mileage: { bg: "bg-slate-800/80", border: "border-slate-600/60", text: "text-slate-200" },
  buying: { bg: "bg-emerald-900/40", border: "border-emerald-700/50", text: "text-emerald-200" },
  ulez: { bg: "bg-cyan-900/40", border: "border-cyan-700/50", text: "text-cyan-200" },
  recalls: { bg: "bg-rose-900/40", border: "border-rose-700/50", text: "text-rose-200" },
  valuation: { bg: "bg-purple-900/40", border: "border-purple-700/50", text: "text-purple-200" },
};

const DEFAULT_TONE: Tone = {
  bg: "bg-slate-800/80",
  border: "border-slate-600/60",
  text: "text-slate-300",
};

export default function BlogTagPill({
  tag,
  label,
  size = "sm",
}: {
  tag: string;
  label: string;
  size?: "xs" | "sm";
}) {
  const tone = TAG_TONES[tag] ?? DEFAULT_TONE;
  const sizing =
    size === "xs"
      ? "text-[10px] px-2 py-0.5"
      : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizing} ${tone.bg} ${tone.border} ${tone.text}`}
    >
      {label}
    </span>
  );
}
