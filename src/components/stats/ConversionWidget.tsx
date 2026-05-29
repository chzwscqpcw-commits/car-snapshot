"use client";

import { useRef, useState } from "react";
import { Search, Bell, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";
import { trackConversion, trackEvent, trackPartnerClick } from "@/lib/tracking";

interface ConversionWidgetProps {
  /** Contextual headline — connect to what the user is reading */
  headline?: string;
  /** Contextual subtext */
  subtext?: string;
  /** Show MOT reminder signup below the reg lookup */
  showReminder?: boolean;
  /** Reminder headline override */
  reminderHeadline?: string;
  /**
   * Where the reg-lookup submits to. Defaults to "/" (the full report). On
   * a focused tool page like /tax-check, pass the tool's own path so the
   * submission stays inside that tool's result view.
   */
  targetPath?: string;
}

function cleanReg(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function isValidReg(reg: string): boolean {
  const cleaned = cleanReg(reg);
  return cleaned.length >= 2 && cleaned.length <= 8;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ConversionWidget({
  headline = "Check Your Own Vehicle",
  subtext = "Enter any UK reg plate for a free instant check — MOT history, tax status, mileage, valuations and more.",
  showReminder = true,
  reminderHeadline = "Never miss your MOT",
  targetPath = "/",
}: ConversionWidgetProps) {
  const router = useRouter();
  const [reg, setReg] = useState("");
  const [regError, setRegError] = useState("");

  // MOT reminder state
  const [reminderReg, setReminderReg] = useState("");
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderError, setReminderError] = useState("");
  const [reminderSubmitting, setReminderSubmitting] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState(false);

  // Lookup-button state: pre-flight the DVLA call before navigating so a bad
  // reg shows an inline error instead of landing on a messy result page.
  const [lookupSubmitting, setLookupSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleLookup() {
    const cleaned = cleanReg(reg);
    if (!cleaned) {
      setRegError("Please enter a registration number");
      return;
    }
    if (!isValidReg(reg)) {
      setRegError("That doesn\u2019t look like a valid UK registration");
      return;
    }
    setRegError("");
    setLookupSubmitting(true);

    // Cancel any in-flight pre-check (user spamming the button)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm: cleaned }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          (body && (body.error || body.message)) ||
          (res.status === 404
            ? "We couldn\u2019t find that registration \u2014 double-check and try again."
            : "Lookup failed \u2014 please try again in a moment.");
        setRegError(msg);
        return;
      }
      // flow = "tool" distinguishes widget-originated reg_search events
      // (entry point on tool pages and stats pages) from the homepage's
      // "main" flow and the homepage compare flow. Lets the dashboard /
      // GA4 split conversions by entry surface. target_path adds extra
      // resolution for which specific tool page was the entry point.
      trackConversion("reg_search", {
        vrm: cleaned,
        flow: "tool",
        target_path: targetPath,
      });
      const join = targetPath.includes("?") ? "&" : "?";
      router.push(`${targetPath}${join}vrm=${cleaned}`);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setRegError(
        "Couldn\u2019t reach the lookup service \u2014 check your connection and try again."
      );
    } finally {
      setLookupSubmitting(false);
    }
  }

  async function handleReminder(e: React.FormEvent) {
    e.preventDefault();
    trackEvent("mot_reminder_submit_attempt", { context: "widget" });
    const cleanedReg = cleanReg(reminderReg);

    if (!cleanedReg) {
      trackEvent("mot_reminder_validation_error", { context: "widget", field: "reg_empty" });
      setReminderError("Please enter a registration number");
      return;
    }
    if (!isValidReg(reminderReg)) {
      trackEvent("mot_reminder_validation_error", { context: "widget", field: "reg_invalid" });
      setReminderError("That doesn\u2019t look like a valid UK registration");
      return;
    }
    if (!reminderEmail.trim()) {
      trackEvent("mot_reminder_validation_error", { context: "widget", field: "email_empty" });
      setReminderError("Please enter your email address");
      return;
    }
    if (!isValidEmail(reminderEmail.trim())) {
      trackEvent("mot_reminder_validation_error", { context: "widget", field: "email_invalid" });
      setReminderError("Please check your email address");
      return;
    }

    setReminderSubmitting(true);
    setReminderError("");

    try {
      // Look up vehicle to get expiry + make/model
      let expiry = "";
      let makeModel = "";
      try {
        const lookupRes = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vrm: cleanedReg }),
        });
        if (lookupRes.ok) {
          const json = await lookupRes.json();
          const data = json?.data;
          expiry = data?.motExpiryDate || "";
          if (data?.make) {
            makeModel = `${data.make} ${data.model || ""}`.trim();
          }
        }
      } catch {
        // Continue without — API will use defaults
      }

      const res = await fetch("/api/mot-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: reminderEmail.trim().toLowerCase(),
          vrm: cleanedReg,
          makeModel,
          motExpiry: expiry,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 409) {
          trackEvent("mot_reminder_submit_error", { context: "widget", error_type: "duplicate" });
          setReminderError(
            "We already have a reminder set for this vehicle. Check your inbox."
          );
        } else {
          trackEvent("mot_reminder_submit_error", {
            context: "widget",
            error_type: "server",
            status: res.status,
          });
          setReminderError(
            data?.error || "Something went wrong \u2014 please try again"
          );
        }
        setReminderSubmitting(false);
        return;
      }

      trackConversion("mot_reminder", { vrm: cleanedReg, context: "widget" });
      setReminderSuccess(true);
    } catch {
      trackEvent("mot_reminder_submit_error", { context: "widget", error_type: "network" });
      setReminderError("Something went wrong \u2014 please try again");
    } finally {
      setReminderSubmitting(false);
    }
  }

  return (
    <div className="my-10 space-y-6">
      {/* --- Reg lookup section --- */}
      <div id="check-vehicle" className="scroll-mt-24 rounded-xl border border-blue-800/40 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 p-6 sm:p-8">
        <h3 className="text-xl font-bold text-gray-100">{headline}</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-400">
          {subtext}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:max-w-lg sm:mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={reg}
              onChange={(e) => {
                setReg(e.target.value.toUpperCase());
                setRegError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLookup();
              }}
              placeholder="Enter reg, e.g. AB12 CDE"
              maxLength={10}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 font-mono text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={lookupSubmitting}
            className="h-11 whitespace-nowrap rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-cyan-600 active:scale-95 disabled:opacity-70 disabled:cursor-progress flex items-center justify-center gap-2"
          >
            {lookupSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Check vehicle free
              </>
            )}
          </button>
        </div>

        {regError && (
          <p className="mt-2 text-center text-xs text-red-400">{regError}</p>
        )}

        <p className="mt-3 text-center text-xs text-slate-500">
          Free &amp; instant &mdash; no signup required
        </p>
      </div>

      {/* --- MOT Reminder section --- */}
      {showReminder && !reminderSuccess && (
        <div id="mot-reminder" className="scroll-mt-24 rounded-xl border border-emerald-800/40 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-semibold text-gray-100">
                {reminderHeadline}
              </h4>
              <p className="mt-1 text-sm text-slate-400">
                Get a free email reminder 28 days and 7 days before your MOT
                expires.
              </p>

              <form
                onSubmit={handleReminder}
                className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start"
                noValidate
              >
                <input
                  type="text"
                  value={reminderReg}
                  onChange={(e) => {
                    setReminderReg(e.target.value.toUpperCase());
                    setReminderError("");
                  }}
                  placeholder="e.g. AB12 CDE"
                  maxLength={8}
                  className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 font-mono text-sm tracking-widest text-white uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  value={reminderEmail}
                  onChange={(e) => {
                    setReminderEmail(e.target.value);
                    setReminderError("");
                  }}
                  placeholder="Your email address"
                  className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={reminderSubmitting}
                  className="h-10 whitespace-nowrap rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {reminderSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Setting&hellip;
                    </>
                  ) : (
                    "Remind me \u2192"
                  )}
                </button>
              </form>

              {reminderError && (
                <p className="mt-2 text-xs text-red-400">{reminderError}</p>
              )}

              <p className="mt-2 text-xs text-slate-500">
                &#10003; Free &nbsp;&nbsp; &#10003; No spam &nbsp;&nbsp;
                &#10003; Unsubscribe any time
              </p>
              <p className="mt-2 text-xs text-amber-500/80">
                Driving without a valid MOT can mean a fine of up to &pound;1,000.
              </p>
            </div>
          </div>

          {/* BookMyGarage affiliate link */}
          <div className="mt-3 border-t border-slate-700/50 pt-3">
            <a
              href="https://www.awin1.com/cread.php?awinmid=68338&awinaffid=2729598&ued=https%3A%2F%2Fwww.bookmygarage.com%2Fmot%2F"
              target="_blank"
              rel="noopener sponsored"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-emerald-400"
            >
              Need an MOT or service? Compare prices from local garages &mdash; BookMyGarage
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
            </a>
            <p className="mt-1 text-xs text-slate-600">
              Free Plate Check may earn a small commission from partner links, at no cost to you.
            </p>
          </div>
        </div>
      )}

      {/* --- Reminder success --- */}
      {showReminder && reminderSuccess && (
        <div id="mot-reminder" className="scroll-mt-24 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">
                Reminder set for {cleanReg(reminderReg)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                We&apos;ll email you at {reminderEmail.trim().toLowerCase()}{" "}
                before your MOT expires.
              </p>

              {/* BMG follow-up — high-intent moment after signup */}
              <div className="mt-5 rounded-lg border border-emerald-500/30 bg-slate-900/60 p-4">
                <p className="text-sm font-semibold text-white">
                  While you&apos;re here — see what an MOT costs near you
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Many garages charge well below the £54.85 legal maximum.
                  We&apos;ve pre-loaded {cleanReg(reminderReg)} — just add your
                  postcode.
                </p>
                <a
                  href={PARTNER_LINKS.bookMyGarage.buildLink!(cleanReg(reminderReg), "widget-reminder-success")}
                  target="_blank"
                  rel={getPartnerRel(PARTNER_LINKS.bookMyGarage)}
                  onClick={() => trackPartnerClick("bookMyGarage", "widget-reminder-success")}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Compare MOT prices near {cleanReg(reminderReg)}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                </a>
                <p className="mt-2 text-[11px] text-slate-500">
                  Free comparison · No booking fee · Free Plate Check earns a small commission
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
