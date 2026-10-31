import { Html, Body, Container, Preview } from "@react-email/components";
import { Action, Deck, Foot, Headline, Masthead, Plate, ReportHead, Vitals, page, sheet } from "./components/report";

// Sent once, when a car is saved with email alerts. Confirms what will be sent
// and when, and carries the only "stop alerts" link the owner has. Styled as
// the first page of the PDF report (components/report.tsx).

interface CarSavedProps {
  regNumber: string;
  makeModel: string | null;
  /** "8 Dec 2026", or null when DVLA holds no date. */
  motExpiry: string | null;
  taxDue: string | null;
  /** The alerts sentence from alertsDescription(). */
  alerts: string;
  manageUrl: string;
  /** The day it was sent, "31 Oct 2026", for the foot. */
  sentOn?: string;
}

export default function CarSaved({
  regNumber = "AB12CDE",
  makeModel = "FORD FOCUS",
  motExpiry = "15 Apr 2027",
  taxDue = "1 Mar 2027",
  alerts = "5 weeks and 1 week before the MOT is due, when the tax is due, and if a recall is issued",
  manageUrl = "https://www.freeplatecheck.co.uk/api/unsubscribe?token=test",
  sentOn,
}: CarSavedProps) {
  // Plate in the fragment: the browser never sends it to a server.
  const carUrl = `https://www.freeplatecheck.co.uk/#vrm=${regNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`;
  const name = makeModel ? makeModel.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : null;
  return (
    <Html lang="en">
      <ReportHead />
      <Preview>Alerts are on for {regNumber}. We&apos;ll email you when something about it changes.</Preview>
      <Body className="fpc-page" style={page}>
        <Container className="fpc-sheet" style={sheet}>
          <Masthead kicker="Alerts on" />
          <Plate reg={regNumber} />
          <Headline lead="Alerts" accent="on" tail={name ? `for your ${name}` : "for this car"} />
          <Deck>We&apos;ll email you {alerts}. Nothing else, and never marketing.</Deck>
          <Vitals
            items={[
              { label: "MOT due", value: motExpiry ?? "No date", sub: motExpiry ? "5 weeks and 1 week before" : "We'll say when one appears", tone: motExpiry ? "ink" : "warn" },
              { label: "Tax due", value: taxDue ?? "No date", sub: taxDue ? "A week before" : "Not held by DVLA", tone: taxDue ? "ink" : "warn" },
              { label: "Alerts by", value: "Email", sub: "Stop any time" },
            ]}
          />
          <Action href={carUrl}>See this car&apos;s full check</Action>
          <Foot stopUrl={manageUrl} date={sentOn} reason="You saved this car for alerts on freeplatecheck.co.uk." />
        </Container>
      </Body>
    </Html>
  );
}
