import { Section } from "@react-email/components";

const card: React.CSSProperties = {
  backgroundColor: "#1a1a2e",
  border: "1px solid #2d2d2d",
  borderRadius: "8px",
  padding: "20px 24px",
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
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  lineHeight: "1.3",
  margin: "0 0 16px",
};
