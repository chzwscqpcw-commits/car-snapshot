import { Section, Link } from "@react-email/components";

/**
 * Primary branded CTA — gradient cyan→blue echoing the on-site Look-Up
 * button and the booking-wizard hand-off. The gradient is the modern
 * treatment; the solid backgroundColor is the Outlook-desktop
 * fallback. Box-shadow degrades gracefully in clients that don't
 * support it.
 */

const wrapper: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const button: React.CSSProperties = {
  backgroundColor: "#06b6d4",
  backgroundImage: "linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "10px",
  display: "inline-block",
  lineHeight: "1",
  boxShadow: "0 4px 14px rgba(6, 182, 212, 0.25)",
  letterSpacing: "0.01em",
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
