import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
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
  borderRadius: "0",
};

const content: React.CSSProperties = {
  backgroundColor: "#111111",
  padding: "32px 32px 8px",
};

const heading: React.CSSProperties = {
  color: "#10b981",
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

const bulletText: React.CSSProperties = {
  color: "#f5f5f5",
  fontSize: "15px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  lineHeight: "1.6",
  margin: "0 0 4px",
};

interface MOTReminderSetProps {
  make: string;
  model: string;
  regNumber: string;
  expiryDate: string;
  unsubscribeUrl: string;
}

export default function MOTReminderSet({
  make = "FORD",
  model = "FOCUS",
  regNumber = "AB12CDE",
  expiryDate = "15/04/2026",
  unsubscribeUrl = "https://freeplatecheck.co.uk/api/unsubscribe?token=test",
}: MOTReminderSetProps) {
  const reportUrl = `https://freeplatecheck.co.uk/?vrm=${encodeURIComponent(regNumber)}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>MOT reminder confirmed for {regNumber} — we&apos;ll email you before it expires.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Header />
          <Section style={content}>
            <Text style={heading}>MOT reminder set!</Text>
            <Text style={subtext}>
              You&apos;ll receive two email reminders for {make} {model} ({regNumber}):
            </Text>
            <InfoCard>
              <Text style={labelStyle}>MOT Expiry Date</Text>
              <Text style={valueStyle}>{expiryDate}</Text>
              <Text style={{ ...labelStyle, marginBottom: "8px" }}>Reminders</Text>
              <Text style={bulletText}>&bull; 28 days before expiry</Text>
              <Text style={{ ...bulletText, margin: "0" }}>&bull; 7 days before expiry</Text>
            </InfoCard>
            <CTAButton href={reportUrl}>View full vehicle report</CTAButton>
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
        </Container>
      </Body>
    </Html>
  );
}
