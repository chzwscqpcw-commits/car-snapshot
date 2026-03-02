import { Section, Link } from "@react-email/components";

const wrapper: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const button: React.CSSProperties = {
  backgroundColor: "#10b981",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "8px",
  display: "inline-block",
  lineHeight: "1",
};

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
}

export function CTAButton({ href, children }: CTAButtonProps) {
  return (
    <Section style={wrapper}>
      <Link href={href} style={button}>
        {children}
      </Link>
    </Section>
  );
}
