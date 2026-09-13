"use client";

import { useEffect, useRef, useState } from "react";
import BookingProgress from "./BookingProgress";
import Step1Vehicle from "./Step1Vehicle";
import Step2ServiceType from "./Step2ServiceType";
import Step3Location from "./Step3Location";
import Step4Review from "./Step4Review";
import {
  categoriseVehicle,
  resolveRegion,
  type FlexibilityChip,
  type ServiceType,
  type VehicleBasics,
  type VehicleCategory,
} from "@/lib/booking";
import type { LookupVehicle } from "@/components/tools/shared";
import { trackEvent } from "@/lib/tracking";

type Step = 1 | 2 | 3 | 4;

interface State {
  step: Step;
  vrm: string;
  vehicle: LookupVehicle | null;
  service: ServiceType | null;
  postcode: string;
  date: string;
  flexibility: FlexibilityChip;
}

const STORAGE_KEY = "fpc_booking_v1";
const ALLOWED_TYPES: ServiceType[] = ["mot", "interim", "full", "diagnostic"];

function loadFromStorage(): Partial<State> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<State>;
  } catch {
    return null;
  }
}

function saveToStorage(state: State): void {
  if (typeof window === "undefined") return;
  try {
    // Don't persist the full vehicle object — it's heavy and we can re-fetch
    // from /api/lookup using the vrm. Saves us roundtripping the whole DVLA
    // payload through sessionStorage.
    const { vehicle: _vehicle, ...slim } = state;
    void _vehicle;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch {
    // Storage full / disabled — non-fatal
  }
}

function isServiceType(s: unknown): s is ServiceType {
  return typeof s === "string" && ALLOWED_TYPES.includes(s as ServiceType);
}

/**
 * Strip the identifying parts of a state patch before it goes to analytics.
 *
 * `advance()` used to spread the whole patch into the event, which shipped the
 * visitor's raw postcode into `site_events` — 195 of them between 1 May and
 * 11 Sep 2026. A postcode alongside a registration and a timestamp identifies a
 * household, and nothing downstream ever needed the raw value: every question
 * we ask of this data ("which regions book?", "does entering a postcode help?")
 * is answered by the resolved region and a boolean.
 *
 * The full vehicle blob goes too — it's large, it duplicates what
 * /api/lookup already returns, and it has a registration in it.
 */
function analyticsSafe(patch: Partial<State>): Record<string, unknown> {
  const { postcode, vehicle: _vehicle, vrm: _vrm, ...rest } = patch;
  void _vehicle;
  void _vrm;

  if (postcode === undefined) return rest;

  return {
    ...rest,
    has_postcode: postcode.length > 0,
    region: postcode ? resolveRegion(postcode).key : null,
  };
}

interface Props {
  /** ?vrm= — read on the server so the wizard can render without client JS. */
  vrm?: string;
  /** ?type= — the pre-selected service, when a CTA chose one. */
  type?: string;
  /** ?source= — which CTA sent them; rides on every funnel event. */
  source?: string;
}

export default function BookingWizard({ vrm: urlVrmRaw, type: urlTypeRaw, source: urlSource }: Props) {
  const source = urlSource || "direct";
  const urlVrm = (urlVrmRaw ?? "").toUpperCase().replace(/\s+/g, "");
  const urlType = urlTypeRaw?.toLowerCase();

  // Initial state comes from the URL params ONLY.
  //
  // sessionStorage used to be read here too, which was fine while this whole
  // subtree was client-only — but it can't be now. The server has no
  // sessionStorage, so a stored step would make the client's first render
  // disagree with the server's HTML and break hydration. The restore moved to
  // an effect below, which runs after mount when storage is actually readable.
  const [state, setState] = useState<State>(() => {
    const initialService = isServiceType(urlType) ? (urlType as ServiceType) : null;

    let initialStep: Step = 1;
    if (urlVrm) initialStep = initialService ? 3 : 2;

    return {
      step: initialStep,
      vrm: urlVrm,
      vehicle: null,
      service: initialService,
      postcode: "",
      date: "",
      flexibility: "within_week",
    };
  });

  // Restore a part-finished wizard from sessionStorage, after mount.
  //
  // A deep-link wins: if the URL named a vehicle, that's the car the visitor
  // just asked about, not whatever they abandoned last week. Returning
  // mid-flow visitors now see step 1 for a frame before jumping to where they
  // left off — the cost of letting everyone else get server-rendered HTML.
  const restored = useRef(false);
  useEffect(() => {
    restored.current = true;
    if (urlVrm) return;
    const stored = loadFromStorage();
    if (!stored) return;
    setState((s) => ({
      ...s,
      vrm: stored.vrm ?? s.vrm,
      service: stored.service && isServiceType(stored.service) ? stored.service : s.service,
      postcode: stored.postcode ?? s.postcode,
      date: stored.date ?? s.date,
      flexibility: stored.flexibility ?? s.flexibility,
      step: (stored.step as Step) ?? s.step,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire booking_wizard_start once on mount.
  useEffect(() => {
    trackEvent("booking_wizard_start", {
      source,
      prefilled_vrm: Boolean(urlVrm),
      prefilled_type: urlType ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Canonical booking-funnel metric. Fires whenever a step becomes visible —
  // on initial mount (deep-links can enter at step 2 or 3) AND on every step
  // change — so `booking_step_view {step: 1..4}` gives the true reach at each
  // step regardless of entry point. Unlike `booking_step_complete` (which fires
  // only on ADVANCE and whose `step` is the arrived-at step), this captures
  // people who land mid-wizard and those who view a step but don't complete it.
  // Pair with the Step 4 `partner_click` (BookMyGarage hand-off) as the final
  // stage; drop-off between adjacent steps = the leak. `source` carries which
  // CTA sent them (e.g. action_banner_expired, mot-booking-cta-health-*).
  useEffect(() => {
    trackEvent("booking_step_view", { step: state.step, source });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  // Persist on every state change so refresh / back navigation lands the
  // user where they left off.
  const skipFirstSave = useRef(true);
  useEffect(() => {
    // Skip the mount commit. The restore effect above has scheduled its
    // setState by now but the new state hasn't landed, so saving here would
    // write the empty default over the very thing we're restoring.
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    saveToStorage(state);
  }, [state]);

  // Bring the WIZARD into view on a step change — not the top of the page.
  //
  // This used to be `window.scrollTo(0, 0)`, which is wrong on a phone. The
  // hero sits above the wizard, so yanking the viewport to y=0 puts the step
  // the visitor just advanced to *below the fold*: they submit a reg and the
  // thing they were looking at scrolls away, leaving them to scroll back down
  // to find what they typed. Making Step 1 advance immediately made this more
  // frequent, because there's no longer an intermediate card absorbing the
  // moment.
  //
  // Scrolling the card itself to the top of the viewport keeps the promise the
  // original comment made — the new step is visible from the first frame —
  // without discarding the visitor's position.
  //
  // Skipped on mount: someone arriving on /booking should see the hero and
  // read what the page is, not be thrown straight past it.
  const wizardRef = useRef<HTMLDivElement>(null);
  const skipFirstScroll = useRef(true);
  useEffect(() => {
    if (skipFirstScroll.current) {
      skipFirstScroll.current = false;
      return;
    }
    const el = wizardRef.current;
    if (!el || typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [state.step]);

  // Background-fetch the vehicle when we have a vrm but no vehicle data.
  // Happens after deep-link entry (skipped Step 1) or after sessionStorage
  // restore (we don't persist the vehicle blob). Without this, the Step 4
  // summary reads "(no vehicle selected)" for deep-link users and the
  // category falls back to medium_petrol for service price calculations.
  useEffect(() => {
    if (!state.vrm || state.vehicle) return;
    let cancelled = false;
    fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vrm: state.vrm }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.data) return;
        setState((s) => (s.vrm === state.vrm ? { ...s, vehicle: payload.data } : s));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [state.vrm, state.vehicle]);

  function goTo(step: Step) {
    setState((s) => ({ ...s, step }));
  }

  function advance(nextStep: Step, patch: Partial<State>, eventName: string) {
    setState((s) => ({ ...s, ...patch, step: nextStep }));
    trackEvent(eventName, { step: nextStep, ...analyticsSafe(patch) });
  }

  // Use a stable category for downstream steps. Falls back to medium_petrol
  // for users who skipped Step 1 entirely.
  const vehicleBasics: VehicleBasics = {
    make: state.vehicle?.make,
    model: state.vehicle?.model,
    fuelType: state.vehicle?.fuelType,
    engineCapacity: state.vehicle?.engineCapacity,
    yearOfManufacture: state.vehicle?.yearOfManufacture,
  };
  const category: VehicleCategory = state.vehicle ? categoriseVehicle(vehicleBasics) : "medium_petrol";

  const vehicleLabel = state.vehicle
    ? `${state.vehicle.make ?? ""} ${state.vehicle.model ?? ""}`.trim()
    : "";

  // The one-line proof that the lookup did something: "2013 · petrol · 998cc".
  const vehicleDetail = state.vehicle
    ? [
        state.vehicle.yearOfManufacture,
        state.vehicle.fuelType?.toLowerCase(),
        state.vehicle.engineCapacity ? `${state.vehicle.engineCapacity}cc` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  // Price the service cards for where the visitor actually is. Step 2 used to
  // receive a hardcoded "UK average" even when a postcode was already sitting
  // in sessionStorage from an earlier visit, so a London user was quoted
  // national prices and then watched them jump 30% at Step 3.
  const step2Region = resolveRegion(state.postcode);

  // Build a recommendation context from the looked-up vehicle. For users who
  // skipped the lookup we use neutral defaults that fall through to the
  // "full service" fallback recommendation.
  const isOver3Years = state.vehicle?.yearOfManufacture
    ? new Date().getFullYear() - state.vehicle.yearOfManufacture >= 3
    : true;
  const recommendationContext = {
    motStatus: state.vehicle?.motStatus,
    motExpiryDate: state.vehicle?.motExpiryDate,
    isOver3Years,
    recentAdvisoryCount: 0, // BMG flow doesn't pull deep MOT data; leave neutral
    recentFailureCount: 0,
  };

  return (
    <div ref={wizardRef} className="space-y-6 scroll-mt-4">
      <BookingProgress current={state.step} />

      <div
        key={state.step}
        className="rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-sm p-5 sm:p-6 animate-fadeInUp"
        style={{ animationDuration: "300ms" }}
      >
        {state.step === 1 && (
          <Step1Vehicle
            initialVrm={state.vrm}
            onConfirm={(vrm, vehicle) => {
              setState((s) => ({ ...s, vrm, vehicle }));
              advance(2, { vrm, vehicle }, "booking_step_complete");
            }}
          />
        )}

        {state.step === 2 && (
          <Step2ServiceType
            onBack={() => {
              trackEvent("booking_step_back", { from_step: 2, to_step: 1 });
              goTo(1);
            }}
            onSelect={(service) => advance(3, { service }, "booking_step_complete")}
            category={category}
            region={step2Region}
            recommendationContext={recommendationContext}
            vrm={state.vrm}
            vehicleLabel={vehicleLabel}
            vehicleDetail={vehicleDetail}
          />
        )}

        {state.step === 3 && state.service && (
          <Step3Location
            initialPostcode={state.postcode}
            initialDate={state.date}
            initialFlexibility={state.flexibility}
            service={state.service}
            category={category}
            onBack={() => {
              trackEvent("booking_step_back", { from_step: 3, to_step: 2 });
              goTo(2);
            }}
            onContinue={(postcode, date, flexibility) =>
              advance(
                4,
                { postcode, date, flexibility },
                "booking_step_complete",
              )
            }
            onSkipPostcode={(date, flexibility) =>
              advance(
                4,
                { postcode: "", date, flexibility },
                "booking_step_complete",
              )
            }
          />
        )}

        {state.step === 4 && state.service && (
          <Step4Review
            vrm={state.vrm}
            vehicleLabel={vehicleLabel}
            service={state.service}
            category={category}
            postcode={state.postcode}
            date={state.date}
            flexibility={state.flexibility}
            onEdit={() => {
              trackEvent("booking_step_back", { from_step: 4, to_step: 3 });
              goTo(3);
            }}
          />
        )}
      </div>
    </div>
  );
}
