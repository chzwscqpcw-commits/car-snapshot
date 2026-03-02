import { PARTNER_LINKS } from "@/config/partners";

interface ReminderEmailParams {
  vrm: string;
  makeModel: string;
  expiryDate: string; // ISO date
  daysRemaining: number;
  unsubscribeToken: string;
}

function formatDateDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function buildMotReminderEmail({
  vrm,
  makeModel,
  expiryDate,
  daysRemaining,
  unsubscribeToken,
}: ReminderEmailParams): { subject: string; html: string } {
  const isUrgent = daysRemaining <= 7;
  const accentColor = isUrgent ? "#dc2626" : "#d97706"; // red or amber
  const accentBg = isUrgent ? "#fef2f2" : "#fffbeb";
  const formattedExpiry = formatDateDDMMYYYY(expiryDate);
  const bmgLink = PARTNER_LINKS.bookMyGarage.buildLink!(vrm);
  const reportLink = `https://freeplatecheck.co.uk/?vrm=${encodeURIComponent(vrm)}`;
  const unsubscribeLink = `https://freeplatecheck.co.uk/api/unsubscribe?token=${unsubscribeToken}`;

  const urgencyText = isUrgent
    ? `Your MOT expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}!`
    : `Your MOT expires in ${daysRemaining} days`;

  const subject = isUrgent
    ? `⚠️ MOT expires in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} — ${vrm}`
    : `MOT reminder: ${vrm} expires ${formattedExpiry}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MOT Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;">

<!-- Header -->
<tr><td style="background-color:#0f172a;padding:20px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:#ffffff;font-size:20px;font-weight:bold;">Free Plate Check</td>
<td align="right" style="color:#94a3b8;font-size:13px;">MOT Reminder</td>
</tr>
</table>
</td></tr>

<!-- Urgency Banner -->
<tr><td style="background-color:${accentBg};padding:16px 24px;border-bottom:2px solid ${accentColor};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:${accentColor};font-size:18px;font-weight:bold;">${urgencyText}</td>
</tr>
</table>
</td></tr>

<!-- Vehicle Details -->
<tr><td style="padding:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:6px;padding:16px;">
<tr><td style="padding:16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Vehicle</td>
</tr>
<tr>
<td style="color:#0f172a;font-size:16px;font-weight:bold;padding-bottom:12px;">${makeModel}</td>
</tr>
<tr>
<td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Registration</td>
</tr>
<tr>
<td style="color:#0f172a;font-size:16px;font-weight:bold;padding-bottom:12px;">${vrm}</td>
</tr>
<tr>
<td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">MOT Expiry Date</td>
</tr>
<tr>
<td style="color:${accentColor};font-size:16px;font-weight:bold;">${formattedExpiry}</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- CTA: Book MOT -->
<tr><td style="padding:0 24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${bmgLink}" target="_blank" style="display:inline-block;background-color:#06b6d4;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:6px;text-align:center;">
Book your MOT now
</a>
</td></tr>
<tr><td align="center" style="padding-top:8px;color:#94a3b8;font-size:12px;">
Compare prices at local garages via BookMyGarage
</td></tr>
</table>
</td></tr>

<!-- Secondary CTA -->
<tr><td style="padding:0 24px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${reportLink}" target="_blank" style="display:inline-block;color:#06b6d4;font-size:14px;text-decoration:underline;">
View full vehicle report &rarr;
</a>
</td></tr>
</table>
</td></tr>

<!-- Tips -->
<tr><td style="padding:0 24px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border-radius:6px;">
<tr><td style="padding:16px;">
<p style="margin:0 0 8px;color:#0369a1;font-size:14px;font-weight:bold;">Quick tips</p>
<p style="margin:0 0 4px;color:#475569;font-size:13px;">&#8226; Book early to get the best price and time slot</p>
<p style="margin:0 0 4px;color:#475569;font-size:13px;">&#8226; You can get your MOT done up to a month early without losing your expiry date</p>
<p style="margin:0;color:#475569;font-size:13px;">&#8226; Check advisories from your last MOT — they may need attention</p>
</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="color:#94a3b8;font-size:11px;line-height:1.5;">
<p style="margin:0 0 8px;">You're receiving this because you signed up for MOT reminders on <a href="https://freeplatecheck.co.uk" style="color:#94a3b8;">freeplatecheck.co.uk</a>.</p>
<p style="margin:0 0 8px;">The BookMyGarage link is an affiliate link — we may earn a small commission at no extra cost to you.</p>
<p style="margin:0;"><a href="${unsubscribeLink}" style="color:#94a3b8;">Unsubscribe from MOT reminders</a></p>
</td></tr>
</table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}

interface ConfirmationEmailParams {
  vrm: string;
  makeModel: string;
  expiryDate: string;
  unsubscribeToken: string;
}

export function buildConfirmationEmail({
  vrm,
  makeModel,
  expiryDate,
  unsubscribeToken,
}: ConfirmationEmailParams): { subject: string; html: string } {
  const formattedExpiry = formatDateDDMMYYYY(expiryDate);
  const reportLink = `https://freeplatecheck.co.uk/?vrm=${encodeURIComponent(vrm)}`;
  const unsubscribeLink = `https://freeplatecheck.co.uk/api/unsubscribe?token=${unsubscribeToken}`;

  const subject = `MOT reminder confirmed — ${vrm}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MOT Reminder Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;">

<!-- Header -->
<tr><td style="background-color:#0f172a;padding:20px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:#ffffff;font-size:20px;font-weight:bold;">Free Plate Check</td>
<td align="right" style="color:#94a3b8;font-size:13px;">Confirmation</td>
</tr>
</table>
</td></tr>

<!-- Confirmation Banner -->
<tr><td style="background-color:#f0fdf4;padding:16px 24px;border-bottom:2px solid #22c55e;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:#15803d;font-size:18px;font-weight:bold;">MOT reminder set!</td>
</tr>
</table>
</td></tr>

<!-- Details -->
<tr><td style="padding:24px;">
<p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
You&rsquo;ll receive two email reminders for <strong>${makeModel}</strong> (${vrm}):
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:6px;">
<tr><td style="padding:16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">MOT Expiry Date</td>
</tr>
<tr>
<td style="color:#0f172a;font-size:16px;font-weight:bold;padding-bottom:12px;">${formattedExpiry}</td>
</tr>
<tr>
<td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Reminders</td>
</tr>
<tr>
<td style="color:#0f172a;font-size:14px;padding-bottom:4px;">&#8226; 28 days before expiry</td>
</tr>
<tr>
<td style="color:#0f172a;font-size:14px;">&#8226; 7 days before expiry</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 24px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${reportLink}" target="_blank" style="display:inline-block;background-color:#06b6d4;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:6px;">
View full vehicle report
</a>
</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="color:#94a3b8;font-size:11px;line-height:1.5;">
<p style="margin:0 0 8px;">You signed up for MOT reminders on <a href="https://freeplatecheck.co.uk" style="color:#94a3b8;">freeplatecheck.co.uk</a>.</p>
<p style="margin:0;"><a href="${unsubscribeLink}" style="color:#94a3b8;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}
