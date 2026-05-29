import { Section, Text } from "@react-email/components";

/**
 * Email-safe rendition of the site's yellow pill plate (the same
 * RegPlate variant="pill" treatment used on /tax-check, the homepage
 * results header, and the compare cards). Renders as a yellow rounded
 * pill with bold black mono text — reads instantly as "UK number
 * plate" in any email client.
 *
 * Used in the three reminder templates so the user sees "their" plate
 * presented exactly the same way as on the site, reinforcing the
 * brand and making the email feel like an extension of the product.
 *
 * Sized larger than the on-site sm pill (18px text vs 14px) because
 * inbox typography reads smaller than web — needs an extra notch to
 * have the same visual weight on a phone screen.
 */

const wrapper: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 18px",
};

const plate: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#fbbf24",
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: 700,
  fontFamily: "'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
  padding: "7px 16px",
  borderRadius: "9999px",
  letterSpacing: "0.06em",
  lineHeight: "1",
  margin: "0",
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
