import { Html, Head, Body, Container, Section, Text, Preview } from "@react-email/components";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CTAButton } from "./components/CTAButton";
import { EmailRegPlate } from "./components/RegPlate";

// One template for every saved-car alert (MOT due, tax due, a new recall,
// the monthly value check): the words come from src/lib/car-alerts.ts so
// email and push always say the same thing.

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

const note: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "13px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

interface CarAlertProps {
  regNumber: string;
  title: string;
  body: string;
  cta: string;
  url: string;
  /** An extra line under the button, e.g. the GOV.UK tax link. */
  note?: string;
  manageUrl: string;
}

export default function CarAlert({
  regNumber = "AB12CDE",
  title = "MOT due in 7 days — AB12 CDE",
  body: bodyText = "Your Ford Focus's MOT runs out in 7 days. Compare local garage prices and book now.",
  cta = "Compare prices and book",
  url = "https://www.freeplatecheck.co.uk/booking?type=mot#vrm=AB12CDE",
  note: noteText,
  manageUrl = "https://www.freeplatecheck.co.uk/api/unsubscribe?token=test",
}: CarAlertProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{bodyText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Header />
          <Section style={content}>
            <EmailRegPlate reg={regNumber} />
            <Text style={heading}>{title}</Text>
            <Text style={subtext}>{bodyText}</Text>
            <CTAButton href={url}>{cta}</CTAButton>
            {noteText && <Text style={note}>{noteText}</Text>}
          </Section>
          <Footer unsubscribeUrl={manageUrl} reason="You saved this car for alerts on" />
        </Container>
      </Body>
    </Html>
  );
}
