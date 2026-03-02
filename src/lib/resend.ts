const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "MOT Reminders <reminders@freeplatecheck.co.uk>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("resend_error:", res.status, body);
      return { ok: false, error: `Resend API ${res.status}` };
    }

    const json = await res.json();
    return { ok: true, id: json.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("resend_fetch_error:", message);
    return { ok: false, error: message };
  }
}
