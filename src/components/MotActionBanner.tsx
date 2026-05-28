"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import MOTReminderSignup from "@/components/MOTReminderSignup";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackEvent, trackPartnerClick } from "@/lib/tracking";

type Urgency = "expired" | "due-soon" | "far";

interface Props {
  motStatus?: string;
  motExpiryDate?: string;
  daysUntilExpiry: number;
  registrationNumber: string;
  makeModel?: string;
}

function getUrgency(motStatus: string | undefined, days: number): Urgency | null {
  if (!motStatus) return null;
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
  const viewedRef = useRef(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  // Banner-view IntersectionObserver. Has to live above the early return
  // so the hook order is stable across renders where motStatus changes.
  useEffect(() => {
    if (!urgency) return;
    if (viewedRef.current || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") return;
    const node = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            trackEvent("mot_action_banner_view", {
              urgency,
              days_until_expiry: daysUntilExpiry,
            });
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [urgency, daysUntilExpiry]);

  if (!urgency) return null;

  const headline =
    urgency === "expired"
      ? "MOT expired"
      : urgency === "due-soon"
        ? `MOT due in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`
        : `Next MOT: ${formatExpiryDisplay(motExpiryDate)}`;

  const subhead =
    urgency === "expired"
      ? "Driving without a valid MOT is illegal — fines up to £1,000 and invalidated insurance. Book a test today to get back on the road."
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

  const bmgHref =
    PARTNER_LINKS.bookMyGarage.buildLink?.(registrationNumber) ??
    PARTNER_LINKS.bookMyGarage.url;
  const bmgRel = getPartnerRel(PARTNER_LINKS.bookMyGarage);
  const bmgContext = `mot-action-banner-${urgency}`;

  const reminderContext =
    urgency === "expired"
      ? "expired"
      : urgency === "due-soon"
        ? "due-soon"
        : "post-lookup";
  const reminderTriggerVariant =
    urgency === "expired"
      ? "action_banner_expired"
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
            href={bmgHref}
            target="_blank"
            rel={bmgRel}
            onClick={() => trackPartnerClick("bookMyGarage", bmgContext)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-initial ${palette.primary}`}
          >
            {bmgLabel}
            <ExternalLink className="h-3.5 w-3.5" />
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
