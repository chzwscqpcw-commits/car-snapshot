import { Html, Body, Container, Link, Preview } from "@react-email/components";
import { Action, Deck, Fine, Foot, Headline, Masthead, Plate, ReportHead, SOFT, Vitals, page, sheet } from "./components/report";

// One reminder email for any lead time, styled as the PDF report
// (components/report.tsx). The tone follows the urgency: inside a week the
// date is red and the legal line appears; earlier it is amber and the pitch
// is "test early and keep the renewal date". Either way the action is the
// booking link, which is how the reminder pays for itself.

interface MOTReminderDueProps {
  make: string;
  model: string;
  regNumber: string;
  /** "15 Apr 2027". */
  expiryDate: string;
  daysRemaining: number;
  bmgAffiliateUrl: string;
  unsubscribeUrl: string;
  /** The day it was sent, "1 Dec 2026", for the foot. */
  sentOn?: string;
  /** Where the plate image is; the inline attachment unless a preview says otherwise. */
  plateSrc?: string;
}

export default function MOTReminderDue({
  make = "FORD",
  model = "FOCUS",
  regNumber = "AB12CDE",
  expiryDate = "15 Apr 2027",
  daysRemaining = 35,
  bmgAffiliateUrl = "#",
  unsubscribeUrl = "https://freeplatecheck.co.uk/api/unsubscribe?token=test",
  sentOn,
  plateSrc,
}: MOTReminderDueProps) {
  // www host (no redirect hop), plate in the fragment — never sent to a server.
  const reportUrl = `https://www.freeplatecheck.co.uk/#vrm=${regNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`;
  const urgent = daysRemaining <= 7;
  const name = `${make} ${model}`.trim().toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const plateText = /^[A-Z]{2}\d{2}[A-Z]{3}$/i.test(regNumber) ? `${regNumber.slice(0, 4)} ${regNumber.slice(4)}`.toUpperCase() : regNumber;
  const when = daysRemaining <= 0 ? "today" : daysRemaining === 1 ? "tomorrow" : `in ${daysRemaining} days`;
  const preview = urgent
    ? `Your MOT runs out ${when} — book now to stay legal.`
    : `Your MOT is due ${when} — book early, keep your renewal date, and pay less.`;
  const intro = urgent
    ? `Your ${name}'s MOT runs out on ${expiryDate}. Book now: driving without one risks a fine and your insurance.`
    : `Your ${name}'s MOT is due on ${expiryDate}. Have it tested now and you keep the same renewal date, so booking early costs nothing and often saves money.`;

  return (
    <Html lang="en">
      <ReportHead />
      <Preview>{preview}</Preview>
      <Body style={page}>
        <Container style={sheet}>
          <Masthead kicker="MOT reminder" />
          <Plate reg={regNumber} src={plateSrc} />
          <Headline lead="MOT due" accent={when} />
          <Deck>{intro}</Deck>
          <Vitals
            items={[
              { label: "MOT due", value: expiryDate, sub: daysRemaining <= 0 ? "Today" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} away`, tone: urgent ? "risk" : "warn" },
              { label: "Car", value: name },
            ]}
          />
          <Action href={bmgAffiliateUrl}>Compare prices and book</Action>
          <Fine>
            We&apos;ve pre-loaded {plateText}. Local garages often charge well below the &pound;54.85 legal maximum.
            {urgent ? " Driving without a valid MOT can mean a fine of up to £1,000 and can invalidate your insurance." : ""}{" "}
            Or{" "}
            <Link href={reportUrl} style={{ color: SOFT, textDecoration: "underline", textUnderlineOffset: "2px" }}>
              see this car&apos;s full check
            </Link>
            . Free Plate Check may earn a commission from the booking link, at no cost to you.
          </Fine>
          <Foot stopUrl={unsubscribeUrl} date={sentOn} reason="You set an MOT reminder for this car on freeplatecheck.co.uk." stopLabel="Stop reminders for this car" />
        </Container>
      </Body>
    </Html>
  );
}
