"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { BellRing, Car, Check, Loader2, Mail, Smartphone, TrendingUp } from "lucide-react";
import Button from "@/components/Button";
import { EXPERIMENTS, assignExperimentVariant, trackEvent, trackExperimentImpressionOnce } from "@/lib/tracking";
import {
  INTENT_LABELS,
  SAVE_INTENTS,
  alertsDescription,
  cleanEmail,
  makeModelLabel,
  type SaveIntent,
  type SaveSurface,
} from "@/lib/saved-cars";
import { addLocalCar, alertsFor, carIntent, isLocalCar, onAlertsChange, onIntentChange, rememberAlerts, rememberIntent } from "@/lib/my-cars";
import { pushAvailability, subscribeToPush, type PushAvailability } from "@/lib/push-client";
import { ALERT_STEP_ARMS, alertStepCopy, intentToStore, nextCarDate, type AlertStepArm } from "@/lib/alert-step";
import { shortVehicleName } from "@/lib/report-v2/format";
import DatedAlertStep, { DateTile } from "@/components/save-card/DatedAlertStep";
import HomeScreenWalkthrough from "@/components/pwa/HomeScreenWalkthrough";
import { iosBrowser, type IosBrowser } from "@/components/pwa/ios-browser";

/**
 * "Save this car and get alerts" — the one-tap save that turns the local My
 * Cars list into a saved car with alerts (MOT due, tax due, a new recall, and
 * a monthly value check for owners who say they're selling).
 *
 * Why it exists: saving a car is the repeat-use behaviour the site already
 * has — 185 people a month tap "My Car", against 12 who type an email into
 * the reminder form — and 65% of lookups are cars whose MOT is months away,
 * so the only way to be useful to them is to be there when the date comes.
 *
 * Shape: one tap saves locally at once (exactly what "My Car" does), then the
 * card asks where alerts should go: a notification on this device where the
 * browser can do it (Android/Chrome, desktop, an installed iPhone app), or an
 * email. Permission is only ever asked for AFTER a save, never on page load,
 * and only when the visitor taps "Notify me". A device that has
 * switched alerts on for this car sees a quiet "Alerts on" line instead of
 * the ask (and the value variant disappears), so nobody is asked twice.
 *
 * Step two is under test (save_alert_step_v1, EXPERIMENTS.SAVE_ALERT_STEP):
 * "control" is the step described above; "dated" leads with the car's own
 * next date and asks for one thing (DatedAlertStep). Step one, the local
 * save, is the same in both arms, so vehicle_saved stays comparable. The
 * arm is sticky per visitor; a session counts as exposed once the alerts
 * step has actually been on screen; car_saved is the conversion.
 */

const EMAIL_MEMORY_KEY = "fpc-alert-email";

interface SaveCarCardProps {
  /** Which placement — rides on every event as `surface`. */
  surface: SaveSurface;
  /** "alerts" leads with MOT/tax/recall; "value" leads with the monthly value check. */
  variant?: "alerts" | "value";
  vrm: string;
  make?: string;
  model?: string;
  trim?: string;
  motExpiryDate?: string;
  taxDueDate?: string;
  /** Lets the recall alert match the car's build years. */
  year?: number;
  /**
   * The homepage keeps its own My Cars state, so it saves locally itself
   * (and fires vehicle_saved as its "My Car" button does). Elsewhere the card
   * writes the shared list directly.
   */
  onLocalSave?: () => void;
  className?: string;
  /** /preview/save-card only: see SaveCardPreview. */
  preview?: SaveCardPreview;
}

/**
 * Shows the alerts step in a chosen arm and device state, on the preview
 * page. A previewed card touches nothing: no events, no storage, no request,
 * no real permission prompt. Saving and the prompt's answer are pretended.
 */
export interface SaveCardPreview {
  arm: AlertStepArm;
  push: PushAvailability;
  /** What the pretend permission prompt answers when the notify button is tapped. */
  permission?: "granted" | "refused";
  /** An address this device "remembers" from an earlier save. */
  email?: string;
  /** Fixes today, so the fixture's dates read the same whenever it is viewed. */
  now?: Date;
}

type Step = "idle" | "channel" | "done";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SaveCarCard({
  surface,
  variant = "alerts",
  vrm,
  make,
  model,
  trim,
  motExpiryDate,
  taxDueDate,
  year,
  onLocalSave,
  className = "",
  preview,
}: SaveCarCardProps) {
  const [step, setStep] = useState<Step>(preview ? "channel" : "idle");
  const [intent, setIntent] = useState<SaveIntent | null>(null);
  const [email, setEmail] = useState(preview?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [push, setPush] = useState<PushAvailability>(preview?.push ?? { kind: "unsupported" });
  // save_alert_step_v1: which step two this visitor gets. Assigned once per
  // mount so the step can't change under the reader, sticky across visits.
  // Every surface mounts the card after a client-side lookup, so there is no
  // server render to match (and step two is never the first render anyway).
  const [arm] = useState<AlertStepArm | null>(() =>
    preview
      ? preview.arm
      : typeof window === "undefined"
        ? null
        : (assignExperimentVariant(EXPERIMENTS.SAVE_ALERT_STEP, [...ALERT_STEP_ARMS]) as AlertStepArm),
  );
  const dated = arm === "dated";
  const [now] = useState(() => preview?.now ?? new Date());
  // Dated arm only. The email form is open although this browser could
  // notify (the visitor chose it, or the prompt came back without a yes)…
  const [emailOpen, setEmailOpen] = useState(false);
  // …with a plain line saying why, when it wasn't their choice.
  const [notice, setNotice] = useState<string | null>(null);
  // The monthly value check, asked for (or declined) on this card. Null
  // until touched: the value card asks for it by being the value card.
  const [valueAsked, setValueAsked] = useState<boolean | null>(null);
  const [channel, setChannel] = useState<"email" | "push" | null>(null);
  // iPhone only: the Home Screen walkthrough, offered once alerts are saved
  // by email so nobody loses the save while learning the gesture.
  const [howTo, setHowTo] = useState<IosBrowser | null>(null);
  const name = makeModelLabel(make, model);
  const plate = vrm.replace(/\s+/g, "").toUpperCase();

  // "Selling it, or keeping it?" is asked once per page (SellerIntentChip);
  // the answer pre-fills this card's row, and a pick here is kept the same way.
  useEffect(() => {
    if (preview) return;
    const sync = () => {
      if (step !== "done") setIntent(carIntent(plate));
    };
    sync();
    return onIntentChange(sync);
  }, [plate, step, preview]);

  // What this device already knows: alerts on → done; in My Cars → straight
  // to the channel step. Read after mount (localStorage), so the server and
  // first client render agree.
  useEffect(() => {
    if (preview) return;
    const sync = () => {
      const known = alertsFor(plate);
      if (known) {
        setIntent(known.intent);
        setValueAsked(known.value ?? null);
        setChannel(known.channel);
        setStep("done");
        // The value card on the same page as the alerts card: once either
        // has done its job, the other goes.
        if (variant === "value") setHidden(true);
        return;
      }
      if (isLocalCar(plate)) setStep((s) => (s === "idle" ? "channel" : s));
    };
    sync();
    setPush(pushAvailability());
    try {
      setEmail((e) => e || localStorage.getItem(EMAIL_MEMORY_KEY) || "");
    } catch {
      // Storage blocked: the field just starts empty.
    }
    return onAlertsChange(sync);
  }, [plate, variant, preview]);

  // Seen once, when half the card is on screen: the denominator for the
  // opt-in rate (car_saved ÷ save_card_view per surface).
  const cardRef = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  useEffect(() => {
    if (seen.current || hidden || preview) return;
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        seen.current = true;
        obs.disconnect();
        trackEvent("save_card_view", { surface, variant });
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [surface, variant, hidden, preview]);

  // What a save from this card will be sent. A stated plan decides it, as it
  // always has; the dated arm can also ask for the value check outright (the
  // value card by default, the tick on the alerts card), which is stored as
  // the weakest plan that switches it on (see intentToStore).
  const statedValue = intent === "selling" || intent === "thinking";
  const isValue = variant === "value";
  const valueCheck = statedValue || (step === "done" ? valueAsked === true : dated && (valueAsked ?? (isValue && intent !== "keeping")));
  const storedIntent = intentToStore(intent, valueCheck);
  const next = nextCarDate({ motExpiryDate, taxDueDate }, now);
  const copy = alertStepCopy(
    { card: variant, name: shortVehicleName(make, model), motExpiryDate, taxDueDate, intent, valueCheck },
    now,
  );

  // Exposure for save_alert_step_v1: the alerts step half on screen, counted
  // once per session whichever surface or car it was. The context fields are
  // the same in both arms, so each arm's denominator can be cut the same way
  // (a phone that can notify is a different test from one that can't).
  const stepRef = useRef<HTMLFormElement>(null);
  const nextKind = next?.kind ?? "none";
  const expose = () => {
    if (preview || !arm) return;
    trackExperimentImpressionOnce(EXPERIMENTS.SAVE_ALERT_STEP, arm, { surface, card: variant, push: push.kind, next: nextKind });
  };
  const exposeRef = useRef(expose);
  useEffect(() => {
    exposeRef.current = expose;
  });
  useEffect(() => {
    if (step !== "channel" || preview) return;
    const node = stepRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        exposeRef.current();
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [step, preview]);

  const saveLocally = () => {
    if (preview) {
      setStep("channel");
      return;
    }
    if (onLocalSave) {
      onLocalSave();
    } else {
      const total = addLocalCar({ registrationNumber: plate, make, model, variant: trim, motExpiryDate, taxDueDate });
      trackEvent("vehicle_saved", { kind: "my_vehicles", reg: plate, make: make ?? null, model: model ?? null, surface, total_my_vehicles: total });
    }
    setStep("channel");
  };

  const save = async (body: Record<string, unknown>, via: "email" | "push"): Promise<boolean> => {
    if (preview) {
      await wait(700);
      setValueAsked(valueCheck);
      setChannel(via);
      setStep("done");
      return true;
    }
    const res = await fetch("/api/saved-cars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vrm: plate, make, model, year, motExpiry: motExpiryDate, taxDue: taxDueDate, intent: storedIntent, surface, channel: via, ...body }),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!res.ok || !json?.ok) {
      setError(json?.error || "Something went wrong — please try again.");
      return false;
    }
    // `intent` stays what the owner SAID (the weekly audit's "not said" row
    // depends on it); value_check says whether the monthly check is coming.
    trackEvent("car_saved", { surface, channel: via, intent, value_check: valueCheck, vrm: plate });
    rememberAlerts(plate, { channel: via, intent, ...(valueCheck && !statedValue ? { value: true } : {}) });
    setValueAsked(valueCheck);
    setChannel(via);
    setStep("done");
    return true;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = cleanEmail(email);
    if (!clean) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setChannel("email");
    setError(null);
    expose();
    if (!preview) trackEvent("alert_opt_in", { channel: "email", surface });
    try {
      if ((await save({ email: clean }, "email")) && !preview) {
        try {
          localStorage.setItem(EMAIL_MEMORY_KEY, clean);
        } catch {
          // Fine without it.
        }
      }
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  // The permission prompt, and only now: after a save, on a tap.
  const notify = async () => {
    setBusy(true);
    setChannel("push");
    setError(null);
    setNotice(null);
    expose();
    if (!preview) trackEvent("alert_opt_in", { channel: "push", surface });
    try {
      const subscription = preview ? await pretendPrompt(preview) : await subscribeToPush();
      if (!subscription) {
        setPush(preview ? { kind: "denied" } : pushAvailability());
        if (dated) {
          // No yes from the prompt (declined, dismissed, or the browser
          // couldn't): not a mistake of theirs, so no error. The email
          // field takes over, with whatever address this device remembers.
          setNotice("No notifications on this device for now. Email works just as well:");
          setEmailOpen(true);
        } else {
          setError("Notifications were blocked on this device — email works just as well.");
        }
        return;
      }
      await save({ subscription }, "push");
    } catch {
      if (dated) {
        setNotice("Couldn't switch notifications on here. Email works just as well:");
        setEmailOpen(true);
      } else {
        setError("Couldn't switch notifications on — try email instead.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (hidden) return null;

  const Icon = isValue ? TrendingUp : BellRing;
  const tone = isValue
    ? "from-cyan-950/50 via-slate-900/80 to-slate-900 border-cyan-500/25"
    : "from-emerald-950/50 via-slate-900/80 to-slate-900 border-emerald-500/25";
  const iconTone = isValue ? "text-cyan-300 bg-cyan-500/10 ring-cyan-400/20" : "text-emerald-300 bg-emerald-500/10 ring-emerald-400/20";

  return (
    <div
      ref={cardRef}
      data-save-card={surface}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 sm:p-6 transition-[border-color,box-shadow] duration-500 ${tone} ${
        step === "done" ? "shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_12px_40px_-20px_rgba(16,185,129,0.5)]" : ""
      } ${className}`}
    >
      {/* A soft light that drifts in when the card does its job. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl transition-opacity duration-700 ${
          step === "done" ? "opacity-100 bg-emerald-400/15" : "opacity-0 bg-emerald-400/0"
        }`}
      />
      <div className="relative flex items-start gap-3.5">
        {step === "channel" && dated && copy.date ? (
          <DateTile iso={copy.date} />
        ) : (
          <span className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${iconTone}`}>
            {step === "done" ? <Check className="h-5 w-5 text-emerald-300" strokeWidth={2.5} /> : <Icon className="h-5 w-5" />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {step === "idle" && (
            <div key="idle" className="fact-enter">
              <h3 className="text-base font-semibold text-white">
                {isValue ? "Track this car's value" : "Save this car and get alerts"}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                {isValue
                  ? `A monthly check on what ${name ? `your ${titleCase(name)}` : "it"} is worth, and a nudge when its MOT or tax is due. Free, no account.`
                  : "MOT due, tax due, a new recall — a nudge on the day it matters. Free, no account, one tap."}
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-3">
                <Button type="button" onClick={saveLocally} size="md" className="min-w-[11rem]">
                  <Car className="h-4 w-4" />
                  {isValue ? "Track" : "Save"} <span className="font-mono tracking-wide">{spaced(plate)}</span>
                </Button>
                <span className="text-xs text-slate-500">Saved to My Cars on this device, then choose alerts.</span>
              </div>
            </div>
          )}

          {step === "channel" && dated && (
            <DatedAlertStep
              key="channel-dated"
              formRef={stepRef}
              copy={copy}
              push={push}
              busy={busy}
              channel={channel}
              error={error}
              notice={notice}
              email={email}
              onEmail={(value) => {
                setEmail(value);
                if (error) setError(null);
              }}
              emailOpen={emailOpen}
              onEmailOpen={(open) => {
                setEmailOpen(open);
                setNotice(null);
                setError(null);
              }}
              onNotify={notify}
              onSubmit={submit}
              valueToggle={copy.lead === "value" || statedValue ? null : { on: valueCheck, onChange: setValueAsked }}
            />
          )}

          {step === "channel" && !dated && (
            <form key="channel" ref={stepRef} onSubmit={submit} className="fact-enter" noValidate data-alert-step="control">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                In My Cars
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">Where should alerts go?</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                We&apos;ll tell you {alertsDescription(intent)}. Nothing else.
              </p>

              <fieldset className="mt-3.5">
                <legend className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Plans for it? (optional)</legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {SAVE_INTENTS.map((i) => {
                    const on = intent === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setIntent(on ? null : i);
                          if (!preview) rememberIntent(plate, on ? null : i);
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95 ${
                          on
                            ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
                            : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        {INTENT_LABELS[i]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {push.kind === "ready" && (
                <div className="mt-3.5">
                  <Button type="button" onClick={notify} disabled={busy} size="md" className="w-full sm:w-auto sm:min-w-[14rem]">
                    {busy && channel === "push" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                    Notify me on this device
                  </Button>
                  <div className="my-3 flex items-center gap-3 text-[11px] uppercase tracking-widest text-slate-600">
                    <span className="h-px flex-1 bg-slate-800" />
                    or by email
                    <span className="h-px flex-1 bg-slate-800" />
                  </div>
                </div>
              )}
              {push.kind === "ios-install" && (
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  <Smartphone className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-slate-400" />
                  On iPhone, notifications need Free Plate Check on your Home Screen (we&apos;ll show you how after). Email works everywhere.
                </p>
              )}
              <div className={`${push.kind === "ready" ? "" : "mt-3.5"} flex flex-col gap-2 sm:flex-row`}>
                <label className="relative flex-1">
                  <span className="sr-only">Email address</span>
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900/70 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                  />
                </label>
                <Button type="submit" disabled={busy} variant={push.kind === "ready" ? "secondary" : "primary"} size="md" className="sm:min-w-[9.5rem]">
                  {busy && channel === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                  {busy && channel === "email" ? "Saving…" : push.kind === "ready" ? "Email me" : "Turn on alerts"}
                </Button>
              </div>
              {error ? (
                <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Only for these alerts — never marketing. Stop any time from the email.</p>
              )}
            </form>
          )}

          {step === "done" && (
            <div key="done" className="fact-enter">
              <h3 className="text-base font-semibold text-white">
                Alerts on for <span className="font-mono tracking-wide">{spaced(plate)}</span>
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                We&apos;ll {channel === "push" ? "notify you on this device" : "email you"} {alertsDescription(storedIntent)}.
                {intent && <> You said you&apos;re <span className="text-slate-200">{INTENT_LABELS[intent].toLowerCase()}</span>.</>}
              </p>
              {push.kind === "ios-install" && channel === "email" && (
                howTo ? (
                  <div className="fact-enter mt-4 border-t border-slate-700/60 pt-4">
                    <p className="mb-3 text-sm font-medium text-white">Alerts on this phone too</p>
                    <HomeScreenWalkthrough browser={howTo} source="save-card" track={!preview} />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setHowTo(preview ? "safari-new" : iosBrowser())}
                    className="mt-3 inline-flex items-center gap-1.5 text-left text-xs font-medium text-cyan-300 underline-offset-4 transition-colors hover:text-cyan-200 hover:underline"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Want alerts on this phone? See how (6 seconds)
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The preview's stand-in for the browser's permission prompt: a beat, then its answer. */
async function pretendPrompt(preview: SaveCardPreview): Promise<{ endpoint: string } | null> {
  await wait(900);
  return preview.permission === "refused" ? null : { endpoint: "preview" };
}

/** "AB12CDE" -> "AB12 CDE" for display only; the stored plate has no space. */
function spaced(plate: string): string {
  return /^[A-Z]{2}\d{2}[A-Z]{3}$/.test(plate) ? `${plate.slice(0, 4)} ${plate.slice(4)}` : plate;
}

/** "FORD FOCUS" -> "Ford Focus" for prose. */
function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
