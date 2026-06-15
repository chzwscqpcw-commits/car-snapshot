"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CalendarPlus, CheckCircle2, X, Loader2 } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackConversion, trackEvent, trackPartnerClick } from "@/lib/tracking";
import { DEFAULT_OFFSETS, OFFSET_OPTIONS, describeSchedule } from "@/lib/mot-reminders";
import { canAddToCalendar, downloadIcs, googleCalendarUrl } from "@/lib/mot-calendar";

interface MOTReminderSignupProps {
  context: "generic" | "due-soon" | "expired" | "post-lookup";
  /**
   * Specific capture-trigger label for analytics (independent of the visual
   * `context` which controls copy/colour). Lets GA4 distinguish triggers like
   * "homepage" vs "blog_footer" that share the same generic visual variant.
   */
  triggerVariant?: string;
  regNumber?: string;
  motExpiryDate?: string;
  makeModel?: string;
  compact?: boolean;
  /**
   * One-field ask: the vehicle is already known (e.g. on the results page), so
   * hide the reg input entirely and just collect an email. Removes the biggest
   * friction point — re-typing a reg the user just searched.
   */
  hideReg?: boolean;
  /** Show the optional "change when I'm reminded" timing picker. */
  allowTimingPicker?: boolean;
  /**
   * Offer a no-email "Add to calendar" option (needs a known future expiry).
   * Our audience self-selects for "no email", so this captures the majority who
   * skip the email field.
   */
  showCalendar?: boolean;
  /** Lead with the calendar button above the email form (low-urgency surfaces). */
  calendarFirst?: boolean;
}

const CONTEXT_COPY: Record<
  MOTReminderSignupProps["context"],
  { heading: string; subtext: (reg?: string) => string }
> = {
  generic: {
    heading: "Get a free MOT reminder",
    subtext: () =>
      "We\u2019ll email you before your MOT is due \u2014 so you never get caught out.",
  },
  "due-soon": {
    heading: "Your MOT is due soon \u2014 set a reminder",
    subtext: () =>
      "We\u2019ll email you in good time before it\u2019s due \u2014 and help you book.",
  },
  expired: {
    heading: "MOT expired \u2014 don\u2019t forget next time",
    subtext: () =>
      "Enter your email and we\u2019ll remind you well before your next one is due.",
  },
  "post-lookup": {
    heading: "Never miss your MOT again",
    subtext: (reg) =>
      `You\u2019ve checked ${reg || "this vehicle"}. Want a reminder before it expires? Takes 10 seconds.`,
  },
};

function getBorderColor(context: MOTReminderSignupProps["context"]) {
  if (context === "due-soon") return "border-l-amber-500";
  if (context === "expired") return "border-l-red-500";
  return "border-l-cyan-500";
}

function getBgTint(context: MOTReminderSignupProps["context"]) {
  if (context === "due-soon") return "bg-amber-500/5";
  if (context === "expired") return "bg-red-500/5";
  return "bg-cyan-500/5";
}

function getBellColor(context: MOTReminderSignupProps["context"]) {
  if (context === "due-soon") return "text-amber-500";
  if (context === "expired") return "text-red-500";
  return "text-cyan-400";
}

function formatExpiryDisplay(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function isValidReg(reg: string): boolean {
  const cleaned = cleanReg(reg);
  return cleaned.length >= 2 && cleaned.length <= 8;
}

export default function MOTReminderSignup({
  context,
  triggerVariant,
  regNumber,
  motExpiryDate,
  makeModel,
  compact = false,
  hideReg = false,
  allowTimingPicker = false,
  showCalendar = false,
  calendarFirst = false,
}: MOTReminderSignupProps) {
  const [regs, setRegs] = useState<string[]>([regNumber?.toUpperCase() || ""]);
  const [email, setEmail] = useState("");
  const [offsets, setOffsets] = useState<number[]>(DEFAULT_OFFSETS);
  const [showTiming, setShowTiming] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successReg, setSuccessReg] = useState("");
  const [successEmail, setSuccessEmail] = useState("");
  const [successExpiry, setSuccessExpiry] = useState("");
  const [pulsing, setPulsing] = useState(context === "due-soon");
  const [fadeIn, setFadeIn] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Stop pulse after 3 seconds
  useEffect(() => {
    if (context === "due-soon") {
      const timer = setTimeout(() => setPulsing(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [context]);

  // Fade in success state
  useEffect(() => {
    if (success) {
      const raf = requestAnimationFrame(() => setFadeIn(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [success]);

  // Fire mot_reminder_view once when the form first becomes 50% visible. Lets
  // GA4 split "form was on the page" from "form was actually seen".
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    const node = formRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            trackEvent("mot_reminder_view", { context, trigger_variant: triggerVariant ?? null });
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [context, triggerVariant]);

  const addVehicle = useCallback(() => {
    if (regs.length < 5) {
      setRegs((prev) => [...prev, ""]);
    }
  }, [regs.length]);

  const removeVehicle = useCallback((index: number) => {
    setRegs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateReg = useCallback((index: number, value: string) => {
    setRegs((prev) => {
      const next = [...prev];
      next[index] = value.toUpperCase();
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`reg-${index}`];
      delete next.general;
      return next;
    });
  }, []);

  const toggleOffset = useCallback((days: number) => {
    setOffsets((prev) =>
      prev.includes(days)
        ? prev.filter((d) => d !== days)
        : [...prev, days].sort((a, b) => b - a),
    );
  }, []);

  const fireCalendarEvent = useCallback(
    (method: "ics" | "google") => {
      trackEvent("mot_reminder_calendar_add", {
        method,
        context,
        trigger_variant: triggerVariant ?? null,
      });
    },
    [context, triggerVariant],
  );

  const handleIcsAdd = useCallback(() => {
    if (!motExpiryDate) return;
    const reg = (regNumber && cleanReg(regNumber)) || cleanReg(regs[0]);
    fireCalendarEvent("ics");
    downloadIcs(reg, motExpiryDate, offsets.length ? offsets : DEFAULT_OFFSETS);
  }, [motExpiryDate, regNumber, regs, offsets, fireCalendarEvent]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // When the vehicle is already known we hide the reg field and trust the
    // regNumber prop, so there's nothing to validate there.
    if (!hideReg) {
      regs.forEach((reg, i) => {
        const cleaned = cleanReg(reg);
        if (!cleaned) {
          newErrors[`reg-${i}`] = "Please enter your vehicle registration";
        } else if (!isValidReg(reg)) {
          newErrors[`reg-${i}`] =
            "That doesn\u2019t look like a valid UK registration";
        }
      });
    }

    if (!email.trim()) {
      newErrors.email = "Please enter your email address";
    } else if (!isValidEmail(email.trim())) {
      newErrors.email = "Please check your email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [regs, email, hideReg]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      trackEvent("mot_reminder_submit_attempt", { context, trigger_variant: triggerVariant ?? null, vrm_count: regs.length });
      if (!validate()) {
        trackEvent("mot_reminder_validation_error", { context, trigger_variant: triggerVariant ?? null });
        return;
      }

      setSubmitting(true);
      setErrors({});

      try {
        const trimmedEmail = email.trim().toLowerCase();
        // When hideReg, the vehicle is known from props — use it directly.
        const effectiveRegs =
          hideReg && regNumber ? [regNumber] : regs;
        const sendOffsets = offsets.length ? offsets : DEFAULT_OFFSETS;

        for (let i = 0; i < effectiveRegs.length; i++) {
          const vrm = cleanReg(effectiveRegs[i]);

          // Only trust the props if the first reg still matches the looked-up
          // vehicle. If the user has edited the reg field, the props are stale
          // and would otherwise tag the new vrm with the previous vehicle's
          // make/model and expiry — leading to confirmation emails like
          // "FIAT 500X (P7SJG)" when P7SJG isn't actually a Fiat.
          const propRegMatches =
            i === 0 && !!regNumber && cleanReg(regNumber) === vrm;
          let expiry = propRegMatches && motExpiryDate ? motExpiryDate : "";
          let vehicleMakeModel = propRegMatches ? makeModel || "" : "";

          // Always look up the vehicle to get accurate expiry + make/model
          if (!expiry) {
            try {
              const lookupRes = await fetch("/api/lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vrm }),
              });
              if (lookupRes.ok) {
                const lookupJson = await lookupRes.json();
                const lookupData = lookupJson?.data;
                expiry = lookupData?.motExpiryDate || "";
                if (!vehicleMakeModel && lookupData?.make) {
                  vehicleMakeModel = `${lookupData.make} ${lookupData.model || ""}`.trim();
                }
              }
            } catch {
              // Continue without expiry — API will use default
            }
          }

          const res = await fetch("/api/mot-reminder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: trimmedEmail,
              vrm,
              makeModel: vehicleMakeModel,
              motExpiry: expiry,
              offsets: sendOffsets,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => null);
            if (res.status === 409) {
              trackEvent("mot_reminder_submit_error", { context, trigger_variant: triggerVariant ?? null, error_type: "duplicate" });
              setErrors({
                general:
                  "We already have a reminder set for this vehicle. Check your inbox.",
              });
              setSubmitting(false);
              return;
            }
            trackEvent("mot_reminder_submit_error", {
              context,
              trigger_variant: triggerVariant ?? null,
              error_type: "server",
              status: res.status,
            });
            setErrors({
              general:
                data?.error || "Something went wrong \u2014 please try again",
            });
            setSubmitting(false);
            return;
          }
        }

        setSuccessReg(effectiveRegs.map((r) => cleanReg(r)).join(", "));
        setSuccessEmail(trimmedEmail);
        setSuccessExpiry(motExpiryDate || "");
        setSuccess(true);
        trackConversion("mot_reminder", {
          context,
          trigger_variant: triggerVariant ?? null,
          vrm_count: effectiveRegs.length,
          offsets: sendOffsets.join(","),
        });
      } catch {
        trackEvent("mot_reminder_submit_error", { context, trigger_variant: triggerVariant ?? null, error_type: "network" });
        setErrors({
          general: "Something went wrong \u2014 please try again",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [regs, email, offsets, hideReg, motExpiryDate, makeModel, validate, context, triggerVariant, regNumber]
  );

  // --- Success state ---
  if (success) {
    const firstReg = cleanReg(regs[0]);
    const bmgLink = PARTNER_LINKS.bookMyGarage.buildLink!(firstReg, "mot-reminder-success");
    const bmgRel = getPartnerRel(PARTNER_LINKS.bookMyGarage);

    return (
      <div
        className={`rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 transition-opacity duration-300 ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-white">
              Reminder set for <span className="font-mono tracking-wider">{successReg}</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              We&apos;ll email you at {successEmail}
              {successExpiry && (
                <>
                  {" "}
                  before your MOT expires on{" "}
                  {formatExpiryDisplay(successExpiry)}.
                </>
              )}
              {!successExpiry && " before your MOT expires."}
            </p>

            {/* Strong BMG CTA — peak intent moment */}
            <div className="mt-5 rounded-lg border border-emerald-500/30 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-white">
                While you&apos;re here — see what an MOT costs near you
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Many garages charge well below the £54.85 legal maximum.
                We&apos;ve pre-loaded {firstReg} — just add your postcode.
              </p>
              <a
                href={bmgLink}
                target="_blank"
                rel={bmgRel}
                onClick={() => trackPartnerClick("bookMyGarage", "mot-reminder-success")}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Compare MOT prices near {firstReg}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
              </a>
              <p className="mt-2 text-[11px] text-slate-500">
                Free comparison · No booking fee · Free Plate Check earns a small commission
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Optional "change when I'm reminded" picker, shared by both variants.
  const timingPicker = allowTimingPicker ? (
    <div className="text-xs">
      {!showTiming ? (
        <button
          type="button"
          onClick={() => setShowTiming(true)}
          className="text-cyan-400 underline-offset-2 hover:text-cyan-300 hover:underline"
        >
          Change when I&rsquo;m reminded
        </button>
      ) : (
        <div className="rounded-md border border-slate-700 bg-slate-800/50 p-3">
          <p className="mb-2 text-slate-400">Email me before expiry:</p>
          <div className="flex flex-wrap gap-2">
            {OFFSET_OPTIONS.map((o) => {
              const on = offsets.includes(o.days);
              return (
                <button
                  key={o.days}
                  type="button"
                  onClick={() => toggleOffset(o.days)}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    on
                      ? "border-cyan-500 bg-cyan-500/15 text-cyan-200"
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          {offsets.length === 0 && (
            <p className="mt-2 text-amber-400">
              Pick at least one &mdash; we&rsquo;ll use 5 weeks + 1 week otherwise.
            </p>
          )}
        </div>
      )}
    </div>
  ) : null;

  // No-email "Add to calendar" option (only where a future expiry is known).
  const calOffsets = offsets.length ? offsets : DEFAULT_OFFSETS;
  const calReg = (regNumber && cleanReg(regNumber)) || cleanReg(regs[0]);
  const calendarBlock =
    showCalendar && canAddToCalendar(motExpiryDate) && motExpiryDate ? (
      <div>
        <button
          type="button"
          onClick={handleIcsAdd}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
        >
          <CalendarPlus className="h-4 w-4" />
          Add to calendar &mdash; no email
        </button>
        <p className="mt-1 text-[11px] text-slate-500">
          Free &middot; no email &middot; alerts {describeSchedule(calOffsets)} before expiry &middot;{" "}
          <a
            href={googleCalendarUrl(calReg, motExpiryDate)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => fireCalendarEvent("google")}
            className="text-cyan-400 underline-offset-2 hover:text-cyan-300 hover:underline"
          >
            Google Calendar
          </a>
        </p>
      </div>
    ) : null;

  const orDivider = (label: string) => (
    <div className="flex items-center gap-2 py-0.5">
      <span className="h-px flex-1 bg-slate-700/70" />
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="h-px flex-1 bg-slate-700/70" />
    </div>
  );

  // --- Compact variant ---
  if (compact) {
    const emailFields = (
      <>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          {!hideReg && (
            <input
              type="text"
              value={regs[0]}
              onChange={(e) => updateReg(0, e.target.value)}
              placeholder="e.g. AB12 CDE"
              maxLength={8}
              className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 font-mono text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => {
                const next = { ...prev };
                delete next.email;
                delete next.general;
                return next;
              });
            }}
            placeholder="Your email address"
            className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-10 whitespace-nowrap rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 px-5 text-sm font-semibold text-white transition-all duration-150 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-60 shadow-md shadow-cyan-500/20"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting reminder&hellip;
              </span>
            ) : (
              "Remind me \u2192"
            )}
          </button>
        </div>

        {(errors["reg-0"] || errors.email || errors.general) && (
          <p className="text-xs text-red-400">
            {errors["reg-0"] || errors.email || errors.general}
          </p>
        )}
      </>
    );

    return (
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-2"
        noValidate
      >
        {calendarBlock && calendarFirst && (
          <>
            {calendarBlock}
            {orDivider("or get email reminders")}
          </>
        )}

        {emailFields}

        {calendarBlock && !calendarFirst && (
          <>
            {orDivider("prefer not to share your email?")}
            {calendarBlock}
          </>
        )}

        {timingPicker}

        <p className="text-xs text-slate-500">
          &#10003; Free &nbsp;&nbsp; &#10003; No spam &nbsp;&nbsp; &#10003;
          Unsubscribe any time
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Each reminder helps you book &mdash; and compares local garage prices, often below the
          &pound;54.85 cap.
        </p>
      </form>
    );
  }

  // --- Full variant ---
  const copy = CONTEXT_COPY[context];

  return (
    <div
      className={`rounded-lg border-l-4 ${getBorderColor(context)} ${getBgTint(context)} bg-slate-900 p-5 sm:p-6 ${
        pulsing ? "animate-pulse" : ""
      }`}
      style={pulsing ? { animationDuration: "2s" } : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Bell
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${getBellColor(context)}`}
        />
        <div>
          <h3 className="text-lg font-semibold text-white">{copy.heading}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {copy.subtext(regNumber)}
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-4 space-y-3"
        noValidate
      >
        {/* Reg + email fields */}
        <div className="space-y-3">
          {regs.map((reg, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={reg}
                  onChange={(e) => updateReg(i, e.target.value)}
                  placeholder="e.g. AB12 CDE"
                  maxLength={8}
                  className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 font-mono text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {errors[`reg-${i}`] && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors[`reg-${i}`]}
                  </p>
                )}
              </div>
              {i === 0 ? (
                /* Email field next to first reg on desktop */
                <div className="hidden flex-1 sm:block">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.email;
                        delete next.general;
                        return next;
                      });
                    }}
                    placeholder="Your email address"
                    className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => removeVehicle(i)}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400 transition-colors"
                  aria-label="Remove vehicle"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {/* Email field on mobile (shown below first reg) */}
          <div className="sm:hidden">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.email;
                  delete next.general;
                  return next;
                });
              }}
              placeholder="Your email address"
              className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Add vehicle + count */}
        <div className="flex items-center justify-between">
          <div>
            {regs.length < 5 && (
              <button
                type="button"
                onClick={addVehicle}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                + Add another vehicle
              </button>
            )}
            {regs.length > 1 && (
              <span className="ml-3 text-xs text-slate-500">
                {regs.length} of 5
              </span>
            )}
          </div>
        </div>

        {/* General error */}
        {errors.general && (
          <p className="text-sm text-red-400">{errors.general}</p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-60 shadow-md shadow-cyan-500/20 sm:w-auto sm:ml-auto sm:block"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting reminder&hellip;
            </span>
          ) : (
            "Set my MOT reminder \u2192"
          )}
        </button>

        {timingPicker}

        {/* Trust signals */}
        <p className="text-xs text-slate-500">
          &#10003; Free &nbsp;&nbsp; &#10003; No spam &nbsp;&nbsp; &#10003;
          Unsubscribe any time
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Each reminder helps you book &mdash; and compares local garage prices, often below the
          &pound;54.85 cap.
        </p>
        {(context === "expired" || context === "due-soon") && (
          <p className="mt-1.5 text-xs text-amber-500/80">
            Driving without a valid MOT can mean a fine of up to &pound;1,000.
          </p>
        )}
      </form>
    </div>
  );
}
