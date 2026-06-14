import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Preview,
} from "@react-email/components";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { InfoCard, labelStyle, valueStyle } from "./components/InfoCard";
import { CTAButton } from "./components/CTAButton";
import { EmailRegPlate } from "./components/RegPlate";

const body: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0",
  padding: "0",
};

const container: React.CSSProperties = {
  backgroundColor: "#111111",
  maxWidth: "600px",
  margin: "0 auto",
};

const content: React.CSSProperties = {
  backgroundColor: "#111111",
  padding: "32px 32px 8px",
};

const subtext: React.CSSProperties = {
  color: "#e5e5e5",
  fontSize: "15px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const affiliateCard: React.CSSProperties = {
  backgroundColor: "#1a1a2e",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const affiliateHeading: React.CSSProperties = {
  color: "#e5e5e5",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0 0 4px",
};

const affiliateBody: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "13px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  lineHeight: "1.5",
  margin: "0 0 10px",
};

const affiliateLink: React.CSSProperties = {
  color: "#06b6d4",
  fontSize: "15px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  fontWeight: 600,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const disclaimer: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "8px 0 0",
  lineHeight: "1.4",
};

const legalNote: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  lineHeight: "1.5",
  margin: "0 0 8px",
  fontStyle: "italic",
};

interface MOTReminderDueProps {
  make: string;
  model: string;
  regNumber: string;
  expiryDate: string;
  daysRemaining: number;
  bmgAffiliateUrl: string;
  unsubscribeUrl: string;
}

/**
 * One parametric reminder email for any lead time. Tone adapts to urgency:
 *   - urgent (<= 7 days): red, legal warning, "book now"
 *   - early (> 7 days): amber, "test early and keep your renewal date"
 * Every variant sells the value: we help you book, often below the £54.85 cap.
 */
export default function MOTReminderDue({
  make = "FORD",
  model = "FOCUS",
  regNumber = "AB12CDE",
  expiryDate = "15/04/2026",
  daysRemaining = 35,
  bmgAffiliateUrl = "#",
  unsubscribeUrl = "https://freeplatecheck.co.uk/api/unsubscribe?token=test",
}: MOTReminderDueProps) {
  const reportUrl = `https://freeplatecheck.co.uk/?vrm=${encodeURIComponent(regNumber)}`;
  const urgent = daysRemaining <= 7;
  const accent = urgent ? "#ef4444" : "#f59e0b";

  const heading: React.CSSProperties = {
    color: accent,
    fontSize: "24px",
    fontWeight: 600,
    fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
    margin: "0 0 8px",
    lineHeight: "1.3",
  };

  const headingText = urgent ? "Your MOT expires this week" : "Time to book your MOT";
  const preview = urgent
    ? `Your MOT expires in ${daysRemaining} days — book now to stay legal.`
    : `Your MOT is due in ${daysRemaining} days — book early, keep your renewal date, and pay less.`;
  const intro = urgent
    ? `The MOT for your ${make} ${model} expires on ${expiryDate}. Book now to avoid driving without a valid MOT.`
    : `The MOT for your ${make} ${model} is due on ${expiryDate}. You can get it tested now and keep the same renewal date — so booking early costs you nothing and often saves you money.`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Header />
          <Section style={content}>
            <EmailRegPlate reg={regNumber} />
            <Text style={heading}>{headingText}</Text>
            <Text style={subtext}>{intro}</Text>
            <InfoCard>
              <Text style={labelStyle}>Days Remaining</Text>
              <Text style={{ ...valueStyle, color: accent, fontSize: "28px" }}>
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
              </Text>
              <Text style={labelStyle}>MOT Expiry Date</Text>
              <Text style={{ ...valueStyle, margin: "0" }}>{expiryDate}</Text>
            </InfoCard>

            <Section style={{ ...affiliateCard, border: urgent ? "1px solid #374151" : "1px dashed #374151" }}>
              <Text style={affiliateHeading}>Book your MOT — and compare prices first</Text>
              <Text style={affiliateBody}>
                We&apos;ve pre-loaded {regNumber}. Local garages often charge well below the
                &pound;54.85 legal maximum — compare and book in a couple of taps.
              </Text>
              <Link href={bmgAffiliateUrl} style={affiliateLink}>
                Compare MOT prices &amp; book &rarr;
              </Link>
              <Text style={disclaimer}>
                Free Plate Check may earn a commission from partner links, at no cost to you.
              </Text>
            </Section>

            <CTAButton href={reportUrl}>View full vehicle report</CTAButton>

            {urgent && (
              <Text style={legalNote}>
                Driving without a valid MOT can result in a fine of up to &pound;1,000 and can
                invalidate your insurance.
              </Text>
            )}
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  );
}
