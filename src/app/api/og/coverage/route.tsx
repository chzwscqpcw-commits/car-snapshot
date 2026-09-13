export const runtime = "nodejs";

import { ImageResponse } from "next/og";
import { OGBrandFrame, ogSize } from "@/lib/og-image";
import {
  estimateGarageDensity,
  formatPriceRange,
  priceRangeFor,
  resolveRegion,
  serviceLabel,
  type ServiceType,
} from "@/lib/booking";

/**
 * The link-preview card for a shared booking area.
 *
 * This exists because `opengraph-image.tsx` receives `params` but never
 * `searchParams`, so a per-postcode card cannot be generated from the route
 * convention. `generateMetadata` on /booking points `og:image` here instead.
 *
 * What's on it is deliberately the AREA, never the vehicle. A link carrying
 * someone's registration and their home postcode identifies a household and a
 * car, and this is a link built to be pasted into group chats. The share
 * action strips the reg and keeps only the outcode — a district of thousands
 * of homes rather than a street.
 *
 * Uses the same OGBrandFrame as every other shared link on the site, so a
 * booking area looks like part of the family rather than a different product.
 */

const ALLOWED: ServiceType[] = ["mot", "interim", "full", "diagnostic"];

/** Outcode only: 1-2 letters, a digit, optionally one more letter or digit. */
const OUTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?$/;

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  const outcode = (params.get("pc") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  const rawService = (params.get("type") ?? "mot").toLowerCase();
  const service: ServiceType = ALLOWED.includes(rawService as ServiceType)
    ? (rawService as ServiceType)
    : "mot";

  // A card for an unrecognisable area is just the generic card.
  if (!OUTCODE_RE.test(outcode)) {
    return new ImageResponse(
      (
        <OGBrandFrame>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              Book an MOT or service near you
            </div>
            <div style={{ display: "flex", fontSize: 26, color: "#94a3b8", marginTop: 24 }}>
              Compare local garage prices in seconds. Free, no signup.
            </div>
          </div>
        </OGBrandFrame>
      ),
      { ...ogSize },
    );
  }

  const region = resolveRegion(outcode);
  const garages = estimateGarageDensity(outcode);
  // No vehicle in a shared link, by design — medium petrol is the middle of
  // the range and the card says "typical" rather than quoting a specific car.
  const price = priceRangeFor(service, "medium_petrol", region);
  const isMot = service === "mot";

  return new ImageResponse(
    (
      <OGBrandFrame>
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          {/* The coverage ring, same geometry as the page. Abstract on
              purpose: we hold no garage locations, so nothing here claims a
              specific garage sits at a specific place.
              
              The plate is an HTML overlay rather than SVG <text> because
              Satori — the engine behind ImageResponse — refuses text nodes
              inside SVG outright ("please convert them to <path>"). Shapes are
              fine; letters are not. */}
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 260,
              height: 260,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="260" height="260" viewBox="0 0 300 300" style={{ position: "absolute", top: 0, left: 0 }}>
              <circle cx="150" cy="150" r="124" fill="rgba(34, 211, 238, 0.10)" />
              <circle cx="150" cy="150" r="124" fill="none" stroke="#22D3EE" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="6 6" />
              <circle cx="150" cy="150" r="70" fill="none" stroke="#22D3EE" strokeOpacity="0.7" strokeWidth="2" />
            </svg>
            <div
              style={{
                display: "flex",
                background: "#FFD400",
                color: "#101317",
                fontSize: 26,
                fontWeight: 700,
                padding: "6px 16px",
                borderRadius: 6,
                border: "2px solid #020617",
                letterSpacing: "0.04em",
              }}
            >
              {outcode}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={{ display: "flex", fontSize: 24, color: "#64748b", letterSpacing: "0.08em" }}>
              {serviceLabel(service).toUpperCase()} · {region.label.toUpperCase()}
            </div>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#6ee7b7", marginTop: 12, letterSpacing: "-0.02em" }}>
              {formatPriceRange(price)}
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#f1f5f9", marginTop: 18 }}>
              near {outcode} · {garages.label} partner garages within 10 miles
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#94a3b8", marginTop: 14 }}>
              {isMot
                ? "The legal maximum is £54.85 — many garages charge less"
                : "Typical range for this area. Compare live quotes free."}
            </div>
          </div>
        </div>
      </OGBrandFrame>
    ),
    { ...ogSize },
  );
}
