"use client";

import { useEffect, useRef, useState } from "react";
import {
  classifyPostcode,
  estimateGarageDensity,
  priceRangeFor,
  resolveRegion,
  type PriceRange,
  type ServiceType,
  type VehicleCategory,
} from "@/lib/booking";

interface Props {
  /** Raw postcode as typed. The panel only appears once it's a full one. */
  postcode: string;
  service: ServiceType;
  category: VehicleCategory;
}

/**
 * The coverage panel: what your postcode just bought you.
 *
 * The point of this is NOT the circle. It's that the answer visibly improves —
 * a national guess becomes a local one in front of you. The estimate was
 * already on screen before the postcode was typed (leading with the price is
 * what fixed Step 3), so this has to read as a *reward* for adding detail,
 * never as the thing that unlocked it.
 *
 * ── The one hard rule ──────────────────────────────────────────────────────
 * Never draw a garage we cannot name. We hold no garage locations and no
 * per-garage prices; BookMyGarage does. A pin is a claim that a specific
 * business sits at a specific place, and ours would be invented. So the
 * drawing is deliberately abstract — rings, shading, a count, a district. That
 * constraint is also why it costs nothing: no map library, no tile provider,
 * no per-render bill, and nothing to be wrong about.
 */

/** Tween a number on rAF. Instant for reduced-motion and for the first paint. */
function useTweened(target: number, durationMs = 650): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Still deferred to a frame rather than set synchronously here — a
      // synchronous setState in an effect body cascades renders, and the
      // one-frame delay is imperceptible even to someone who asked for no
      // motion at all.
      fromRef.current = target;
      rafRef.current = requestAnimationFrame(() => setValue(target));
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }

    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic — quick to commit, settles gently.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, durationMs]);

  return value;
}

function money(n: number): string {
  return n % 1 === 0 ? `£${Math.round(n)}` : `£${n.toFixed(2)}`;
}

interface Place {
  /** The postcode this answer belongs to. Lets us derive staleness in render
      instead of resetting state from an effect. */
  key: string;
  valid: boolean | null;
  district: string | null;
}

const UNKNOWN: Place = { key: "", valid: null, district: null };

export default function CoverageRing({ postcode, service, category }: Props) {
  const pc = classifyPostcode(postcode);
  const [resolved, setResolved] = useState<Place>(UNKNOWN);
  // An answer for a different postcode is not an answer for this one.
  const place = resolved.key === pc.normalised ? resolved : UNKNOWN;

  // Resolve the district once the postcode is complete. Deliberately keyed on
  // the normalised value, so it fires once per real postcode rather than once
  // per keystroke, and never at all for a fragment.
  useEffect(() => {
    if (!pc.usable) return;
    let cancelled = false;
    const key = pc.normalised;
    fetch(`/api/postcode?pc=${encodeURIComponent(pc.normalised)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        setResolved({ key, valid: body.valid ?? null, district: body.district ?? null });
      })
      .catch(() => {
        // Fails open — the panel still has the region and the price locally.
      });
    return () => {
      cancelled = true;
    };
  }, [pc.usable, pc.normalised]);

  const region = resolveRegion(pc.usable ? pc.normalised : "");
  const garages = estimateGarageDensity(pc.usable ? pc.normalised : "");
  const national: PriceRange = priceRangeFor(service, category, resolveRegion(""));
  const local: PriceRange = priceRangeFor(service, category, region);

  // The numbers travel from the national range to the local one. Before a
  // postcode exists both are the same, so nothing moves and nothing flashes.
  const min = useTweened(pc.usable ? local.min : national.min);
  const max = useTweened(pc.usable ? local.max : national.max);

  if (!pc.usable) return null;

  // Ring geometry. Two rings, 5 and 10 miles, on a 300-unit canvas.
  const R_OUTER = 124;
  const R_INNER = 70;
  const circumference = 2 * Math.PI * R_OUTER;

  const knownBad = place.valid === false;
  const outcode = pc.normalised.split(" ")[0];

  return (
    <div className="mt-3 rounded-xl border border-cyan-900/40 bg-slate-950/40 p-3 sm:mt-4 sm:p-4">
      {knownBad ? (
        <p className="text-xs leading-relaxed text-amber-300/90">
          We can&apos;t find <span className="font-mono">{pc.normalised}</span> in the Royal Mail
          database. Double-check it — BookMyGarage won&apos;t be able to search on it either.
          You can continue without one and they&apos;ll ask.
        </p>
      ) : (
        <div className="flex items-center gap-4 sm:gap-6">
          <svg
            viewBox="0 0 300 300"
            className="h-20 w-20 shrink-0 sm:h-40 sm:w-40"
            role="img"
            aria-label={`Coverage rings at five and ten miles around ${pc.normalised}. Around ${garages.label} partner garages within ten miles.`}
          >
            <defs>
              <radialGradient id="fpc-coverage" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.28" />
                <stop offset="55%" stopColor="#22D3EE" stopOpacity="0.11" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.02" />
              </radialGradient>
            </defs>

            <circle cx="150" cy="150" r={R_OUTER} fill="url(#fpc-coverage)" />

            {/* The outer ring strokes itself on. Starts fully drawn for
                reduced-motion users via the CSS below. */}
            <circle
              cx="150"
              cy="150"
              r={R_OUTER}
              fill="none"
              stroke="#22D3EE"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              strokeDasharray={`${circumference}`}
              strokeDashoffset="0"
              className="fpc-ring"
              style={{ ["--fpc-circ" as string]: `${circumference}` }}
            />
            <circle
              cx="150"
              cy="150"
              r={R_INNER}
              fill="none"
              stroke="#22D3EE"
              strokeOpacity="0.7"
              strokeWidth="1.5"
            />
            {/* Labels and plate are desktop-only. Rendered at 80px on a phone
                they'd be four-pixel text — and both facts are already in the
                copy beside the ring ("Typical near GU2 4JT", "within 10
                miles"), so nothing is lost by dropping them. What survives is
                the geometry, which still reads as "an area around you". */}
            <g className="hidden sm:block">
              <line x1="150" y1="150" x2="150" y2="26" stroke="#22D3EE" strokeOpacity="0.22" strokeWidth="1" />
              <text x="158" y="94" fill="#94A3B8" fontSize="11" fontFamily="inherit">5 mi</text>
              <text x="158" y="42" fill="#94A3B8" fontSize="11" fontFamily="inherit">10 mi</text>
              <rect x="112" y="137" width="76" height="27" rx="4" fill="#FFD400" stroke="#020617" strokeWidth="1.5" />
              <text
                x="150"
                y="156"
                fill="#101317"
                fontSize="15"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="inherit"
              >
                {outcode}
              </text>
            </g>
            {/* A small plate dot keeps the centre anchored on mobile. */}
            <circle cx="150" cy="150" r="14" className="sm:hidden" fill="#FFD400" stroke="#020617" strokeWidth="2" />
          </svg>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Typical near {pc.normalised}
              </p>
              <p className="font-mono text-xl font-bold tabular-nums text-emerald-300 sm:text-2xl">
                {money(min)} – {money(max)}
              </p>
              {/* Neutral wording on purpose. A regional multiplier SCALES the
                  range — in the South-East and London it raises it — so the
                  local figure is frequently higher than the national one.
                  Saying "narrowed from" while the number goes up is a lie the
                  reader can check in the same glance. */}
              {(local.min !== national.min || local.max !== national.max) && (
                <p className="text-xs text-slate-500">
                  UK-wide {money(national.min)} – {money(national.max)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Within 10 miles
                </p>
                <p className="text-sm font-semibold text-slate-100">
                  {garages.label} partner garages
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Area</p>
                <p className="text-sm font-semibold text-slate-100">
                  {place.district ?? region.label}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fpc-ring { animation: fpc-ring-draw 900ms ease-out both; }
        @keyframes fpc-ring-draw {
          from { stroke-dashoffset: var(--fpc-circ); }
          to   { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fpc-ring { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
