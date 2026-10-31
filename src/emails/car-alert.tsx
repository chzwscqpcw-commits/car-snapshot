import { Html, Body, Container, Preview } from "@react-email/components";
import { Action, Deck, Fine, Foot, Headline, Masthead, Plate, ReportHead, Vitals, page, sheet, type Vital } from "./components/report";

// One alert about a saved car: MOT due, tax due, a new recall, or the monthly
// value check. The cron builds the words (alertMessage in lib/car-alerts.ts);
// this is only the page, styled as the PDF report (components/report.tsx).

interface CarAlertProps {
  regNumber: string;
  /** The subject line, used for the preview text too. */
  title: string;
  /** The display headline: "{lead} <em>{accent}</em>". */
  lead?: string;
  accent?: string;
  body: string;
  cta: string;
  url: string;
  /** The vitals strip under the headline. */
  facts?: Vital[];
  /** An extra line under the button, e.g. the GOV.UK tax link. */
  note?: string;
  manageUrl: string;
  /** The running head's kicker, e.g. "MOT alert". */
  kicker?: string;
  /** The day it was sent, "1 Dec 2026", for the foot. */
  sentOn?: string;
}

export default function CarAlert({
  regNumber = "AB12CDE",
  title = "MOT due in 7 days — AB12 CDE",
  lead = "MOT due",
  accent = "in 7 days",
  body: bodyText = "Your Ford Focus's MOT runs out in 7 days. Compare local garage prices and book now.",
  cta = "Compare prices and book",
  url = "https://www.freeplatecheck.co.uk/booking?type=mot#vrm=AB12CDE",
  facts = [
    { label: "MOT due", value: "8 Dec 2026", sub: "7 days away", tone: "warn" },
    { label: "Car", value: "Ford Focus", sub: "2019" },
  ],
  note: noteText,
  manageUrl = "https://www.freeplatecheck.co.uk/api/unsubscribe?token=test",
  kicker = "MOT alert",
  sentOn,
}: CarAlertProps) {
  return (
    <Html lang="en">
      <ReportHead />
      <Preview>{title}</Preview>
      <Body style={page}>
        <Container style={sheet}>
          <Masthead kicker={kicker} />
          <Plate reg={regNumber} />
          <Headline lead={lead} accent={accent} />
          <Deck>{bodyText}</Deck>
          {facts.length > 0 && <Vitals items={facts} />}
          <Action href={url}>{cta}</Action>
          {noteText && <Fine>{noteText}</Fine>}
          <Foot stopUrl={manageUrl} date={sentOn} reason="You saved this car for alerts on freeplatecheck.co.uk." />
        </Container>
      </Body>
    </Html>
  );
}
