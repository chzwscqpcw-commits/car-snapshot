export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { PARTNER_LINKS, isPartnerConfigured } from "@/config/partners";
import { supabaseServer } from "@/lib/supabaseServer";
import { isBotRequest, isSpeculativeRequest } from "@/lib/bots";

/**
 * Tracked outbound redirect for affiliate links written inline in blog prose.
 *
 * Component CTAs fire `trackPartnerClick` from the browser before navigating.
 * A link inside a markdown paragraph can't — so those clicks were invisible in
 * `site_events`, and every one of them shared a single `sub2=blog` bucket with
 * no per-post detail. This route restores both: it records the click
 * server-side (which also survives ad-blockers, unlike the beacon) and rebuilds
 * the tracker URL from `partners.ts`, so a link pasted into a post months ago
 * still picks up the current tracking parameters.
 *
 * It also refuses to redirect crawlers. That is the point: /go/* is
 * `nofollow`ed in the HTML and disallowed in robots.txt, but neither binds a
 * crawler that ignores them, and an unhonoured redirect is a real click in the
 * partner's dashboard. See `src/lib/bots.ts`.
 *
 * Rewriting happens in `rewriteAffiliateLinks` (src/lib/affiliateLinks.ts);
 * the `partner` keys accepted here must match `REDIRECT_HOSTS` there.
 */

/** Allowlist. Never redirect to a partner key an attacker can supply. */
const GO_PARTNERS: Record<string, { partnerKey: keyof typeof PARTNER_LINKS }> = {
  carvertical: { partnerKey: "carVertical" },
  // The three BookMyGarage destinations that appear in post prose. Each is a
  // separate partner key in PARTNER_LINKS with its own `ued`, so the reader
  // lands on the same page the hand-written link pointed at.
  bookmygarage: { partnerKey: "bookMyGarage" },
  "bookmygarage-service": { partnerKey: "bookMyGarageService" },
  "bookmygarage-repair": { partnerKey: "bookMyGarageRepair" },
};

/** Post slugs are our own; keep the value tight before it reaches a URL. */
function sanitiseSlug(raw: string | null): string {
  if (!raw) return "";
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64);
}

/**
 * Placement tag from a component CTA. Same shape as a slug — the value decides
 * `sub2`, so anything arriving here is bounded to the character set and length
 * the partner's dashboard can hold. A junk value can only ever create a junk
 * placement row, never escape into the URL.
 */
function sanitiseContext(raw: string | null): string {
  if (!raw) return "";
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 48);
}

/** Plate for the partner's sub3 pre-fill; A-Z and digits only. */
function sanitiseVrm(raw: string | null): string {
  if (!raw) return "";
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function hashIp(ip: string): string {
  const salt = process.env.VRM_SALT || "change-me";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ partner: string }> },
) {
  const { partner } = await params;
  const entry = GO_PARTNERS[partner?.toLowerCase() ?? ""];

  const home = new URL("/", req.url);
  if (!entry) return NextResponse.redirect(home, 302);

  const link = PARTNER_LINKS[entry.partnerKey];
  if (!link || !isPartnerConfigured(link)) return NextResponse.redirect(home, 302);

  const url = new URL(req.url);
  const slug = sanitiseSlug(url.searchParams.get("post"));
  const ctxParam = sanitiseContext(url.searchParams.get("ctx"));
  const vrm = sanitiseVrm(url.searchParams.get("vrm"));

  // `blog-inline-<slug>` is both our own click_context and the clickref the
  // partner link is built from, so the two series join on one value. The
  // `blog-` prefix keeps it inside the existing sub2="blog" bucket that the
  // partner already reports on, while the slug rides in sub3 for per-post
  // detail — continuity preserved, granularity gained.
  //
  // `ctx` carries a component placement's own tag through unchanged, so a CTA
  // routed through here keeps the exact context (and therefore the exact sub2)
  // it had when it linked straight out. `post` still wins for the prose links
  // already published in rendered HTML.
  const context = slug ? `blog-inline-${slug}` : ctxParam || "blog-inline";

  // Crawlers, scrapers and speculative browser prefetches get a 204: no
  // redirect, so the partner's tracker is never hit and no click is banked.
  // Deliberately not a 403 — a bot seeing an error may retry.
  const ua = req.headers.get("user-agent");
  if (isBotRequest(ua) || isSpeculativeRequest(req.headers)) {
    return new NextResponse(null, {
      status: 204,
      headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
    });
  }

  const destination = link.buildLink ? link.buildLink(vrm, context) : link.url;

  // Record the click, but never let telemetry cost the user their click —
  // if Supabase is slow or erroring we still redirect.
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const { error } = await supabaseServer()
      .from("site_events")
      .insert({
        event_type: "partner_click",
        metadata: {
          partner_id: entry.partnerKey,
          click_context: context,
          via: "go_redirect",
        },
        ip_hash: ip !== "unknown" ? hashIp(ip) : null,
      });
    if (error) {
      console.error(`[go/${partner}] insert failed:`, error.code, error.message);
    }
  } catch (err) {
    console.error(
      `[go/${partner}] tracking threw:`,
      err instanceof Error ? err.message : String(err),
    );
  }

  return NextResponse.redirect(destination, {
    status: 302,
    headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
  });
}
