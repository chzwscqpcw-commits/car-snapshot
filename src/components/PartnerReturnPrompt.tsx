"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Minus, Tag, X } from "lucide-react";
import {
  getCarVerticalClickStamp,
  clearCarVerticalClick,
  trackEvent,
} from "@/lib/tracking";
import { CARVERTICAL_PRICING, carVerticalDiscountedSingle } from "@/config/partners";

/**
 * Shown to a visitor who clicked through to carVertical and came back.
 *
 * Why it exists: of 154 people who clicked out (measured 2026-08-25), 84 came
 * back to us — median 72 seconds later, 42% inside a minute. They had seen the
 * £37.99 checkout and declined it. Half of them then looked up a DIFFERENT car;
 * not one re-searched the car they had just clicked about. So they haven't
 * stopped shopping, they've stopped shopping *that* car at that price.
 *
 * Until now we greeted them with the identical page they left, as though
 * nothing had happened. This says the quiet part instead: here is what you
 * already have for free, here is the short list of what the paid report adds,
 * and here is the code if you decide it's worth it. No second sell, no urgency
 * — they have already told us what they think of the price.
 *
 * Scope is the browser SESSION, not a timer. An earlier draft expired the
 * prompt after 20 minutes, which meant calling Date.now() during render — impure,
 * and correctly rejected by react-hooks/purity. sessionStorage already dies with
 * the tab, dismissing clears the stamp, and the prompt is only mounted on the two
 * valuation surfaces, so it cannot follow someone around the site.
 */

/** The stamp can't change while this is mounted — nothing to subscribe to. */
const NO_SUBSCRIBE = () => () => {};

const FREE_ALREADY = [
  "Full MOT history, advisories and defects",
  "Every recorded mileage reading",
  "Tax status, ULEZ and open recalls",
];
const PAID_ONLY = [
  "Outstanding finance",
  "Write-off category and damage records",
  "Stolen / cloned markers",
];

export default function PartnerReturnPrompt({
  context = "carvertical-return",
}: {
  /** click_context recorded on the events this prompt fires. */
  context?: string;
}) {
  const stamp = useSyncExternalStore(NO_SUBSCRIBE, getCarVerticalClickStamp, () => null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !stamp) return null;

  function dismiss() {
    setDismissed(true);
    clearCarVerticalClick();
    trackEvent("partner_return_dismissed", { partner_id: "carVertical", click_context: context });
  }

  return (
    <section className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-white sm:text-base">
          Had a look at the paid report?
        </h3>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
        It&apos;s £{CARVERTICAL_PRICING.single.toFixed(2)} a car
        ({carVerticalDiscountedSingle()} with our code), which isn&apos;t nothing. Worth
        knowing exactly what it buys you that this page doesn&apos;t already.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
            Already yours, free
          </p>
          <ul className="mt-2 space-y-1.5">
            {FREE_ALREADY.map((r) => (
              <li key={r} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Only in the paid report
          </p>
          <ul className="mt-2 space-y-1.5">
            {PAID_ONLY.map((r) => (
              <li key={r} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
        <Tag className="h-3 w-3 shrink-0" aria-hidden />
        Code
        <span className="font-mono font-bold tracking-wide text-emerald-200">freeplatecheck</span>
        keeps {CARVERTICAL_PRICING.discountPct}% off whenever you go back
      </p>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Checking several cars? Reports drop to £
        {CARVERTICAL_PRICING.packOf3PerReport.toFixed(2)} each in a three-pack — worth it
        if you&apos;re comparing a shortlist rather than one car.
      </p>
    </section>
  );
}
