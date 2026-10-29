"use client";

import { Clock } from "lucide-react";
import { goLink, type GoContext } from "@/config/partners";
import { previewOffer, tempCoverOffer } from "@/config/insurance";
import { useSeenOnce } from "@/components/InsuranceCTA";

interface TempInsuranceCTAProps {
  /** Placement, passed on as click_context and the network's sub-ID. */
  context: GoContext;
  /** Headline override for context-specific framing */
  headline?: string;
  /** Body copy override */
  body?: string;
  /** Preview page only: render with the first-choice partner even while it's pending. */
  preview?: boolean;
  className?: string;
}

/**
 * Temporary (hourly/daily) car insurance, on pages where someone is about to
 * test-drive a car, drive one home or borrow one. Tempcover first (RVU, on
 * Rakuten), Cuvva (Awin) as the fallback — whichever is live; nothing while
 * neither is. Clicks go through /go, as InsuranceCTA's do.
 */
export default function TempInsuranceCTA({
  context,
  headline = "Need to drive a car for a few hours or days?",
  body,
  preview = false,
  className = "",
}: TempInsuranceCTAProps) {
  const offer = preview ? previewOffer("temporary") : tempCoverOffer();
  const cardRef = useSeenOnce(offer && !preview ? offer.partnerKey : null, context);
  if (!offer) return null;

  return (
    <div
      ref={cardRef}
      className={`rounded-xl border border-blue-800/40 bg-gradient-to-br from-blue-950/30 to-slate-900/30 p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <Clock className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-white">{headline}</h3>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4 ml-8">
        {body ??
          "Temporary cover insures a car by the hour or the day: for a test drive, driving a car home before your annual policy starts, or borrowing a friend's car."}
      </p>

      <div className="ml-8">
        <a
          href={preview ? "#" : goLink(offer.go, context)}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="inline-flex w-full sm:w-auto items-center justify-center px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Get temporary cover with {offer.partner.name} &#8599;
        </a>
      </div>

      <p className="text-xs text-slate-500 mt-3 ml-8">Free Plate Check may earn a small commission from this link.</p>
    </div>
  );
}
