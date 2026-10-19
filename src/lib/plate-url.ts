"use client";

// Number plates in URLs live in the fragment — /mot-check#vrm=AB12CDE — not
// the query string.
//
// Why: a browser never sends the fragment to a server. With ?vrm= every plate
// a visitor checked landed in Vercel's request logs, in same-origin Referer
// headers (and from there in our own stored referrers), in RSC prefetch
// requests, and in front of crawlers. In the fragment it stays in the
// visitor's own browser — refresh, back/forward, bookmarks and shared links
// all still work, because the page reads it client-side.
//
// Old ?vrm= links (MOT reminder emails already sent, the embeddable widget on
// partner sites, bookmarks) keep working: readers accept the query form and
// immediately rewrite the address bar to the fragment form.

import { useEffect, useSyncExternalStore } from "react";

const PLATE_EVENT = "fpc:plate";

function clean(raw: string | null | undefined): string {
  return (raw ?? "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function isPlate(v: string): boolean {
  return v.length >= 2 && v.length <= 8;
}

/** `/mot-check` + `AB12 CDE` -> `/mot-check#vrm=AB12CDE`. Keeps any query. */
export function plateHref(path: string, vrm: string): string {
  const base = path.split("#")[0];
  const plate = clean(vrm);
  return plate ? `${base}#vrm=${plate}` : base;
}

/** The plate in the current address — fragment first, then legacy ?vrm=. */
export function readPlate(): string | null {
  if (typeof window === "undefined") return null;
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("vrm");
  const fromQuery = new URLSearchParams(window.location.search).get("vrm");
  const plate = clean(fromHash ?? fromQuery);
  return isPlate(plate) ? plate : null;
}

/**
 * If the plate arrived the old way (?vrm=), move it to the fragment without
 * a navigation, so it stops riding along on later requests and referrers.
 */
export function migrateLegacyPlateUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const legacy = clean(url.searchParams.get("vrm"));
  if (!legacy) return;
  url.searchParams.delete("vrm");
  url.hash = `vrm=${legacy}`;
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}

/** Tell plate readers on this page that the plate changed. */
export function announcePlateChange(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PLATE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener(PLATE_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(PLATE_EVENT, onChange);
  };
}

/** Run `cb` whenever the address's plate may have changed. Returns unsubscribe. */
export function onPlateChange(cb: () => void): () => void {
  return subscribe(cb);
}

/** The current plate, kept in sync with back/forward and in-page changes. */
export function usePlate(): string | null {
  const plate = useSyncExternalStore(subscribe, readPlate, () => null);
  useEffect(() => {
    migrateLegacyPlateUrl();
    // The head script hides landing content when a plate is present, to avoid
    // a flash before hydration. Keep the flag true to the current address.
    document.documentElement.toggleAttribute("data-plate", plate !== null);
  }, [plate]);
  return plate;
}

type Router = { push: (href: string) => void };

/**
 * Navigate to a plate result. A change of fragment on the SAME page fires no
 * navigation in Next's router, so we push the history entry ourselves and
 * announce it; a different page goes through the router as normal.
 */
export function goToPlate(router: Router, path: string, vrm: string): void {
  const href = plateHref(path, vrm);
  const targetPath = path.split(/[?#]/)[0] || "/";
  if (typeof window !== "undefined" && window.location.pathname === targetPath) {
    // Next.js integrates native pushState (null state is its documented form).
    window.history.pushState(null, "", href);
    announcePlateChange();
    window.scrollTo({ top: 0 });
    return;
  }
  router.push(href);
}
