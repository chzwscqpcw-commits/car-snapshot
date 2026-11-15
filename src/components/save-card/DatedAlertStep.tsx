"use client";

import { useEffect, useRef, type FormEvent, type Ref } from "react";
import { BellRing, Check, Loader2, Mail, Smartphone } from "lucide-react";
import Button from "@/components/Button";
import type { AlertStepCopy, TimelineStop } from "@/lib/alert-step";
import type { PushAvailability } from "@/lib/push-client";

/**
 * Step two of the save card in the "dated" arm of save_alert_step_v1.
 *
 * The step as shipped asks "Where should alerts go?" and offers a row of
 * plans, a notify button, a divider and an email form. Nine in ten savers
 * stopped there. This one says what the alert IS for this car (its own next
 * date, and the days the reminders will arrive) and asks for one thing:
 * a single button where the browser can notify, the email field where it
 * can't. Everything it promises comes from src/lib/alert-step.ts, which is
 * tied to the cron's schedule.
 *
 * Presentation only: SaveCarCard owns the save, the events and the state.
 */

interface DatedAlertStepProps {
  formRef: Ref<HTMLFormElement>;
  copy: AlertStepCopy;
  push: PushAvailability;
  busy: boolean;
  channel: "email" | "push" | null;
  error: string | null;
  /** A plain line above the email field once notifying turned out not to be possible. Not an error. */
  notice: string | null;
  email: string;
  onEmail: (value: string) => void;
  /** The email form is showing although this browser could notify. */
  emailOpen: boolean;
  onEmailOpen: (open: boolean) => void;
  onNotify: () => void;
  onSubmit: (e: FormEvent) => void;
  /** The optional "add a monthly value check" tick; null where the value check is already the lead or already coming. */
  valueToggle: { on: boolean; onChange: (on: boolean) => void } | null;
}

export default function DatedAlertStep({
  formRef,
  copy,
  push,
  busy,
  channel,
  error,
  notice,
  email,
  onEmail,
  emailOpen,
  onEmailOpen,
  onNotify,
  onSubmit,
  valueToggle,
}: DatedAlertStepProps) {
  const oneTap = push.kind === "ready" && !emailOpen;
  const inputRef = useRef<HTMLInputElement>(null);
  // Focus the field only when the visitor asked for it ("Use email
  // instead"). After a declined prompt it would throw the keyboard up
  // over the line that explains what happened.
  const askedForEmail = useRef(false);
  useEffect(() => {
    if (emailOpen && askedForEmail.current) inputRef.current?.focus();
    askedForEmail.current = false;
  }, [emailOpen]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="fact-enter" noValidate data-alert-step="dated">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        In My Cars
      </p>
      <h3 className="mt-1 text-lg font-semibold leading-snug tracking-tight text-white">{copy.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-300">{copy.body}</p>

      {copy.timeline.length > 0 && <Timeline stops={copy.timeline} />}

      {copy.also && <p className="mt-3 text-xs leading-relaxed text-slate-400">{copy.also}</p>}

      {valueToggle && (
        <label className="mt-2.5 flex w-fit cursor-pointer select-none items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={valueToggle.on}
            onChange={(e) => valueToggle.onChange(e.target.checked)}
          />
          <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-600 bg-slate-900 text-transparent transition-all peer-checked:border-cyan-400 peer-checked:bg-cyan-500 peer-checked:text-slate-950 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400/50">
            <Check className="h-3 w-3" strokeWidth={3.5} />
          </span>
          Add a monthly check on what it&apos;s worth
        </label>
      )}

      {oneTap ? (
        <div className="mt-4">
          <Button type="button" onClick={onNotify} disabled={busy} size="lg" className="w-full sm:w-auto sm:min-w-[16rem]">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
            {busy ? "Switching on…" : copy.pushCta}
          </Button>
          {error ? (
            <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              One tap: your browser asks to allow notifications, and that&apos;s it. Only for these alerts, never marketing.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              askedForEmail.current = true;
              onEmailOpen(true);
            }}
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 underline-offset-4 transition-colors hover:text-cyan-200 hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            Use email instead
          </button>
        </div>
      ) : (
        <div className="fact-enter mt-4">
          {notice && (
            <p role="status" className="mb-2 text-xs leading-relaxed text-slate-300">
              {notice}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Email address</span>
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                ref={inputRef}
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => onEmail(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900/70 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
            </label>
            <Button type="submit" disabled={busy} size="md" className="sm:min-w-[11rem]">
              {busy && channel === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
              {busy && channel === "email" ? "Saving…" : copy.emailCta}
            </Button>
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Only for these alerts — never marketing. Stop any time from the email.</p>
          )}
          {push.kind === "ios-install" && (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              <Smartphone className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-slate-400" />
              On iPhone, notifications need Free Plate Check on your Home Screen (we&apos;ll show you how after). Email works everywhere.
            </p>
          )}
          {push.kind === "ready" && (
            <button
              type="button"
              onClick={() => onEmailOpen(false)}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 underline-offset-4 transition-colors hover:text-cyan-200 hover:underline"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Notify me on this device instead
            </button>
          )}
        </div>
      )}
    </form>
  );
}

/**
 * When this car's owner will hear from us: today, each reminder, the date.
 * Evenly spaced rather than to scale: five weeks and one week before a
 * date eight months off would sit on top of each other.
 */
function Timeline({ stops }: { stops: TimelineStop[] }) {
  return (
    <ol className="relative mt-4 flex justify-between" aria-label="When you'll hear from us">
      <span
        aria-hidden="true"
        className="alert-track-line absolute left-2 right-2 top-[9px] h-px bg-gradient-to-r from-slate-600 via-emerald-400/70 to-cyan-300"
      />
      {stops.map((s, i) => {
        const edge = i === 0 ? "items-start text-left" : i === stops.length - 1 ? "items-end text-right" : "items-center text-center";
        return (
          <li
            key={`${s.kind}-${s.label}`}
            className={`alert-track-stop relative flex min-w-0 flex-col ${edge}`}
            style={{ animationDelay: `${220 + i * 140}ms` }}
          >
            <span
              className={`flex h-[19px] w-[19px] items-center justify-center rounded-full ring-1 ${
                s.kind === "due"
                  ? "bg-cyan-300 text-slate-950 ring-cyan-200 shadow-[0_0_0_4px_rgba(34,211,238,0.14)]"
                  : s.kind === "reminder"
                    ? "bg-emerald-950 text-emerald-300 ring-emerald-400/60"
                    : "bg-slate-900 text-slate-500 ring-slate-600"
              }`}
            >
              {s.kind === "reminder" ? (
                <BellRing className="h-2.5 w-2.5" strokeWidth={2.5} />
              ) : s.kind === "due" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              )}
            </span>
            <span className={`mt-1.5 whitespace-nowrap text-xs font-semibold ${s.kind === "due" ? "text-white" : "text-slate-200"}`}>{s.label}</span>
            <span className={`whitespace-nowrap text-[11px] ${s.kind === "due" ? "text-cyan-300" : "text-slate-500"}`}>{s.sub}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** The car's date as a little calendar page, in the card's icon slot. */
export function DateTile({ iso }: { iso: string }) {
  const d = new Date(`${iso}T00:00:00Z`);
  return (
    <span
      aria-hidden="true"
      className="alert-date-tile mt-0.5 inline-flex h-10 w-9 flex-shrink-0 flex-col overflow-hidden rounded-lg bg-slate-900 text-center ring-1 ring-emerald-400/40"
    >
      <span className="bg-emerald-500 py-px text-[9px] font-bold uppercase leading-[13px] tracking-wider text-emerald-950">
        {d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
      </span>
      <span className="flex flex-1 items-center justify-center text-[15px] font-bold leading-none text-white">{d.getUTCDate()}</span>
    </span>
  );
}
