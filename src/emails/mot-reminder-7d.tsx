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

const heading: React.CSSProperties = {
  color: "#ef4444",
  fontSize: "24px",
  fontWeight: 600,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0 0 8px",
  lineHeight: "1.3",
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
  border: "1px solid #374151",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const affiliateHeading: React.CSSProperties = {
  color: "#e5e5e5",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0 0 8px",
};

const affiliateLink: React.CSSProperties = {
  color: "#10b981",
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

interface MOTReminder7dProps {
  make: string;
  model: string;
  regNumber: string;
  expiryDate: string;
  daysRemaining: number;
  bmgAffiliateUrl: string;
  unsubscribeUrl: string;
}

export default function MOTReminder7d({
  make = "FORD",
  model = "FOCUS",
  regNumber = "AB12CDE",
  expiryDate = "15/04/2026",
  daysRemaining = 7,
  bmgAffiliateUrl = "#",
  unsubscribeUrl = "https://freeplatecheck.co.uk/api/unsubscribe?token=test",
}: MOTReminder7dProps) {
  const reportUrl = `https://freeplatecheck.co.uk/?vrm=${encodeURIComponent(regNumber)}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{`Your MOT expires in ${daysRemaining} days — book now to avoid driving illegally.`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Header />
          <Section style={content}>
            <Text style={heading}>Your MOT expires next week</Text>
            <Text style={subtext}>
              The MOT for your {make} {model} ({regNumber}) expires on {expiryDate}. Book now to avoid driving without a valid MOT.
            </Text>
            <InfoCard>
              <Text style={labelStyle}>Days Remaining</Text>
              <Text style={{ ...valueStyle, color: "#ef4444", fontSize: "28px" }}>
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
              </Text>
              <Text style={labelStyle}>MOT Expiry Date</Text>
              <Text style={{ ...valueStyle, margin: "0" }}>{expiryDate}</Text>
            </InfoCard>

            <Section style={affiliateCard}>
              <Text style={affiliateHeading}>Compare MOT prices near you</Text>
              <Link href={bmgAffiliateUrl} style={affiliateLink}>
                BookMyGarage &rarr;
              </Link>
              <Text style={disclaimer}>
                Free Plate Check may earn a commission from partner links.
              </Text>
            </Section>

            <CTAButton href={reportUrl}>View full vehicle report</CTAButton>

            <Text style={legalNote}>
              Driving without a valid MOT can result in a fine of up to &pound;1,000.
            </Text>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  );
}
