"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Monitor, Sun, Moon, Sparkles, Code2 } from "lucide-react";

type Theme = "dark" | "light";
type Size = "full" | "compact";
type Accent = "cyan" | "emerald" | "amber" | "violet";
type Style = "modern" | "plate";

const SITE_URL = "https://www.freeplatecheck.co.uk";

const ACCENT_SWATCH: Record<Accent, { from: string; to: string; label: string }> = {
  cyan: { from: "#22d3ee", to: "#3b82f6", label: "Cyan" },
  emerald: { from: "#10b981", to: "#06b6d4", label: "Emerald" },
  amber: { from: "#f59e0b", to: "#f97316", label: "Amber" },
  violet: { from: "#8b5cf6", to: "#ec4899", label: "Violet" },
};

export default function EmbedConfigurator() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [size, setSize] = useState<Size>("full");
  const [accent, setAccent] = useState<Accent>("cyan");
  const [style, setStyle] = useState<Style>("modern");
  const [copied, setCopied] = useState(false);

  const dataAttrs = useMemo(() => {
    const parts = [`data-theme="${theme}"`];
    if (size !== "full") parts.push(`data-size="${size}"`);
    if (accent !== "cyan") parts.push(`data-accent="${accent}"`);
    if (style !== "modern") parts.push(`data-style="${style}"`);
    return parts.join(" ");
  }, [theme, size, accent, style]);

  const embedCode = useMemo(
    () =>
      `<div id="fpc-widget"></div>
<script src="${SITE_URL}/widget.js" ${dataAttrs}></script>`,
    [dataAttrs]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* ── Controls ── */}
        <div className="space-y-4 order-2 lg:order-1">
          <Control label="Theme" icon={Moon}>
            <Segment
              value={theme}
              onChange={(v) => setTheme(v as Theme)}
              options={[
                { value: "dark", label: "Dark", icon: Moon },
                { value: "light", label: "Light", icon: Sun },
              ]}
            />
          </Control>

          <Control label="Size" icon={Monitor}>
            <Segment
              value={size}
              onChange={(v) => setSize(v as Size)}
              options={[
                { value: "full", label: "Full" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </Control>

          <Control label="Accent" icon={Sparkles}>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(ACCENT_SWATCH) as Accent[]).map((key) => {
                const s = ACCENT_SWATCH[key];
                const active = accent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAccent(key)}
                    aria-pressed={active}
                    className={`group relative flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                      active
                        ? "border-slate-500 bg-slate-800 text-white"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
                        boxShadow: active ? `0 0 0 2px ${s.from}40` : "none",
                      }}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Control>

          <Control label="Input style" icon={Code2}>
            <Segment
              value={style}
              onChange={(v) => setStyle(v as Style)}
              options={[
                { value: "modern", label: "Modern" },
                { value: "plate", label: "UK plate" },
              ]}
            />
            <p className="mt-1.5 text-[11px] text-slate-500">
              UK plate = the classic yellow border. Modern = cyan focus ring.
            </p>
          </Control>

          <div className="hidden lg:block pt-2">
            <p className="text-[11px] text-slate-500">
              All four attributes are optional — drop the data-* values you don&apos;t
              need and the widget falls back to safe defaults.
            </p>
          </div>
        </div>

        {/* ── Preview + Code ── */}
        <div className="space-y-4 order-1 lg:order-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Live preview
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-[family-name:var(--font-geist-mono)]">
                {size === "full" ? "≤420 px" : "≤340 px"}
              </span>
            </div>

            <PreviewFrame theme={theme} size={size} accent={accent} style={style} />
          </div>

          {/* Code snippet */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/40">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Paste into your HTML
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  copied
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                }`}
                aria-label="Copy embed code"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="px-4 py-3 text-xs sm:text-sm text-slate-300 font-[family-name:var(--font-geist-mono)] leading-relaxed overflow-x-auto whitespace-pre">
              <code>{embedCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Control({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Moon;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>
      {children}
    </div>
  );
}

function Segment({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string; icon?: typeof Moon }>;
}) {
  return (
    <div className="inline-flex w-full rounded-lg border border-slate-800 bg-slate-950/60 p-0.5">
      {options.map((opt) => {
        const active = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all ${
              active
                ? "bg-slate-800 text-cyan-300 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PreviewFrame({
  theme,
  size,
  accent,
  style,
}: {
  theme: Theme;
  size: Size;
  accent: Accent;
  style: Style;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Build the iframe content once we know the origin — this loads the *actual*
  // widget.js so the preview is byte-for-byte what an embedder will get.
  const srcDoc = useMemo(() => {
    if (!origin) return "";
    return `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html,body{margin:0;padding:0;background:transparent;}
  body{padding:24px 16px;display:flex;align-items:center;justify-content:center;min-height:100%;}
</style>
</head><body>
<div id="fpc-widget"></div>
<script src="${origin}/widget.js"
  data-theme="${theme}"
  data-size="${size}"
  data-accent="${accent}"
  data-style="${style}"></script>
</body></html>`;
  }, [origin, theme, size, accent, style]);

  return (
    <div
      className="relative px-4 sm:px-6"
      style={{
        background:
          theme === "dark"
            ? "radial-gradient(circle at 50% 0%, rgba(34,211,238,0.06), transparent 60%), repeating-linear-gradient(0deg, #020617 0, #020617 23px, #0a1326 23px, #0a1326 24px)"
            : "radial-gradient(circle at 50% 0%, rgba(34,211,238,0.04), transparent 60%), repeating-linear-gradient(0deg, #f8fafc 0, #f8fafc 23px, #e2e8f0 23px, #e2e8f0 24px)",
        minHeight: 280,
      }}
    >
      {origin ? (
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          title="Free Plate Check widget preview"
          sandbox="allow-scripts"
          style={{
            width: "100%",
            minHeight: size === "compact" ? 120 : 240,
            border: "none",
            background: "transparent",
            display: "block",
          }}
        />
      ) : (
        <div className="h-[240px] flex items-center justify-center text-xs text-slate-600">
          Loading preview…
        </div>
      )}
    </div>
  );
}
