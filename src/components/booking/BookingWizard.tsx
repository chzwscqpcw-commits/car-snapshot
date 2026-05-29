"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import BookingProgress from "./BookingProgress";
import Step1Vehicle from "./Step1Vehicle";
import Step2ServiceType from "./Step2ServiceType";
import Step3Location from "./Step3Location";
import Step4Review from "./Step4Review";
import {
  categoriseVehicle,
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

export default function BookingWizard() {
  const searchParams = useSearchParams();

  // Initial state pulled from (in order): URL params → sessionStorage → defaults.
  const [state, setState] = useState<State>(() => {
    const urlVrm = searchParams.get("vrm")?.toUpperCase().replace(/\s+/g, "") ?? "";
    const urlType = searchParams.get("type")?.toLowerCase();

    const stored = urlVrm ? null : loadFromStorage();

    const initialVrm = urlVrm || stored?.vrm || "";
    const initialService = isServiceType(urlType)
      ? (urlType as ServiceType)
      : stored?.service && isServiceType(stored.service)
        ? stored.service
        : null;

    let initialStep: Step = 1;
    if (urlVrm) initialStep = initialService ? 3 : 2;
    else if (stored?.step) initialStep = (stored.step as Step) ?? 1;

    return {
      step: initialStep,
      vrm: initialVrm,
      vehicle: null,
      service: initialService,
      postcode: stored?.postcode ?? "",
      date: stored?.date ?? "",
      flexibility: stored?.flexibility ?? "within_week",
    };
  });

  // Fire booking_wizard_start once on mount.
  useEffect(() => {
    const source = searchParams.get("source") ?? "direct";
    trackEvent("booking_wizard_start", {
      source,
      prefilled_vrm: Boolean(searchParams.get("vrm")),
      prefilled_type: searchParams.get("type") ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every state change so refresh / back navigation lands the
  // user where they left off.
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Scroll to top of the page on every step change. Without this, advancing
  // from a tall step (Step 3 has postcode + date + flexibility + price
  // context) leaves the user halfway down the page when Step 4 mounts,
  // hiding the hero, progress dots and the summary heading. We scroll
  // instantly (not smooth) so the new step's content is visible from the
  // first paint rather than animating up over hundreds of ms.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
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
    trackEvent(eventName, { step: nextStep, ...patch });
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
    <div className="space-y-6">
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
            region={{ key: "default", label: "UK average", multiplier: 1.0 }}
            recommendationContext={recommendationContext}
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
