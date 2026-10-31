import { Html, Body, Container, Preview } from "@react-email/components";
import { Action, Deck, Foot, Headline, Masthead, Plate, ReportHead, Vitals, page, sheet } from "./components/report";
import { DEFAULT_OFFSETS, offsetLabel } from "@/lib/mot-reminders";

// Sent once, when an MOT reminder is set. Says when the reminders will come
// and carries the only "stop" link the owner has. Styled as the PDF report
// (components/report.tsx), like the saved-car emails.

interface MOTReminderSetProps {
  make: string;
  model: string;
  regNumber: string;
  /** "15 Apr 2027". */
  expiryDate: string;
  offsets?: number[];
  unsubscribeUrl: string;
  /** The day it was sent, "31 Oct 2026", for the foot. */
  sentOn?: string;
  /** Where the plate image is; the inline attachment unless a preview says otherwise. */
  plateSrc?: string;
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export default function MOTReminderSet({
  make = "FORD",
  model = "FOCUS",
  regNumber = "AB12CDE",
  expiryDate = "15 Apr 2027",
  offsets = DEFAULT_OFFSETS,
  unsubscribeUrl = "https://freeplatecheck.co.uk/api/unsubscribe?token=test",
  sentOn,
  plateSrc,
}: MOTReminderSetProps) {
  // www host (no redirect hop), plate in the fragment — never sent to a server.
  const reportUrl = `https://www.freeplatecheck.co.uk/#vrm=${regNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`;
  const sorted = [...offsets].sort((a, b) => b - a);
  const when = joinWords(sorted.map(offsetLabel));
  const name = `${make} ${model}`.trim().toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

  return (
    <Html lang="en">
      <ReportHead />
      <Preview>MOT reminder set for {regNumber}. We&apos;ll email you {when} before it runs out.</Preview>
      <Body style={page}>
        <Container style={sheet}>
          <Masthead kicker="Reminder set" />
          <Plate reg={regNumber} src={plateSrc} />
          <Headline lead="Reminder" accent="set" tail={`for your ${name}`} />
          <Deck>
            We&apos;ll email you {when} before the MOT runs out, each with a one-tap link to compare local garage prices
            and book, often well below the &pound;54.85 legal maximum. Nothing else, and never marketing.
          </Deck>
          <Vitals
            items={[
              { label: "MOT due", value: expiryDate },
              { label: "Reminders", value: sorted.map(offsetLabel).join(" · "), sub: "before it runs out" },
              { label: "By", value: "Email", sub: "Stop any time" },
            ]}
          />
          <Action href={reportUrl}>See this car&apos;s full check</Action>
          <Foot stopUrl={unsubscribeUrl} date={sentOn} reason="You set an MOT reminder for this car on freeplatecheck.co.uk." stopLabel="Stop reminders for this car" />
        </Container>
      </Body>
    </Html>
  );
}
