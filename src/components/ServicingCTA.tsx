'use client';

import { Wrench } from 'lucide-react';
import { PARTNER_LINKS, getPartnerRel } from '@/config/partners';
import { trackPartnerClick } from '@/lib/tracking';

interface ServicingCTAProps {
  regNumber?: string;
  context?: 'generic' | 'post-lookup' | 'landing';
}

const COPY: Record<
  NonNullable<ServicingCTAProps['context']>,
  { heading: string; body: string }
> = {
  generic: {
    heading: 'Compare car service prices near you',
    body: 'Get instant quotes from local garages. Compare prices for interim and full services — no obligation.',
  },
  'post-lookup': {
    heading: 'Due a service? Compare prices in seconds',
    body: "We've pre-loaded your registration. Add your postcode to see service quotes from nearby garages.",
  },
  landing: {
    heading: 'Find the best service price near you',
    body: 'Enter your reg and postcode to compare quotes from trusted local garages. No obligation, no booking fees.',
  },
};

export default function ServicingCTA({
  regNumber = '',
  context = 'generic',
}: ServicingCTAProps) {
  const { heading, body } = COPY[context];
  const partner = PARTNER_LINKS.bookMyGarageService;
  const href = regNumber && partner.buildLink
    ? partner.buildLink(regNumber)
    : partner.url;
  const rel = getPartnerRel(partner);
  const formattedReg = regNumber.toUpperCase();

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <Wrench className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
        <h3 className="text-lg font-semibold text-white">{heading}</h3>
      </div>

      <p className="text-sm text-slate-300 mb-4 ml-8">{body}</p>

      <div className="ml-8">
        <a
          href={href}
          target="_blank"
          rel={rel}
          onClick={() => trackPartnerClick('bookMyGarageService', `servicing-cta-${context}`)}
          className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {regNumber
            ? `Compare service prices for ${formattedReg} — BookMyGarage ↗`
            : 'Compare service prices — BookMyGarage ↗'}
        </a>
      </div>

      <p className="text-xs text-slate-500 mt-3 ml-8">
        Free comparison · No booking fee · Quotes from local garages
      </p>
      <p className="text-xs text-slate-500 mt-3 ml-8">
        Free Plate Check may earn a small commission from this link.
      </p>
    </div>
  );
}
