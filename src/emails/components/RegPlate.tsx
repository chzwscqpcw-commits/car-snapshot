import { Section, Text } from "@react-email/components";

/**
 * Email-safe rendition of the site's RegPlate variant="frosted". A
 * dark slate background with a cyan border + light cyan mono text —
 * the same treatment used as the hero plate on the homepage loading
 * skeleton and tool-page result headers.
 *
 * Earlier iteration used the yellow pill (matching variant="pill")
 * which works well on the bright on-site rendering but was being
 * aggressively darkened to brown by Outlook iOS in dark mode and
 * isn't a brand colour in the first place — it's a UK number-plate
 * convention. The frosted treatment is built on actual brand
 * colours (cyan-500 border, slate-900 surface) so it stays
 * recognisable through dark-mode mangling and reads as "Free Plate
 * Check" not "a generic UK plate".
 *
 * Sized at 20px text so it reads as the hero of the email content
 * area on a phone screen.
 */

const wrapper: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 18px",
};

const plate: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#0f172a",
  border: "1px solid #06b6d4",
  color: "#a5f3fc",
  fontSize: "20px",
  fontWeight: 700,
  fontFamily: "'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
  padding: "10px 22px",
  borderRadius: "10px",
  letterSpacing: "0.18em",
  lineHeight: "1",
  margin: "0",
  boxShadow: "0 0 0 1px rgba(6, 182, 212, 0.15), 0 4px 14px rgba(6, 182, 212, 0.18)",
};

interface EmailRegPlateProps {
  reg: string;
}

export function EmailRegPlate({ reg }: EmailRegPlateProps) {
  return (
    <Section style={wrapper}>
      <Text style={plate}>{reg.toUpperCase()}</Text>
    </Section>
  );
}
