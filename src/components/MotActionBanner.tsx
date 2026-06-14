"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronRight,
  Clock,
} from "lucide-react";
import MOTReminderSignup from "@/components/MOTReminderSignup";
import { trackEvent } from "@/lib/tracking";

type Urgency = "expired" | "due-soon" | "far" | "no-record";

interface Props {
  motStatus?: string;
  motExpiryDate?: string;
  daysUntilExpiry: number;
  registrationNumber: string;
  makeModel?: string;
}

function getUrgency(motStatus: string | undefined, days: number): Urgency | null {
  // No MOT held by DVLA — the vehicle is too new to have needed one yet, or
  // DVLA simply holds no test history. This is NOT the same as an expired
  // MOT: asserting "MOT expired" here is factually wrong and erodes trust.
  if (!motStatus || motStatus === "No details held by DVLA") return "no-record";
  if (motStatus !== "Valid") return "expired"; // covers "Expired" and "Not valid"
  if (days <= 0) return "expired";
  if (days <= 60) return "due-soon";
  return "far";
}

function formatExpiryDisplay(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Status-aware action banner shown immediately under the vehicle header on the
 * results page. Adapts to MOT urgency, and — critically — shows the reminder
 * email field INLINE (no tap-to-expand). The vehicle is already known, so the
 * ask is a single email box.
 *
 * The old click-to-expand gate was the conversion killer: dashboard funnel
 * showed ~940 reminder-prompt impressions/week but only ~6 expands (0.6%). The
 * reg is already searched, so hideReg drops the only other field. For
 * expired/due-soon the "book now" CTA stays primary with the reminder field
 * directly beneath it; for far/no-record the reminder ask is the main action.
 *
 * Fires:
 *   - mot_action_banner_view on first render per urgency
 *   - the inline MOTReminderSignup keeps its own lifecycle events
 *     (mot_reminder_view / _submit_attempt / mot_reminder), tagged with
 *     triggerVariant=`action_banner_{urgency}`
 */
export default function MotActionBanner({
  motStatus,
  motExpiryDate,
  daysUntilExpiry,
  registrationNumber,
  makeModel,
}: Props) {
  const urgency = getUrgency(motStatus, daysUntilExpiry);

  const ref = useRef<HTMLDivElement | null>(null);
  const lastViewedUrgency = useRef<Urgency | null>(null);

  // Banner-view event. Mount-firing — gated by per-urgency dedup so a re-render
  // due to other state changes doesn't double-count, but a genuine urgency
  // change (user looks up a different car) fires a fresh event. Hook order
  // stays stable across the null-urgency case so React doesn't complain.
  useEffect(() => {
    if (!urgency) {
      lastViewedUrgency.current = null;
      return;
    }
    if (lastViewedUrgency.current === urgency) return;
    lastViewedUrgency.current = urgency;
    trackEvent("mot_action_banner_view", {
      urgency,
      days_until_expiry: daysUntilExpiry,
    });
  }, [urgency, daysUntilExpiry]);

  if (!urgency) return null;

  const headline =
    urgency === "expired"
      ? "MOT expired"
      : urgency === "no-record"
        ? "No MOT history on record"
        : urgency === "due-soon"
          ? `MOT due in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`
          : `Next MOT: ${formatExpiryDisplay(motExpiryDate)}`;

  const subhead =
    urgency === "expired"
      ? "Driving without a valid MOT is illegal — fines up to £1,000 and invalidated insurance. Book a test today to get back on the road."
      : urgency === "no-record"
        ? "DVLA holds no MOT details for this vehicle — usually because it's too new to have needed one (the first MOT falls due 3 years after registration). Set a free reminder so it never catches you out."
        : urgency === "due-soon"
          ? "You can test up to a month early and keep your renewal date — and local garages are often cheaper than the chains. Set a free reminder so you don't miss the window."
          : "Set a free email reminder so you never get caught out — we'll nudge you in time to test early and keep your renewal date.";

  const Icon =
    urgency === "expired" ? AlertTriangle : urgency === "due-soon" ? Clock : Calendar;

  const palette =
    urgency === "expired"
      ? {
          container: "bg-gradient-to-br from-red-950/60 to-red-950/30 border-red-700/60",
          icon: "text-red-400",
          headline: "text-red-100",
          primary:
            "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30",
        }
      : urgency === "due-soon"
        ? {
            container:
              "bg-gradient-to-br from-amber-950/60 to-amber-950/30 border-amber-700/60",
            icon: "text-amber-400",
            headline: "text-amber-100",
            primary:
              "bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-900/30",
          }
        : {
            container:
              "bg-gradient-to-br from-slate-900/60 to-slate-900/30 border-slate-700/60",
            icon: "text-cyan-400",
            headline: "text-slate-100",
            primary:
              "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-900/30",
          };

  const showBmg = urgency === "expired" || urgency === "due-soon";
  const bmgLabel = urgency === "expired" ? "Book MOT now" : "Compare MOT prices";

  // Route to the internal /booking wizard rather than directly to BMG so we can
  // qualify intent (postcode, flexibility, recommended service) and surface our
  // own price context before hand-off.
  const bookingHref = `/booking?vrm=${encodeURIComponent(registrationNumber)}&type=mot&source=action_banner_${urgency}`;

  const reminderContext =
    urgency === "expired"
      ? "expired"
      : urgency === "due-soon"
        ? "due-soon"
        : "post-lookup";
  const reminderTriggerVariant =
    urgency === "expired"
      ? "action_banner_expired"
      : urgency === "no-record"
        ? "action_banner_no_record"
        : urgency === "due-soon"
          ? "action_banner_due_soon"
          : "action_banner_far";

  const reminderLeadIn =
    urgency === "expired"
      ? "Set a free reminder so you're ready well before next year's MOT:"
      : urgency === "no-record"
        ? "Set a free reminder for when its first MOT falls due:"
        : urgency === "due-soon"
          ? "Get a free reminder — we'll help you book in time:"
          : `We'll email you free before it expires on ${formatExpiryDisplay(motExpiryDate)}:`;

  return (
    <div ref={ref} className={`mb-6 rounded-xl border p-4 sm:p-5 ${palette.container}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 shrink-0 mt-0.5 ${palette.icon}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className={`text-base font-bold sm:text-lg ${palette.headline}`}>
            {headline}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{subhead}</p>
        </div>
      </div>

      {showBmg && (
        <div className="mt-4">
          <a
            href={bookingHref}
            onClick={() => trackEvent("action_banner_booking_click", { urgency })}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:w-auto ${palette.primary}`}
          >
            {bmgLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Always-visible one-field reminder ask — the reg is already known. */}
      <div className={`mt-4 ${showBmg ? "border-t border-slate-700/40 pt-4" : ""}`}>
        <div className="mb-2 flex items-center gap-2">
          <Bell className={`h-3.5 w-3.5 shrink-0 ${palette.icon}`} aria-hidden="true" />
          <p className="text-sm font-medium text-slate-200">{reminderLeadIn}</p>
        </div>
        <MOTReminderSignup
          context={reminderContext}
          triggerVariant={reminderTriggerVariant}
          regNumber={registrationNumber}
          motExpiryDate={motExpiryDate}
          makeModel={makeModel}
          compact
          hideReg
          allowTimingPicker
        />
      </div>
    </div>
  );
}
