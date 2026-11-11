"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { CloudOff, Pencil } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { cleanTypedModel, modelOptionsForMake } from "@/lib/model-options";

/**
 * Shown with a valuation when the MOT service did not answer.
 *
 * MOT history is where two of the valuation's inputs come from: the car's
 * model (DVLA returns the make only) and its last recorded mileage. On
 * 8–9 Nov 2026 the service failed for 21.5 hours, the model went missing,
 * and the valuation silently disappeared from both valuation surfaces while
 * the selling offers beneath it stayed. This is the explanation that was
 * missing, and the way through: say what is unavailable, ask for the model
 * if we have never seen the car, and value it on typical mileage for its age
 * with the confidence shown one step lower until the visitor sets their own.
 *
 * Used by the valuation tool (ValuationResult) and the homepage's own inline
 * valuation, so the wording and the model list cannot drift apart.
 */

const NOT_LISTED = "__not_listed__";

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bBmw\b/, "BMW")
    .replace(/\bMg\b/, "MG")
    .replace(/\bKgm\b/, "KGM")
    .replace(/\bDs\b/, "DS")
    .replace(/\bByd\b/, "BYD");
}

export interface MotOutageNoticeProps {
  /** Where this is shown, for the event that counts how often it was needed. */
  surface: "valuation-tool" | "home-valuation";
  make?: string;
  /** The model in use, wherever it came from. Empty until one is chosen. */
  model?: string;
  /** True when the model was picked here rather than read from our records. */
  modelFromVisitor: boolean;
  onPickModel: (model: string | null) => void;
  /**
   * Mileage control, for a surface with no mileage panel of its own (the
   * homepage). `estimate` is the typical figure for the car's age; `value` is
   * what the visitor entered, or null while the estimate stands.
   */
  mileage?: { estimate: number | null; value: number | null; onChange: (miles: number | null) => void };
  /** The typical-mileage figure in use, for the sentence that explains it. */
  assumedMileage?: number | null;
  /** True once the visitor has entered their own mileage. */
  mileageSet?: boolean;
  /** Preview-only simulation: say so, and offer the way out. */
  simulated?: boolean;
  className?: string;
}

export default function MotOutageNotice({
  surface,
  make,
  model,
  modelFromVisitor,
  onPickModel,
  mileage,
  assumedMileage,
  mileageSet = false,
  simulated = false,
  className = "",
}: MotOutageNoticeProps) {
  const options = useMemo(() => modelOptionsForMake(make), [make]);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const selectId = useId();
  const typedId = useId();
  const mileageId = useId();
  const needsModel = !model;
  const makeLabel = make ? titleCase(make) : "car";

  useEffect(() => {
    trackEvent("mot_outage_notice", { surface, model_known: !needsModel });
    // Once per mount: this counts sessions that met the outage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(value: string | null, how: "list" | "typed") {
    if (value) trackEvent("mot_outage_model_pick", { surface, how });
    setTyping(false);
    setTyped("");
    onPickModel(value);
  }

  const showTyped = needsModel && (typing || options.length === 0);
  const estimate = mileage?.estimate ?? assumedMileage ?? null;

  return (
    <section
      data-mot-outage-notice
      aria-label="MOT history temporarily unavailable"
      className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-950 p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
          <CloudOff className="h-4 w-4 text-amber-300" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-amber-100">MOT history is temporarily unavailable</h3>

          {needsModel ? (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
              DVSA&apos;s MOT service isn&apos;t answering at the moment. That is where we read a car&apos;s exact model
              and its last recorded mileage, so tell us which {makeLabel} this is and we&apos;ll value it on typical
              mileage for its age.
            </p>
          ) : mileageSet ? (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
              DVSA&apos;s MOT service isn&apos;t answering at the moment, so we couldn&apos;t read this car&apos;s last
              recorded mileage. This valuation uses the mileage you entered.
            </p>
          ) : (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
              DVSA&apos;s MOT service isn&apos;t answering at the moment, so we couldn&apos;t read this car&apos;s last
              recorded mileage. This valuation assumes typical mileage for its age
              {estimate ? (
                <>
                  , about <strong className="font-semibold text-slate-100">{estimate.toLocaleString("en-GB")} miles</strong>
                </>
              ) : null}
              , and is shown with lower confidence until you set your own.
            </p>
          )}

          {needsModel && options.length > 0 && !typing && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor={selectId} className="text-xs font-medium text-slate-300">
                Which {makeLabel}?
              </label>
              <select
                id={selectId}
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === NOT_LISTED) setTyping(true);
                  else if (v) pick(v, "list");
                }}
                className="min-w-[11rem] rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
              >
                <option value="" disabled>
                  Choose the model
                </option>
                {options.map((m) => (
                  <option key={m} value={m}>
                    {titleCase(m)}
                  </option>
                ))}
                <option value={NOT_LISTED}>Not listed — type it</option>
              </select>
            </div>
          )}

          {showTyped && (
            <form
              className="mt-3 flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const cleaned = cleanTypedModel(typed);
                if (cleaned) pick(cleaned, "typed");
              }}
            >
              <label htmlFor={typedId} className="text-xs font-medium text-slate-300">
                Which {makeLabel}?
              </label>
              <input
                id={typedId}
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="e.g. Focus"
                autoComplete="off"
                maxLength={40}
                className="w-40 rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!cleanTypedModel(typed)}
                className="rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-2 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Value it
              </button>
              {options.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTyping(false)}
                  className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200"
                >
                  Back to the list
                </button>
              )}
            </form>
          )}

          {!needsModel && modelFromVisitor && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
              <span>
                Valuing it as a{" "}
                <strong className="font-semibold text-slate-200">
                  {makeLabel} {titleCase(model!)}
                </strong>
                , as you told us.
              </span>
              <button
                type="button"
                onClick={() => pick(null, "list")}
                className="inline-flex items-center gap-1 text-amber-200 underline underline-offset-2 hover:text-amber-100"
              >
                <Pencil className="h-3 w-3" aria-hidden />
                Change
              </button>
            </p>
          )}

          {!needsModel && mileage && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor={mileageId} className="text-xs font-medium text-slate-300">
                Your mileage
              </label>
              <input
                id={mileageId}
                type="text"
                inputMode="numeric"
                value={mileage.value == null ? "" : String(mileage.value)}
                placeholder={mileage.estimate ? mileage.estimate.toLocaleString("en-GB") : "e.g. 60,000"}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, "");
                  mileage.onChange(digits === "" ? null : Math.min(parseInt(digits, 10), 500000));
                }}
                aria-label="Enter this car's mileage"
                className="w-32 rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm tabular-nums text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
              <span className="text-xs text-slate-400">miles</span>
            </div>
          )}

          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Tax, age, fuel and emissions come from DVLA and are unaffected. Search again later for the full MOT
            history.
          </p>

          {simulated && (
            <p className="mt-2 text-[11px] text-amber-200/80">
              Preview only: this outage is simulated.{" "}
              <a href="/api/preview/mot-outage?state=off" className="underline underline-offset-2 hover:text-amber-100">
                Turn it off
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
