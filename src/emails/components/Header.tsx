import { Section, Text, Row, Column } from "@react-email/components";

const header: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  padding: "24px 0 20px",
  textAlign: "center" as const,
};

const emojis: React.CSSProperties = {
  fontSize: "14px",
  letterSpacing: "4px",
  margin: "0 0 14px",
  lineHeight: "1",
  textAlign: "center" as const,
};

const brandRow: React.CSSProperties = {
  width: "auto",
  margin: "0 auto",
};

const iconCol: React.CSSProperties = {
  verticalAlign: "middle",
  paddingRight: "8px",
  width: "28px",
};

const textCol: React.CSSProperties = {
  verticalAlign: "middle",
};

const wordmark: React.CSSProperties = {
  background: "linear-gradient(to right, #60a5fa, #67e8f9)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  fontSize: "22px",
  fontWeight: 700,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0",
  lineHeight: "1.2",
};

/* Fallback for email clients that don't support gradient text */
const wordmarkFallback: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: "22px",
  fontWeight: 700,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0",
  lineHeight: "1.2",
};

export function Header() {
  return (
    <Section style={header}>
      <Text style={emojis}>&#128663;&#128665;&#128661;&#128663;</Text>
      <Row style={brandRow}>
        <Column style={iconCol}>
          {/* Inline SVG bolt icon matching Lucide Zap */}
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z'%3E%3C/path%3E%3C/svg%3E"
            width="24"
            height="24"
            alt=""
            style={{ display: "block" }}
          />
        </Column>
        <Column style={textCol}>
          {/*
            Use gradient where supported, falls back to solid blue.
            Most email clients will show the fallback colour.
          */}
          <Text style={wordmarkFallback}>
            <span style={wordmark as React.CSSProperties}>Free Plate Check</span>
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
