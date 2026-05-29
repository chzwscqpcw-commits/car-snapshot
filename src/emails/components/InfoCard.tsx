import { Section } from "@react-email/components";

/**
 * Branded info-card surface — a 3px cyan accent strip across the top
 * makes the card feel like an on-site frosted card without the
 * email-incompatible backdrop-filter. Slightly elevated background
 * + softened border for additional depth.
 */

const card: React.CSSProperties = {
  backgroundColor: "#1a1a2e",
  borderTop: "3px solid #06b6d4",
  borderLeft: "1px solid #2d2d2d",
  borderRight: "1px solid #2d2d2d",
  borderBottom: "1px solid #2d2d2d",
  borderRadius: "10px",
  padding: "22px 24px",
  margin: "0 0 24px",
};

interface InfoCardProps {
  children: React.ReactNode;
}

export function InfoCard({ children }: InfoCardProps) {
  return <Section style={card}>{children}</Section>;
}

/* Reusable label + value styles for use inside InfoCard */

export const labelStyle: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "11px",
  fontWeight: 600,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  lineHeight: "1",
  margin: "0 0 4px",
};

export const valueStyle: React.CSSProperties = {
  color: "#f5f5f5",
  fontSize: "18px",
  fontWeight: 700,
  fontFamily: "'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
  lineHeight: "1.3",
  margin: "0 0 16px",
};
