export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { supabaseServer, supabaseServerRole } from "@/lib/supabaseServer";

/**
 * Contact form endpoint.
 *
 * Anti-spam layers (each cheap, combined effective):
 *  1. Honeypot field "website" — a hidden input bots fill but humans don't see.
 *  2. Time-on-page floor (≥2 s between form mount and submit).
 *  3. Min message length (20 chars) + email regex.
 *  4. IP rate limit: max 3 submissions per IP per hour (via Supabase).
 *  5. Email rate limit: max 1 submission per email per 10 minutes.
 *
 * One-time Supabase setup — paste into the SQL editor:
 *
 *   create table public.contact_messages (
 *     id uuid primary key default gen_random_uuid(),
 *     created_at timestamptz not null default now(),
 *     name text,
 *     email text not null,
 *     category text not null,
 *     message text not null,
 *     ip_hash text not null,
 *     user_agent text,
 *     delivered boolean not null default false
 *   );
 *   create index contact_messages_ip_idx on public.contact_messages(ip_hash, created_at desc);
 *   create index contact_messages_email_idx on public.contact_messages(email, created_at desc);
 *
 * Reply-To is set to the sender so clicking Reply in Gmail goes to them directly.
 */

const TO_ADDRESS = "stephengaisford@gmail.com";
const FROM_ADDRESS = "Free Plate Check <contact@freeplatecheck.co.uk>";

const ALLOWED_CATEGORIES = new Set([
  "general",
  "bug",
  "feature",
  "business",
  "buy-this-site",
]);

const CATEGORY_LABELS: Record<string, string> = {
  general: "General question",
  bug: "Bug report",
  feature: "Feature idea",
  business: "Business / partnership",
  "buy-this-site": "Buying this site",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  _resend = new Resend(apiKey);
  return _resend;
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const category = typeof body.category === "string" ? body.category : "general";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const honeypot = typeof body.website === "string" ? body.website.trim() : "";
  const timeOnPage = typeof body.timeOnPage === "number" ? body.timeOnPage : 0;

  // ─── Spam gates ───
  if (honeypot.length > 0) {
    // Pretend it worked so bots don't probe further
    return NextResponse.json({ ok: true });
  }
  if (timeOnPage < 2000) {
    return NextResponse.json({ ok: true });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (message.length < 20) {
    return NextResponse.json(
      { error: "Please write a slightly longer message (20+ characters)." },
      { status: 400 }
    );
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Message too long — please keep it under 2,000 characters." },
      { status: 400 }
    );
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const userAgent = req.headers.get("user-agent")?.slice(0, 240) ?? null;

  // Rate-limit reads use the anon client (read-only against indexed cols
  // is fine even with RLS enabled). Inserts use the service-role client
  // so they bypass RLS — the contact_messages table is RLS-protected
  // because the anon key is public-facing and we don't want anyone to be
  // able to spam-insert directly via the Supabase REST API.
  const sb = supabaseServer();
  const sbWrite = supabaseServerRole();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  try {
    const { count: ipCount } = await sb
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", hourAgo);
    if ((ipCount ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Too many messages from your network — try again in an hour." },
        { status: 429 }
      );
    }

    const { count: emailCount } = await sb
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", tenMinsAgo);
    if ((emailCount ?? 0) >= 1) {
      return NextResponse.json(
        { error: "We've just received a message from this email — give us a few minutes." },
        { status: 429 }
      );
    }
  } catch (err) {
    // If Supabase is down, fail open — Resend itself has rate-limits and
    // we'd rather let a real message through than block everything.
    console.error("[contact] rate-limit check failed:", err);
  }

  // ─── Persist ───
  // Insert errors used to be silently swallowed (the email would still go,
  // but no row would land — exactly how the contact_messages count stayed at
  // 0 unnoticed for weeks). Now we surface the error so the user gets a
  // clear failure and the operator sees the problem immediately.
  let messageId: string | null = null;
  try {
    const { data, error } = await sbWrite
      .from("contact_messages")
      .insert({
        name: name || null,
        email,
        category,
        message,
        ip_hash: ipHash,
        user_agent: userAgent,
      })
      .select("id")
      .single();
    if (error) throw error;
    messageId = data?.id ?? null;
  } catch (err) {
    console.error("[contact] insert failed:", err);
    return NextResponse.json(
      { error: "We couldn't save your message — please try again in a moment." },
      { status: 500 },
    );
  }

  // ─── Email ───
  const resend = getResend();
  if (!resend) {
    console.error("[contact] RESEND_API_KEY missing — cannot send");
    return NextResponse.json(
      { error: "Email service unavailable — please try again later." },
      { status: 503 }
    );
  }

  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const subject = `[FPC Contact] ${categoryLabel}${name ? ` — ${name}` : ""}`;
  const sentAt = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const textBody = [
    `Category: ${categoryLabel}`,
    `From: ${name || "(no name)"}`,
    `Email: ${email}`,
    `Sent: ${sentAt} (London)`,
    messageId ? `ID: ${messageId}` : "",
    "",
    "─".repeat(40),
    "",
    message,
    "",
    "─".repeat(40),
    `IP hash: ${ipHash}`,
    userAgent ? `UA: ${userAgent}` : "",
    "",
    `Reply directly to this email to respond to the sender.`,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlBody = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
  <div style="padding:18px 22px;background:#0f172a;color:#f8fafc;">
    <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#67e8f9;">Free Plate Check · Contact</div>
    <div style="margin-top:4px;font-size:17px;font-weight:600;">${escapeHtml(categoryLabel)}</div>
  </div>
  <div style="padding:20px 22px;">
    <table style="width:100%;font-size:13px;color:#475569;border-collapse:collapse;">
      <tr><td style="padding:2px 0;width:80px;color:#94a3b8;">From</td><td style="color:#0f172a;font-weight:500;">${escapeHtml(name || "(no name)")}</td></tr>
      <tr><td style="padding:2px 0;color:#94a3b8;">Email</td><td><a href="mailto:${escapeHtml(email)}" style="color:#0891b2;text-decoration:none;">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:2px 0;color:#94a3b8;">Sent</td><td>${escapeHtml(sentAt)} (London)</td></tr>
    </table>
    <div style="margin-top:16px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;line-height:1.55;color:#0f172a;white-space:pre-wrap;">${escapeHtml(message)}</div>
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Reply directly to this email — Reply-To is set to ${escapeHtml(email)}.</p>
  </div>
  <div style="padding:12px 22px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
    IP hash: ${ipHash}${userAgent ? `<br>UA: ${escapeHtml(userAgent)}` : ""}
  </div>
</div>
</body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: TO_ADDRESS,
      subject,
      replyTo: email,
      text: textBody,
      html: htmlBody,
    });
    if (error) {
      console.error("[contact] resend error:", error);
      return NextResponse.json(
        { error: "Couldn't deliver your message — please try again." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[contact] resend exception:", err);
    return NextResponse.json(
      { error: "Couldn't deliver your message — please try again." },
      { status: 502 }
    );
  }

  // Mark as delivered (best-effort) — needs the service-role client because
  // RLS would block the anon client's UPDATE the same way it blocked INSERT.
  if (messageId) {
    sbWrite
      .from("contact_messages")
      .update({ delivered: true })
      .eq("id", messageId)
      .then(
        () => {},
        () => {}
      );
  }

  return NextResponse.json({ ok: true });
}
