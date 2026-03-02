import { Section, Text } from "@react-email/components";

const header: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  padding: "24px 32px 20px",
  textAlign: "center" as const,
};

const emojis: React.CSSProperties = {
  fontSize: "14px",
  letterSpacing: "4px",
  margin: "0 0 12px",
  lineHeight: "1",
};

const wordmark: React.CSSProperties = {
  color: "#10b981",
  fontSize: "22px",
  fontWeight: 600,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0",
  lineHeight: "1.2",
};

export function Header() {
  return (
    <Section style={header}>
      <Text style={emojis}>&#128663;&#128665;&#128661;&#128663;</Text>
      <Text style={wordmark}>Free Plate Check</Text>
    </Section>
  );
}
