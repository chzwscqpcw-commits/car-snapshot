'use client';

import { useState } from 'react';
import { PoundSterling, ChevronDown } from 'lucide-react';
import { PARTNER_LINKS, getPartnerRel } from '@/config/partners';
import { trackPartnerClick } from '@/lib/tracking';
import Button from '@/components/Button';

interface MOTBookingCTAProps {
  regNumber: string;
  context: 'expired' | 'due-soon' | 'reminder-set' | 'neutral';
  expandable?: boolean;
  /**
   * Where on the page this CTA renders. Used in the trackPartnerClick
   * click_context so the same component can appear in multiple slots
   * (e.g. Vehicle Specs section + Health & Safety section) and we can
   * measure which placement actually converts. Defaults to omitted so
   * existing call sites preserve their original click_context strings.
   */
  placement?:
    | 'specs'
    | 'health'
    | 'next-steps'
    | 'tax-check'
    | 'mot-check'
    | 'running-costs'
    | 'cheap-mot-mid'
    | 'cheap-mot-foot'
    | 'car-check'
    | 'mot-prices-town'
    | 'mot-reminder';
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

/**
 * Copy used when we DON'T pre-select the MOT (see `preselectMot` below). The
 * default `neutral` copy promises an MOT price; if the wizard is going to open
 * on the service picker instead, the heading has to say so. Landing someone on
 * a screen the button didn't promise is the same mismatch that flattened Step 3
 * before it was rebuilt to lead with the estimate.
 */
const OPEN_CHOICE_COPY = {
  heading: 'Book a service or MOT near you',
  body: 'Compare local garage prices for a service, an MOT, or both — many charge well below the £54.85 cap.',
};

/**
 * Placements that sit on MOT-topic pages, where the visitor arrived already
 * shopping for a test. These keep `type=mot` so the wizard opens at Step 3 with
 * the service settled — they're our best-converting sources (the town pages
 * reach Step 4 at 94%, /cheap-mot at 87%) and there is nothing to fix.
 */
const MOT_INTENT_PLACEMENTS = new Set<NonNullable<MOTBookingCTAProps['placement']>>([
  'cheap-mot-mid',
  'cheap-mot-foot',
  'mot-prices-town',
  'mot-check',
  'mot-reminder',
]);

export default function MOTBookingCTA({
  regNumber,
  context,
  expandable = false,
  placement,
}: MOTBookingCTAProps) {
  const [expanded, setExpanded] = useState(false);

  // Compose click_context. Without a placement we keep the legacy form
  // (`mot-booking-cta-<context>`) so historical dashboard rows stay
  // attributable to their existing surface.
  const clickContext = placement
    ? `mot-booking-cta-${placement}-${context}`
    : `mot-booking-cta-${context}`;

  // Route through our /booking wizard rather than directly to BookMyGarage.
  // The wizard pre-fills the reg, lets users confirm postcode/timing, then
  // hands off to BMG with our affiliate clickref intact at Step 4. Trade-off:
  // one extra screen on the user's side; gain: per-step funnel visibility,
  // service-type recommendation based on vehicle age, AND localised price
  // ranges before the BMG hand-off. The source param ties the eventual
  // commission back to this CTA placement when it lands in Awin.
  const partner = PARTNER_LINKS.bookMyGarage;
  const wizardSource = placement
    ? `mot_cta_${placement}_${context}`
    : `mot_cta_${context}`;

  // Whether to pre-select the MOT for the visitor.
  //
  // We used to hardcode `type=mot` on every link, which skipped Step 2 entirely
  // and booked the decision on the user's behalf. Two problems with that. It's
  // wrong for the reader — on the results page, `neutral` means the MOT is
  // valid and more than 60 days out, so we were pushing a test to someone who
  // doesn't need one, and that placement converts at 12% against 87–94% for the
  // sources that arrive genuinely shopping. And it's wrong for us: of the
  // visitors who do reach the picker and choose freely, 65% take a service
  // (42 vs 23 since 1 May), which pays 4–5x what an MOT does.
  //
  // So pre-select only where the MOT really is the product: when it's expired,
  // due within 60 days, or just had a reminder set, or when the CTA sits on an
  // MOT-topic page. Otherwise let Step 2 ask.
  //
  // Note this only changes behaviour for call sites that pass a registration —
  // in practice the results-page `health` placement. Without a reg the wizard
  // opens at Step 1 and routes through Step 2 regardless of this param.
  const motIsDue =
    context === 'expired' || context === 'due-soon' || context === 'reminder-set';
  const preselectMot = motIsDue || (placement ? MOT_INTENT_PLACEMENTS.has(placement) : true);

  const href = `/booking?vrm=${encodeURIComponent(regNumber)}${
    preselectMot ? '&type=mot' : ''
  }&source=${encodeURIComponent(wizardSource)}`;
  const rel = getPartnerRel(partner);

  const { heading, body } = preselectMot ? COPY[context] : OPEN_CHOICE_COPY;

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

      {/* CTA button — internal nav to the booking wizard (no target=_blank).
          trackPartnerClick still fires so partner_click attribution flows;
          the BMG hand-off (with clickref) happens at the end of the wizard
          via Step 4, so commission tracking is preserved end-to-end. */}
      <div className="ml-8">
        <Button
          href={href}
          rel={rel}
          onClick={() => trackPartnerClick('bookMyGarage', clickContext)}
          className="w-full sm:w-auto"
        >
          Compare prices near {formattedReg} →
        </Button>
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
        <span>
          {preselectMot
            ? 'See MOT test prices at garages near you'
            : 'See service and MOT prices at garages near you'}
        </span>
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
