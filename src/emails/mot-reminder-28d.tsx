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
  color: "#f59e0b",
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
  border: "1px dashed #374151",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const affiliateHeading: React.CSSProperties = {
  color: "#e5e5e5",
  fontSize: "14px",
  fontWeight: 600,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0 0 8px",
};

const affiliateLink: React.CSSProperties = {
  color: "#10b981",
  fontSize: "14px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
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

interface MOTReminder28dProps {
  make: string;
  model: string;
  regNumber: string;
  expiryDate: string;
  daysRemaining: number;
  bmgAffiliateUrl: string;
  unsubscribeUrl: string;
}

export default function MOTReminder28d({
  make = "FORD",
  model = "FOCUS",
  regNumber = "AB12CDE",
  expiryDate = "15/04/2026",
  daysRemaining = 28,
  bmgAffiliateUrl = "#",
  unsubscribeUrl = "https://freeplatecheck.co.uk/api/unsubscribe?token=test",
}: MOTReminder28dProps) {
  const reportUrl = `https://freeplatecheck.co.uk/?vrm=${encodeURIComponent(regNumber)}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{`Your MOT is due in ${daysRemaining} days — book early for the best price.`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Header />
          <Section style={content}>
            <Text style={heading}>Your MOT is due soon</Text>
            <Text style={subtext}>
              The MOT for your {make} {model} ({regNumber}) expires on {expiryDate}.
            </Text>
            <InfoCard>
              <Text style={labelStyle}>Days Remaining</Text>
              <Text style={{ ...valueStyle, color: "#f59e0b", fontSize: "28px" }}>
                {daysRemaining} days
              </Text>
              <Text style={labelStyle}>MOT Expiry Date</Text>
              <Text style={{ ...valueStyle, margin: "0" }}>{expiryDate}</Text>
            </InfoCard>

            <Section style={affiliateCard}>
              <Text style={affiliateHeading}>Compare MOT prices at local garages</Text>
              <Link href={bmgAffiliateUrl} style={affiliateLink}>
                BookMyGarage &rarr;
              </Link>
              <Text style={disclaimer}>
                Free Plate Check may earn a commission from partner links.
              </Text>
            </Section>

            <CTAButton href={reportUrl}>View full vehicle report</CTAButton>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  );
}
