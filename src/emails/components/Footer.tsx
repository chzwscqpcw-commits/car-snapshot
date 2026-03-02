import { Section, Text, Link, Hr } from "@react-email/components";

const footer: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  padding: "20px 32px 28px",
};

const divider: React.CSSProperties = {
  borderColor: "#2d2d2d",
  borderTop: "1px solid #2d2d2d",
  margin: "0 0 20px",
};

const footerText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const link: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

interface FooterProps {
  unsubscribeUrl: string;
  reason?: string;
}

export function Footer({ unsubscribeUrl, reason }: FooterProps) {
  return (
    <Section style={footer}>
      <Hr style={divider} />
      <Text style={footerText}>
        {reason || "You signed up for MOT reminders on"}{" "}
        <Link href="https://freeplatecheck.co.uk" style={link}>
          freeplatecheck.co.uk
        </Link>
        .
      </Text>
      <Text style={footerText}>
        We don&apos;t store your registration number or track your identity.
      </Text>
      <Text style={{ ...footerText, margin: "0" }}>
        <Link href={unsubscribeUrl} style={link}>
          Unsubscribe from MOT reminders
        </Link>
      </Text>
    </Section>
  );
}
