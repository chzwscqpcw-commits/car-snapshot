import { Resend } from "resend";

const FROM_ADDRESS = "MOT Reminders <reminders@freeplatecheck.co.uk>";

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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const resend = new Resend(apiKey);

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
