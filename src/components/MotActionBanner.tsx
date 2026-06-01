"use client";

import { useEffect, useRef, useState } from "react";
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
 * Status-aware action banner shown immediately under the vehicle header on
 * the results page. Adapts to MOT urgency:
 *
 *   - expired   → red, headline "MOT EXPIRED", primary "Book MOT now" → BMG,
 *                 secondary "Set reminder for next year" → opens inline form
 *   - due-soon  → amber, headline "MOT due in X days", primary
 *                 "Compare MOT prices" → BMG, secondary "Also set reminder"
 *   - far       → blue/slate, headline "Next MOT: {date}", single CTA
 *                 "Set MOT reminder" → opens inline form
 *
 * Replaces two older sub-surfaces:
 *   - The MOT expired/expiring banner (BMG-only, no reminder)
 *   - The MOTReminderCollapsible chip (reminder-only, no BMG)
 *
 * Designed for 100% visibility (above the fold, above the SectionGroups)
 * given dashboard data showed only ~4% of users reached the Next Steps
 * section and ~22% reached Health & Safety — the strongest CTAs were
 * positioned in dead zones.
 *
 * Fires distinct tracking events:
 *   - mot_action_banner_view on first 50% visibility
 *   - mot_action_banner_reminder_open when the reminder CTA is tapped
 *   - partner_click with click_context=`mot-action-banner-{urgency}`
 *   - (The inline MOTReminderSignup keeps its own existing lifecycle events
 *     once expanded, tagged with triggerVariant=`action_banner_{urgency}`)
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
  const [reminderOpen, setReminderOpen] = useState(false);

  // Banner-view event. Previously used IntersectionObserver with a 50%
  // threshold, but the banner is wrapped in DataReveal (opacity-0 →
  // animate-fadeInUp) and the two observers' setup/teardown timing was
  // racing — the banner's observer often disconnected before producing
  // an intersection entry. Result: events stopped firing in production
  // around 18:16 UTC on 2026-05-28 with no user-visible symptom.
  //
  // Since the banner only renders when MOT urgency is meaningful (the
  // !urgency early return below covers the rest), if it renders we
  // want to count it. Mount-firing — gated by per-urgency dedup so a
  // re-render due to other state changes doesn't double-count, but a
  // genuine urgency change (e.g. user looks up a different car) fires
  // a fresh event — is simpler and more honest. Hook order stays
  // stable across the null-urgency case so React doesn't complain.
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
          ? "Book up to 28 days early without losing any days. Garages near you can be £20+ cheaper than chain centres."
          : "Set a free email reminder so you never get caught out. Two emails, 28 & 7 days before expiry. No spam.";

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
          secondary:
            "bg-slate-900/60 hover:bg-slate-800/80 border border-red-700/50 text-red-100",
        }
      : urgency === "due-soon"
        ? {
            container:
              "bg-gradient-to-br from-amber-950/60 to-amber-950/30 border-amber-700/60",
            icon: "text-amber-400",
            headline: "text-amber-100",
            primary:
              "bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-900/30",
            secondary:
              "bg-slate-900/60 hover:bg-slate-800/80 border border-amber-700/50 text-amber-100",
          }
        : {
            container:
              "bg-gradient-to-br from-slate-900/60 to-slate-900/30 border-slate-700/60",
            icon: "text-cyan-400",
            headline: "text-slate-100",
            primary:
              "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-900/30",
            secondary:
              "bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 text-slate-100",
          };

  const showBmg = urgency === "expired" || urgency === "due-soon";
  const bmgLabel = urgency === "expired" ? "Book MOT now" : "Compare MOT prices";
  const reminderLabel =
    urgency === "expired"
      ? "Set reminder for next year"
      : urgency === "due-soon"
        ? "Also set reminder"
        : "Set MOT reminder";

  // Route to the internal /booking wizard rather than directly to BMG so
  // we can qualify intent (postcode, flexibility, recommended service) and
  // surface our own price context before hand-off. The wizard fires
  // booking_wizard_start with source=action_banner_{urgency} and the
  // final partner_click happens at Step 4 with click_context=
  // "booking-flow-mot". This is the A/B test: action banner → wizard vs
  // every other BMG CTA still goes direct.
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

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {showBmg && (
          <a
            href={bookingHref}
            onClick={() =>
              trackEvent("action_banner_booking_click", { urgency })
            }
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-initial ${palette.primary}`}
          >
            {bmgLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            if (!reminderOpen) {
              trackEvent("mot_action_banner_reminder_open", { urgency });
            }
            setReminderOpen((v) => !v);
          }}
          aria-expanded={reminderOpen}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-initial ${palette.secondary}`}
        >
          <Bell className="h-3.5 w-3.5" />
          {reminderLabel}
        </button>
      </div>

      {reminderOpen && (
        <div className="mt-4 border-t border-slate-700/40 pt-4">
          <MOTReminderSignup
            context={reminderContext}
            triggerVariant={reminderTriggerVariant}
            regNumber={registrationNumber}
            motExpiryDate={motExpiryDate}
            makeModel={makeModel}
            compact
          />
        </div>
      )}
    </div>
  );
}
