"use client";

import { useState } from "react";
import PreviewGate from "@/components/preview/PreviewGate";
import SaveCarCard, { type SaveCardPreview } from "@/components/SaveCarCard";
import { ALERT_STEP_ARMS, type AlertStepArm } from "@/lib/alert-step";
import type { PushAvailability } from "@/lib/push-client";
import { EXPERIMENTS } from "@/lib/tracking";

/**
 * Step two of the save card ("Save this car and get alerts") in both arms of
 * save_alert_step_v1, side by side, in each state a visitor's browser can be
 * in. Fixture car and invented dates; "today" is fixed so the dates read the
 * same whenever this is opened. Nothing here saves, tracks, stores or asks
 * for a real permission: the buttons play out what would happen.
 */

// Placeholder plate in the same style as the homepage's example cars.
const CAR = { vrm: "AB19CDE", make: "FORD", model: "FOCUS", year: 2019 };
const TODAY = new Date("2026-11-15T10:00:00Z");

const DATES = {
  far: { label: "MOT months away", motExpiryDate: "2027-03-14", taxDueDate: "2027-04-01" },
  near: { label: "MOT in 20 days", motExpiryDate: "2026-12-05", taxDueDate: "2027-04-01" },
  tax: { label: "No MOT date (tax leads)", motExpiryDate: undefined, taxDueDate: "2026-12-01" },
  none: { label: "No dates known", motExpiryDate: undefined, taxDueDate: undefined },
} as const;
type DatesKey = keyof typeof DATES;

const STATES: { key: string; title: string; where: string; push: PushAvailability }[] = [
  {
    key: "ready",
    title: "This browser can notify",
    where: "Android, desktop Chrome / Edge / Firefox, and an iPhone that has Free Plate Check on its Home Screen.",
    push: { kind: "ready" },
  },
  {
    key: "email",
    title: "Email only",
    where: "Notifications blocked for the site, or a browser that can't do them.",
    push: { kind: "unsupported" },
  },
  {
    key: "ios",
    title: "iPhone, in Safari",
    where: "Most iPhone visitors: notifications need a Home Screen install first, so email is the way in. Save by email to see the “See how” link.",
    push: { kind: "ios-install" },
  },
];

const ARM_LABEL: Record<AlertStepArm, string> = { control: "Control (today's step)", dated: "Variant (this car's date, one ask)" };

export default function SaveCardPreviewPage() {
  return (
    <PreviewGate>
      <Preview />
    </PreviewGate>
  );
}

function Preview() {
  const [card, setCard] = useState<"alerts" | "value">("alerts");
  const [dates, setDates] = useState<DatesKey>("far");
  const [permission, setPermission] = useState<"granted" | "refused">("granted");
  const [remembered, setRemembered] = useState(false);
  const [run, setRun] = useState(0);
  const d = DATES[dates];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl font-semibold text-white">Save card, step two: both arms</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Every card below starts where a visitor lands after tapping Save. The buttons work, but nothing is saved, sent or
          tracked, and no real permission prompt appears: the &ldquo;prompt answers&rdquo; switch decides how the pretend one
          replies. The car and its dates are made up, and today is fixed at 15 November 2026.
        </p>

        <div className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 sm:p-5">
          <Switch label="Card" value={card} onChange={setCard} options={[["alerts", "Alerts (results page)"], ["value", "Value (both valuation pages)"]]} />
          <Switch
            label="This car's dates"
            value={dates}
            onChange={setDates}
            options={(Object.keys(DATES) as DatesKey[]).map((k) => [k, DATES[k].label])}
          />
          <Switch label="The permission prompt answers" value={permission} onChange={setPermission} options={[["granted", "Allow"], ["refused", "Block"]]} />
          <Switch label="Email from an earlier save" value={remembered ? "yes" : "no"} onChange={(v) => setRemembered(v === "yes")} options={[["no", "None"], ["yes", "Remembered"]]} />
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="h-9 w-fit rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          >
            Start every card again
          </button>
        </div>

        {STATES.map((state) => (
          <section key={state.key} className="mt-10">
            <h2 className="text-base font-semibold text-white">{state.title}</h2>
            <p className="mt-1 text-xs text-slate-500">{state.where}</p>
            <div className="mt-4 grid items-start gap-5 md:grid-cols-2">
              {ALERT_STEP_ARMS.map((arm) => {
                const preview: SaveCardPreview = {
                  arm,
                  push: state.push,
                  permission,
                  email: remembered ? "jo@example.com" : undefined,
                  now: TODAY,
                };
                return (
                  <div key={arm} data-preview-card={`${state.key}-${arm}`}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">{ARM_LABEL[arm]}</p>
                    <SaveCarCard
                      key={`${card}-${dates}-${permission}-${remembered}-${run}`}
                      surface={card === "value" ? "valuation-result" : "results"}
                      variant={card}
                      vrm={CAR.vrm}
                      make={CAR.make}
                      model={CAR.model}
                      year={CAR.year}
                      motExpiryDate={d.motExpiryDate}
                      taxDueDate={d.taxDueDate}
                      preview={preview}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <DeviceArm />
      </div>
    </main>
  );
}

function Switch<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: (readonly [T, string])[];
}) {
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              value === key ? "border-cyan-400 bg-cyan-950 text-cyan-200" : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:text-white"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Which arm THIS device gets on the real pages, with a way to pin it, so
 * one phone can do a real save in each arm. The bucket is the framework's
 * own sticky key (experiment_<id> in localStorage).
 */
function DeviceArm() {
  const key = `experiment_${EXPERIMENTS.SAVE_ALERT_STEP}`;
  const [arm, setArm] = useState<string | null>(() => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  });
  const pin = (next: AlertStepArm | null) => {
    try {
      if (next) localStorage.setItem(key, next);
      else localStorage.removeItem(key);
      // A fresh arm is a fresh session as far as the test is concerned.
      sessionStorage.removeItem(`${key}_exposed`);
    } catch {
      // Storage blocked: nothing to pin.
    }
    setArm(next);
  };

  return (
    <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-base font-semibold text-white">This device on the real pages</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
        Visitors are split at random and keep their arm. This device is{" "}
        <span className="font-medium text-white">
          {arm === "control" || arm === "dated" ? `in the ${arm === "dated" ? "variant" : "control"} arm` : "not in an arm yet (it gets one the first time a save card loads)"}
        </span>
        . Pin one, then look up a car and save it to see that arm for real.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ALERT_STEP_ARMS.map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={arm === a}
            onClick={() => pin(a)}
            className={`h-9 rounded-lg border px-4 text-sm font-medium transition-colors ${
              arm === a ? "border-cyan-400 bg-cyan-950 text-cyan-200" : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            Use {a === "dated" ? "the variant" : "the control"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => pin(null)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
        >
          Forget it
        </button>
      </div>
    </section>
  );
}
