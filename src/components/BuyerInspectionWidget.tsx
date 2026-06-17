"use client";

import { useState } from "react";
import { Car, Wrench, Check, ArrowUpRight, Star } from "lucide-react";
import ClickMechanicLogo from "@/components/ClickMechanicLogo";
import { PARTNER_LINKS, getPartnerRel, isPartnerConfigured } from "@/config/partners";
import { trackPartnerClick } from "@/lib/tracking";

const CM = "#3c93f7";
const partner = PARTNER_LINKS.clickMechanic;

const CHECKS = [
  "Engine & under the bonnet",
  "Road test by a real mechanic",
  "Bodywork & crash-repair signs",
  "Brakes, tyres & safety items",
];

/**
 * Inline results-page widget that asks whether the visitor is *buying* this car,
 * and only reveals the ClickMechanic pre-purchase-inspection offer if they are.
 * Segments buyers from owners so the pitch never bothers people checking their
 * own car, and the CTA lands only on genuine buyer intent. The reveal expands
 * the offer with the inspection checklist ticking in one by one.
 */
export default function BuyerInspectionWidget({
  regNumber,
  context = "results-buyer-inspection",
  preview = false,
}: {
  regNumber?: string;
  context?: string;
  preview?: boolean;
}) {
  const [answer, setAnswer] = useState<null | "buyer" | "owner">(null);
  const [postcode, setPostcode] = useState("");
  if (!preview && !isPartnerConfigured(partner)) return null;

  // ClickMechanic skips data entry only when it has BOTH reg + postcode; the
  // postcode field is optional, so without it the user just lands on the entry
  // form (no worse off). Recomputed each render as the postcode is typed.
  const href = partner.buildLink
    ? partner.buildLink(regNumber ?? "", context, postcode.trim() || undefined)
    : partner.url;
  const open = answer === "buyer";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
      {/* Question row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${CM}1f` }}
          >
            <Car className="h-5 w-5" style={{ color: CM }} />
          </span>
          <div>
            <p className="font-semibold text-white">Thinking of buying this car?</p>
            <p className="text-xs text-slate-400">
              Get a mechanic&apos;s eyes on it before you pay.
            </p>
          </div>
        </div>

        {answer === null && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnswer("buyer")}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: CM }}
            >
              Yes, I&apos;m considering it
            </button>
            <button
              type="button"
              onClick={() => setAnswer("owner")}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              It&apos;s mine
            </button>
          </div>
        )}

        {answer === "owner" && (
          <button
            type="button"
            onClick={() => setAnswer(null)}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            Got it — back to your report
          </button>
        )}
      </div>

      {/* Reveal */}
      <div
        className={`grid transition-all duration-500 ease-out ${
          open ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className="rounded-lg border p-4"
            style={{ borderColor: `${CM}55`, backgroundColor: `${CM}10` }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <Wrench className="h-3.5 w-3.5" style={{ color: CM }} /> Pre-purchase
                inspection
              </span>
              <ClickMechanicLogo className="text-xs" />
            </div>

            <p className="mt-2 text-lg font-bold text-white">
              Have it checked over <span style={{ color: CM }}>from £79</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              A vetted mechanic travels to the car and sends you a full report — so you
              buy, haggle, or walk away knowing the truth.
            </p>

            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {CHECKS.map((c, i) => (
                <li
                  key={c}
                  className={`flex items-center gap-2 text-sm text-slate-200 transition-all duration-300 ${
                    open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                  }`}
                  style={{ transitionDelay: open ? `${i * 80 + 200}ms` : "0ms" }}
                >
                  <Check className="h-4 w-4 shrink-0" style={{ color: CM }} />
                  {c}
                </li>
              ))}
            </ul>

            {/* Optional location postcode — when supplied, ClickMechanic skips
                data entry and lands the user straight on inspection options.
                Left blank, they just land on the entry form (no worse off). */}
            <div className="mt-4">
              <label htmlFor="cm-postcode" className="mb-1.5 block text-xs text-slate-400">
                Postcode where the car is{" "}
                <span className="text-slate-500">(optional — speeds up your quote)</span>
              </label>
              <input
                id="cm-postcode"
                type="text"
                autoComplete="postal-code"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. GU4 2JT"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-[#3c93f7] focus:outline-none sm:max-w-xs"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <a
                href={href}
                target="_blank"
                rel={getPartnerRel(partner)}
                onClick={() => trackPartnerClick("clickMechanic", context)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
                style={{ backgroundColor: CM }}
              >
                Book an inspection <ArrowUpRight className="h-4 w-4" />
              </a>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4.8 ·
                24,000+ Trustpilot reviews
              </span>
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              Inspections are carried out by ClickMechanic. We may earn a commission — it
              never costs you more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
