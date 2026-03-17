'use client';

import { useState } from 'react';
import { PoundSterling, ChevronDown } from 'lucide-react';
import { PARTNER_LINKS, getPartnerRel } from '@/config/partners';
import { trackPartnerClick } from '@/lib/tracking';

interface MOTBookingCTAProps {
  regNumber: string;
  context: 'expired' | 'due-soon' | 'reminder-set' | 'neutral';
  expandable?: boolean;
}

const COPY: Record<
  MOTBookingCTAProps['context'],
  { heading: string; body: string }
> = {
  expired: {
    heading: 'Book your MOT at a competitive price',
    body: 'The legal maximum is £54.85 — many garages charge less. Compare prices at local garages.',
  },
  'due-soon': {
    heading: 'MOT tests can cost less than £54.85',
    body: 'Compare prices at local garages — many charge well below the legal maximum.',
  },
  'reminder-set': {
    heading: "While you're here — check prices for your test",
    body: "We've pre-loaded your registration. Just add your postcode to see local garage prices.",
  },
  neutral: {
    heading: 'Save money on your MOT',
    body: 'The legal maximum for an MOT test is £54.85 — but many garages charge less. Compare prices in seconds.',
  },
};

export default function MOTBookingCTA({
  regNumber,
  context,
  expandable = false,
}: MOTBookingCTAProps) {
  const [expanded, setExpanded] = useState(false);
  const { heading, body } = COPY[context];

  const partner = PARTNER_LINKS.bookMyGarage;
  const href = partner.buildLink
    ? partner.buildLink(regNumber)
    : partner.url;
  const rel = getPartnerRel(partner);

  const formattedReg = regNumber.toUpperCase();

  const content = (
    <div className="p-5">
      {/* Heading */}
      <div className="flex items-start gap-3 mb-3">
        <PoundSterling className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
        <h3 className="text-lg font-semibold text-white">{heading}</h3>
      </div>

      {/* Body copy */}
      <p className="text-sm text-slate-300 mb-4 ml-8">{body}</p>

      {/* CTA button */}
      <div className="ml-8">
        <a
          href={href}
          target="_blank"
          rel={rel}
          onClick={() => trackPartnerClick('bookMyGarage', `mot-booking-cta-${context}`)}
          className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Compare prices near {formattedReg} — BookMyGarage ↗
        </a>
      </div>

      {/* Trust signals */}
      <p className="text-xs text-slate-500 mt-3 ml-8">
        Free comparison · No booking fee · Prices from local garages
      </p>

      {/* Affiliate disclaimer */}
      <p className="text-xs text-slate-500 mt-3 ml-8">
        Free Plate Check may earn a small commission from this link.
      </p>
    </div>
  );

  if (!expandable) {
    return (
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl">
      {/* Collapsed toggle */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 w-full px-5 py-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <PoundSterling className="h-4 w-4 shrink-0" />
        <span>See MOT test prices at garages near you</span>
        <ChevronDown
          className={`h-4 w-4 ml-auto transition-transform duration-300 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? 'max-h-[500px]' : 'max-h-0'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
