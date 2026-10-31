/**
 * Which alerts a saved car is due, and what each one says. Pure functions:
 * the daily cron (src/app/api/cron/car-alerts/route.ts) feeds it rows and
 * sends what comes back; scripts/test-car-alerts.ts pins the rules.
 *
 * The ledger (saved_cars.alerts_sent, jsonb) maps a key to the ISO time it
 * was sent. Keys carry the date they were about ("mot_7:2027-05-08"), so a
 * renewed MOT gets fresh reminders next year and nothing is sent twice.
 */

import type { SaveChannel, SaveIntent } from "@/lib/saved-cars";

export type AlertKind = "mot_35" | "mot_7" | "tax" | "recall" | "value";

export interface SavedCarRow {
  id: string;
  vrm: string;
  make_model: string | null;
  mot_expiry: string | null;
  tax_due: string | null;
  intent: SaveIntent | null;
  channel: SaveChannel;
  email: string | null;
  push_subscription_id: string | null;
  manage_token: string;
  alerts_sent: Record<string, string> | null;
  recall_count: number | null;
  year_of_manufacture: number | null;
  created_at: string;
  updated_at: string;
}

export interface DueAlert {
  kind: AlertKind;
  /** Ledger key to write once sent. */
  key: string;
  /** Other ledger keys to write at the same time (windows skipped past). */
  alsoMark: string[];
  /** Days until the date the alert is about, when there is one. */
  days?: number;
}

const DAY = 86_400_000;

/** Whole days from `now` to an ISO date, counting today as 0. */
export function daysUntil(iso: string, now: Date): number {
  const target = Date.parse(`${iso}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / DAY);
}

/** "2026-11" for the month `now` falls in (UTC). */
export function monthKey(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const MOT_WINDOWS = [35, 7] as const;
export const TAX_WINDOW_DAYS = 7;
/** A value check at most this often, and never before the car has been saved this long. */
export const VALUE_INTERVAL_DAYS = 28;

/**
 * Should the cron re-check this car's dates with DVLA before deciding?
 * Only when something is close enough to matter, or the row is a month
 * stale — a daily lookup for every saved car would be a lot of DVLA calls
 * for nothing.
 */
export function needsRefresh(car: SavedCarRow, now: Date): boolean {
  if (car.mot_expiry && daysUntil(car.mot_expiry, now) <= MOT_WINDOWS[0] + 1) return true;
  if (car.tax_due && daysUntil(car.tax_due, now) <= TAX_WINDOW_DAYS + 1) return true;
  if (!car.mot_expiry || !car.tax_due) return true;
  return now.getTime() - Date.parse(car.updated_at) > 30 * DAY;
}

export function dueAlerts(car: SavedCarRow, now: Date, currentRecallCount: number | null): DueAlert[] {
  const sent = car.alerts_sent ?? {};
  const due: DueAlert[] = [];

  // MOT: the most urgent reached window, once per expiry date. Reached
  // windows that weren't sent (saved at day 20: the 35-day one) are marked
  // too, so they're never back-filled later.
  if (car.mot_expiry) {
    const days = daysUntil(car.mot_expiry, now);
    if (days >= 0) {
      const reached = MOT_WINDOWS.filter((w) => days <= w).map((w) => `mot_${w}:${car.mot_expiry}`);
      const unsent = reached.filter((k) => !sent[k]);
      if (unsent.length) {
        const key = reached[reached.length - 1];
        const kind: AlertKind = key.startsWith("mot_7") ? "mot_7" : "mot_35";
        due.push({ kind, key, alsoMark: unsent.filter((k) => k !== key), days });
      }
    }
  }

  if (car.tax_due) {
    const days = daysUntil(car.tax_due, now);
    const key = `tax:${car.tax_due}`;
    if (days >= 0 && days <= TAX_WINDOW_DAYS && !sent[key]) due.push({ kind: "tax", key, alsoMark: [], days });
  }

  // Recall: only a rise against the count we stored last time. The first run
  // sets the baseline (see the cron), so a save never triggers a false "new".
  if (currentRecallCount != null && car.recall_count != null && currentRecallCount > car.recall_count) {
    const key = `recall:${currentRecallCount}`;
    if (!sent[key]) due.push({ kind: "recall", key, alsoMark: [] });
  }

  // Monthly value check, for owners who said selling / thinking about it.
  if (car.intent === "selling" || car.intent === "thinking") {
    const ageDays = (now.getTime() - Date.parse(car.created_at)) / DAY;
    const lastValue = Object.entries(sent)
      .filter(([k]) => k.startsWith("value:"))
      .map(([, at]) => Date.parse(at))
      .filter((t) => !Number.isNaN(t))
      .sort((a, b) => b - a)[0];
    const sinceLast = lastValue ? (now.getTime() - lastValue) / DAY : Infinity;
    const key = `value:${monthKey(now)}`;
    if (ageDays >= VALUE_INTERVAL_DAYS && sinceLast >= VALUE_INTERVAL_DAYS && !sent[key]) {
      due.push({ kind: "value", key, alsoMark: [] });
    }
  }

  return due;
}

export interface AlertMessage {
  title: string;
  body: string;
  /** Absolute URL. Plate in the fragment only. */
  url: string;
  cta: string;
  /** The `source` / `src` the link carries, for alert_open. */
  source: string;
}

const SITE = "https://www.freeplatecheck.co.uk";

/** "AB12CDE" -> "AB12 CDE" for display. */
export function displayPlate(vrm: string): string {
  return /^[A-Z]{2}\d{2}[A-Z]{3}$/.test(vrm) ? `${vrm.slice(0, 4)} ${vrm.slice(4)}` : vrm;
}

function niceName(car: SavedCarRow): string {
  const n = (car.make_model ?? "").trim();
  return n ? n.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : "your car";
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
}

/**
 * The words and the link for one alert. `source` names kind and channel
 * ("car-alert-mot-7-push") so the booking funnel and alert_open can tell
 * them apart; the booking hand-off turns a car-alert source into its own
 * BookMyGarage clickref (src/lib/booking.ts), separate from the reminder
 * emails'.
 */
export function alertMessage(alert: DueAlert, car: SavedCarRow, channel: SaveChannel): AlertMessage {
  const plate = displayPlate(car.vrm);
  const name = niceName(car);
  const source = `car-alert-${alert.kind.replace("_", "-")}-${channel}`;
  const hash = `#vrm=${car.vrm}`;
  switch (alert.kind) {
    case "mot_35":
    case "mot_7": {
      const days = alert.days ?? 0;
      const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
      return {
        title: `MOT due ${when} — ${plate}`,
        body:
          alert.kind === "mot_7"
            ? `${name}'s MOT runs out ${when}. Driving without one risks a fine and your insurance. Compare local garage prices and book now.`
            : `${name} is due its MOT ${when}. Test up to a month early and keep the renewal date — compare local garage prices and book.`,
        url: `${SITE}/booking?type=mot&source=${source}${hash}`,
        cta: "Compare prices and book",
        source,
      };
    }
    case "tax": {
      const days = alert.days ?? 0;
      const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `on ${formatDate(car.tax_due ?? "")}`;
      return {
        title: `Tax due ${when} — ${plate}`,
        body: `${name}'s vehicle tax is due ${when}. Tax it on GOV.UK, or check whether it's worth declaring SORN instead.`,
        url: `${SITE}/?src=${source}${hash}`,
        cta: "See this car's tax status",
        source,
      };
    }
    case "recall":
      return {
        title: `New safety recall — ${plate}`,
        body: `A new manufacturer recall has been issued that may affect ${name}. Recall work is free at a main dealer.`,
        url: `${SITE}/?src=${source}${hash}`,
        cta: "See the recall details",
        source,
      };
    case "value":
      return {
        title: `What's ${name} worth this month?`,
        body: `Prices move with the season and the market. Here's an updated free valuation for ${plate}, with no email needed.`,
        url: `${SITE}/value-my-car?src=${source}${hash}`,
        cta: "See its value now",
        source,
      };
  }
}

/**
 * The other end of `source`: "car-alert-mot-7-push" -> { kind: "mot_7",
 * channel: "push" }, and the welcome notification's "car-saved-push" ->
 * { kind: "saved", channel: "push" }. Anything else is not an alert link.
 */
export function parseAlertSource(value: string | null | undefined): { kind: string; channel: SaveChannel } | null {
  if (!value) return null;
  const m = value.match(/^car-(alert|saved)(?:-([a-z0-9-]+?))?-(push|email)$/);
  if (!m) return null;
  const kind = m[1] === "saved" ? "saved" : (m[2] ?? "").replace(/-/g, "_");
  if (!kind) return null;
  return { kind, channel: m[3] as SaveChannel };
}
