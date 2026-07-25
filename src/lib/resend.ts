import { Resend } from "resend";

const FROM_ADDRESS = "MOT Reminders <reminders@freeplatecheck.co.uk>";
// Internal / operational mail (audit reports to the founder) — same verified
// domain, plainer sender name, no subscriber unsubscribe headers.
const INTERNAL_FROM = "Free Plate Check <reminders@freeplatecheck.co.uk>";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  _resend = new Resend(apiKey);
  return _resend;
}

interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  react: React.ReactElement;
  unsubscribeUrl: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  unsubscribeUrl,
}: SendEmailParams): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      react,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (error) {
      console.error("resend_error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("resend_send_error:", message);
    return { ok: false, error: message };
  }
}

interface SendInternalEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a plain-HTML operational email to ourselves (e.g. the weekly visitor
 * audit). No List-Unsubscribe headers — this is internal, not a subscriber
 * mailing.
 */
export async function sendInternalEmail({
  to,
  subject,
  html,
}: SendInternalEmailParams): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: INTERNAL_FROM,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("resend_internal_error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("resend_internal_send_error:", message);
    return { ok: false, error: message };
  }
}
