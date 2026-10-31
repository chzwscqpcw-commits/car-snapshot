import webpush from "web-push";

/**
 * Sending web push. The VAPID pair is the server's identity to the browser
 * vendors' push services; both halves come from Vercel env (generated once
 * with `npx web-push generate-vapid-keys`, never stored in the repo).
 * Without them push is simply off: the card never offers it and the cron
 * skips push rows.
 */

export interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  /** Replaces an earlier notification with the same tag instead of stacking. */
  tag?: string;
  /** The stop-alerts link, offered as a notification action. */
  stop?: string;
}

let configured: boolean | null = null;

export function pushConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (configured = false);
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@freeplatecheck.co.uk", pub, priv);
    configured = true;
  } catch (err) {
    console.error("push_vapid_config_error:", err instanceof Error ? err.message : err);
    configured = false;
  }
  return configured;
}

export type PushResult = { ok: true } | { ok: false; gone: boolean; error: string };

/**
 * Send one notification. `gone` means the push service no longer knows the
 * subscription (404/410: permission revoked, browser reinstalled) and the row
 * should be retired rather than retried.
 */
export async function sendPush(sub: PushSubscriptionRow, payload: PushPayload): Promise<PushResult> {
  if (!pushConfigured()) return { ok: false, gone: false, error: "push not configured" };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 24 * 60 * 60, urgency: "normal" },
    );
    return { ok: true };
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, gone: status === 404 || status === 410, error: `${status ?? "?"} ${message}`.trim() };
  }
}
