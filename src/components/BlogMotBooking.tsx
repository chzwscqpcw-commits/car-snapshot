"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PoundSterling, Search } from "lucide-react";
import Button from "@/components/Button";
import { trackEvent } from "@/lib/tracking";
import { formatSaving, motPriceBand } from "@/lib/booking";
import {
  BLOG_MOT_SOURCE,
  blogMotBookingHref,
  cleanReg,
  looksLikeReg,
  type BlogMotPlacement,
} from "@/lib/blog-mot-booking";

/**
 * The MOT prompt in a blog article: a registration box that opens our own
 * booking tool at the price step. `inline` is the card after the first
 * section; `foot` is the one-line version under the article.
 *
 * It replaces a card and a text link that went straight to the garage-booking
 * partner (why, and the numbers it is measured against, are in
 * `src/lib/blog-mot-booking.ts`). Modelled on `MotPriceFinder`, the box on
 * /cheap-mot, which is the entry the tool converts best from.
 *
 * Measurement, all under the placement's `source`:
 *   - `booking_entry_impression` once, when half the box is on screen (the
 *     same standard as `usePartnerImpression`, so it compares with the old
 *     card's `partner_impression`);
 *   - `booking_entry_click` when it is used, with `has_reg`;
 *   - the wizard's own `booking_wizard_start` and step events carry the same
 *     `source` from the address.
 * `post` is the article's slug. No event carries the registration.
 */
export default function BlogMotBooking({
  placement,
  post,
}: {
  placement: BlogMotPlacement;
  post: string;
}) {
  const router = useRouter();
  const source = BLOG_MOT_SOURCE[placement];
  const [reg, setReg] = useState("");
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const cap = formatSaving(motPriceBand().max);

  useEffect(() => {
    const node = boxRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        trackEvent("booking_entry_impression", { source, post });
      },
      { threshold: 0.5 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [source, post]);

  function used(hasReg: boolean) {
    trackEvent("booking_entry_click", { source, post, has_reg: hasReg });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const cleaned = cleanReg(reg);
    if (cleaned && !looksLikeReg(cleaned)) {
      setError("That doesn’t look like a valid UK registration");
      return;
    }
    setError("");
    // An empty box still goes through, to the same price step without a car:
    // someone who taps "compare" wants prices, not a telling-off.
    used(Boolean(cleaned));
    router.push(blogMotBookingHref(placement, cleaned));
  }

  const inline = placement === "inline";

  const form = (
    <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row sm:items-start" noValidate>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          type="text"
          value={reg}
          onChange={(e) => {
            setReg(e.target.value.toUpperCase());
            setError("");
          }}
          placeholder="Enter reg, e.g. AB12 CDE"
          maxLength={10}
          aria-label="Vehicle registration"
          aria-invalid={error ? true : undefined}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          // 16px: anything smaller and iOS zooms the page when the box is tapped.
          className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 font-mono text-base uppercase tracking-widest text-white placeholder:font-sans placeholder:text-sm placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <Button type="submit">
        <PoundSterling className="h-4 w-4" aria-hidden="true" />
        {inline ? "Compare MOT prices" : "Compare prices"}
      </Button>
    </form>
  );

  const noReg = (
    <Link
      href={blogMotBookingHref(placement, "")}
      prefetch={false}
      onClick={() => used(false)}
      className="text-emerald-300 underline underline-offset-2 transition-colors hover:text-emerald-200"
    >
      {inline ? "See MOT prices without it" : "Carry on without it"}
    </Link>
  );

  if (!inline) {
    return (
      <div
        ref={boxRef}
        data-blog-mot-booking={placement}
        className="max-w-[700px] mx-auto mt-12 rounded-r-lg border-l-2 border-emerald-500/60 bg-emerald-950/20 px-4 py-4"
      >
        <p className="mb-3 text-sm text-slate-300">
          <span className="font-medium text-slate-100">Need to book an MOT?</span> Enter your reg
          to compare prices at garages near you.
        </p>
        {form}
        {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
        <p className="mt-2.5 text-xs text-slate-400">No reg to hand? {noReg}.</p>
      </div>
    );
  }

  return (
    <div
      ref={boxRef}
      data-blog-mot-booking={placement}
      className="max-w-[700px] mx-auto my-8 rounded-xl border border-emerald-700/40 bg-gradient-to-r from-emerald-900/25 to-cyan-900/25 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2">
        <PoundSterling className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
        <p className="text-base font-bold text-slate-100">Compare MOT prices near you</p>
      </div>
      <p className="mt-1.5 mb-3.5 text-sm leading-relaxed text-slate-300">
        Enter your reg to see what garages near you charge for an MOT. Many beat the {cap} legal
        maximum. Free, no signup.
      </p>
      {form}
      {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
      <p className="mt-3 text-xs text-slate-400">No reg to hand? {noReg}.</p>
      <p className="mt-1.5 text-xs text-slate-500">
        No booking fee. Free Plate Check may earn a small commission if you book.
      </p>
    </div>
  );
}
