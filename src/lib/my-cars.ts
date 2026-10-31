"use client";

/**
 * The browser's side of "My Cars": the local list the homepage tab reads
 * (fpc-my-vehicles, unchanged since 2026-05) and a memory of which cars have
 * alerts switched on, so the save card shows "Alerts on" on a later visit
 * instead of asking again. Both are per-device conveniences; the server row
 * is the record.
 */

import type { SaveChannel, SaveIntent } from "@/lib/saved-cars";

const MY_CARS_KEY = "fpc-my-vehicles";
const ALERTS_KEY = "fpc-car-alerts";
const CHANGE_EVENT = "fpc:car-alerts";

export interface LocalCar {
  registrationNumber: string;
  make?: string;
  model?: string;
  variant?: string;
  motExpiryDate?: string;
  taxDueDate?: string;
  [key: string]: unknown;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Is this car already in the local My Cars list? */
export function isLocalCar(vrm: string): boolean {
  if (typeof window === "undefined") return false;
  const list = read<LocalCar[]>(MY_CARS_KEY, []);
  return Array.isArray(list) && list.some((c) => c?.registrationNumber === vrm);
}

/**
 * Add a car to the local list (front of the list, replacing an older copy),
 * exactly as the homepage's "My Car" button does. Returns the new length.
 */
export function addLocalCar(car: LocalCar): number {
  if (typeof window === "undefined") return 0;
  const list = read<LocalCar[]>(MY_CARS_KEY, []);
  const kept = Array.isArray(list) ? list.filter((c) => c?.registrationNumber !== car.registrationNumber) : [];
  const updated = [{ ...car, addedAt: Date.now() }, ...kept];
  try {
    localStorage.setItem(MY_CARS_KEY, JSON.stringify(updated));
  } catch {
    // Storage full or blocked: the server save still goes ahead.
  }
  return updated.length;
}

export interface AlertsMemory {
  channel: SaveChannel;
  intent: SaveIntent | null;
  at: number;
}

type AlertsMap = Record<string, AlertsMemory>;

/** The alerts this device switched on for a car, if any. */
export function alertsFor(vrm: string): AlertsMemory | null {
  if (typeof window === "undefined") return null;
  const map = read<AlertsMap>(ALERTS_KEY, {});
  const entry = map && typeof map === "object" ? map[vrm] : undefined;
  return entry && typeof entry === "object" && typeof entry.channel === "string" ? entry : null;
}

export function rememberAlerts(vrm: string, memory: Omit<AlertsMemory, "at">): void {
  if (typeof window === "undefined") return;
  const map = read<AlertsMap>(ALERTS_KEY, {});
  const next: AlertsMap = { ...(map && typeof map === "object" ? map : {}), [vrm]: { ...memory, at: Date.now() } };
  try {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
  } catch {
    // Nothing to do: the card will just ask again next visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Run `cb` when alerts are switched on for any car on this page. */
export function onAlertsChange(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
