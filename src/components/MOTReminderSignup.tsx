"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCircle2, X, Loader2 } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";

interface MOTReminderSignupProps {
  context: "generic" | "due-soon" | "expired" | "post-lookup";
  regNumber?: string;
  motExpiryDate?: string;
  makeModel?: string;
  compact?: boolean;
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
      "We\u2019ll email you 28 days and 7 days before it expires.",
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
  return "border-l-emerald-500";
}

function getBgTint(context: MOTReminderSignupProps["context"]) {
  if (context === "due-soon") return "bg-amber-500/5";
  if (context === "expired") return "bg-red-500/5";
  return "bg-emerald-500/5";
}

function getBellColor(context: MOTReminderSignupProps["context"]) {
  if (context === "due-soon") return "text-amber-500";
  if (context === "expired") return "text-red-500";
  return "text-emerald-500";
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
  regNumber,
  motExpiryDate,
  makeModel,
  compact = false,
}: MOTReminderSignupProps) {
  const [regs, setRegs] = useState<string[]>([regNumber?.toUpperCase() || ""]);
  const [email, setEmail] = useState("");
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

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    regs.forEach((reg, i) => {
      const cleaned = cleanReg(reg);
      if (!cleaned) {
        newErrors[`reg-${i}`] = "Please enter your vehicle registration";
      } else if (!isValidReg(reg)) {
        newErrors[`reg-${i}`] =
          "That doesn\u2019t look like a valid UK registration";
      }
    });

    if (!email.trim()) {
      newErrors.email = "Please enter your email address";
    } else if (!isValidEmail(email.trim())) {
      newErrors.email = "Please check your email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [regs, email]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitting(true);
      setErrors({});

      try {
        const trimmedEmail = email.trim().toLowerCase();

        for (let i = 0; i < regs.length; i++) {
          const vrm = cleanReg(regs[i]);

          // Only use the prop expiry for the first vehicle (it belongs to that reg)
          let expiry = i === 0 && regNumber && motExpiryDate ? motExpiryDate : "";
          let vehicleMakeModel = i === 0 ? makeModel || "" : "";

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
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => null);
            if (res.status === 409) {
              setErrors({
                general:
                  "We already have a reminder set for this vehicle. Check your inbox.",
              });
              setSubmitting(false);
              return;
            }
            setErrors({
              general:
                data?.error || "Something went wrong \u2014 please try again",
            });
            setSubmitting(false);
            return;
          }
        }

        setSuccessReg(regs.map((r) => cleanReg(r)).join(", "));
        setSuccessEmail(trimmedEmail);
        setSuccessExpiry(motExpiryDate || "");
        setSuccess(true);
      } catch {
        setErrors({
          general: "Something went wrong \u2014 please try again",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [regs, email, motExpiryDate, makeModel, validate]
  );

  // --- Success state ---
  if (success) {
    const firstReg = cleanReg(regs[0]);
    const bmgLink = PARTNER_LINKS.bookMyGarage.buildLink!(firstReg);
    const bmgRel = getPartnerRel(PARTNER_LINKS.bookMyGarage);

    return (
      <div
        className={`rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 transition-opacity duration-300 ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-white">
              Reminder set for {successReg}
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

            <a
              href={bmgLink}
              target="_blank"
              rel={bmgRel}
              className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Compare MOT prices near you &mdash; BookMyGarage &#8599;
            </a>

            <p className="mt-3 text-xs text-slate-500">
              Free Plate Check may earn a small commission from partner links, at
              no cost to you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Compact variant ---
  if (compact) {
    return (
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-2"
        noValidate
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            type="text"
            value={regs[0]}
            onChange={(e) => updateReg(0, e.target.value)}
            placeholder="e.g. AB12 CDE"
            maxLength={8}
            className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 font-mono text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
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
            className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-10 whitespace-nowrap rounded-md bg-emerald-500 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-emerald-600 disabled:opacity-60"
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

        <p className="text-xs text-slate-500">
          &#10003; Free &nbsp;&nbsp; &#10003; No spam &nbsp;&nbsp; &#10003;
          Unsubscribe any time
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
                  className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 font-mono text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
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
          className="w-full rounded-md bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-emerald-600 disabled:opacity-60 sm:w-auto sm:ml-auto sm:block"
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

        {/* Trust signals */}
        <p className="text-xs text-slate-500">
          &#10003; Free &nbsp;&nbsp; &#10003; No spam &nbsp;&nbsp; &#10003;
          Unsubscribe any time
        </p>
      </form>
    </div>
  );
}
