import { Html, Head, Body, Container, Section, Text, Preview } from "@react-email/components";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { InfoCard, labelStyle, valueStyle } from "./components/InfoCard";
import { CTAButton } from "./components/CTAButton";
import { EmailRegPlate } from "./components/RegPlate";

// Sent once, when a car is saved with email alerts. Confirms what will be
// sent and when, and carries the only "stop alerts" link the owner has.

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
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: 700,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0 0 12px",
  textAlign: "center" as const,
};

const subtext: React.CSSProperties = {
  color: "#e5e5e5",
  fontSize: "15px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

interface CarSavedProps {
  regNumber: string;
  makeModel: string | null;
  /** dd/mm/yyyy, or null when DVLA holds no date. */
  motExpiry: string | null;
  taxDue: string | null;
  /** The alerts sentence from alertsDescription(). */
  alerts: string;
  manageUrl: string;
}

export default function CarSaved({
  regNumber = "AB12CDE",
  makeModel = "FORD FOCUS",
  motExpiry = "15/04/2027",
  taxDue = "01/03/2027",
  alerts = "5 weeks and 1 week before the MOT is due, when the tax is due, and if a recall is issued",
  manageUrl = "https://www.freeplatecheck.co.uk/api/unsubscribe?token=test",
}: CarSavedProps) {
  // Plate in the fragment: the browser never sends it to a server.
  const carUrl = `https://www.freeplatecheck.co.uk/#vrm=${regNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`;
  return (
    <Html lang="en">
      <Head />
      <Preview>Alerts are on for {regNumber}. We&apos;ll email you when something about it changes.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Header />
          <Section style={content}>
            <EmailRegPlate reg={regNumber} />
            <Text style={heading}>Alerts on{makeModel ? ` for your ${makeModel}` : ""}</Text>
            <Text style={subtext}>We&apos;ll email you {alerts}. Nothing else, and never marketing.</Text>
            <InfoCard>
              <Text style={labelStyle}>MOT due</Text>
              <Text style={valueStyle}>{motExpiry ?? "No date held — we'll tell you when one appears"}</Text>
              <Text style={labelStyle}>Tax due</Text>
              <Text style={{ ...valueStyle, margin: "0" }}>{taxDue ?? "No date held"}</Text>
            </InfoCard>
            <CTAButton href={carUrl}>See this car&apos;s full check</CTAButton>
          </Section>
          <Footer unsubscribeUrl={manageUrl} reason="You saved this car for alerts on" />
        </Container>
      </Body>
    </Html>
  );
}
