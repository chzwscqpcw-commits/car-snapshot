import { Wrench } from "lucide-react";
import { PARTNER_LINKS, getPartnerRel } from "@/config/partners";

/**
 * Subtle, in-article MOT-booking prompt (BookMyGarage affiliate) for MOT-related
 * blog posts. Designed to sit partway through the article — early enough to
 * catch readers without scrolling to the end, but woven in rather than shouted.
 *
 * Server-rendered (no JS): the `clickref` flows into the Awin link so booking
 * conversions can be attributed to this exact placement in the Awin dashboard
 * (e.g. compare "blog-mot-inline" vs "blog-mot-foot").
 */
export default function MotBookingInline({ clickref }: { clickref: string }) {
  const partner = PARTNER_LINKS.bookMyGarage;
  const href = partner.buildLink ? partner.buildLink("", clickref) : partner.url;

  return (
    <div className="max-w-[700px] mx-auto my-8 flex items-start gap-3 rounded-lg border border-blue-800/40 bg-blue-950/20 px-4 py-3">
      <Wrench className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
      <p className="text-sm text-slate-300 leading-relaxed">
        <span className="text-slate-200 font-medium">In a hurry?</span> You can compare MOT prices at local garages and book online in minutes —{" "}
        <a
          href={href}
          target="_blank"
          rel={getPartnerRel(partner)}
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
        >
          see quotes on BookMyGarage →
        </a>
      </p>
    </div>
  );
}
