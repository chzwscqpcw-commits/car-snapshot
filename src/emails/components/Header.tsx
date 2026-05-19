import { Section, Text, Row, Column } from "@react-email/components";

const header: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  padding: "32px 0 26px",
  textAlign: "center" as const,
};

const brandRow: React.CSSProperties = {
  width: "auto",
  margin: "0 auto",
};

const iconCol: React.CSSProperties = {
  verticalAlign: "middle",
  paddingRight: "10px",
  width: "24px",
};

const textCol: React.CSSProperties = {
  verticalAlign: "middle",
};

const wordmark: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: 700,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0",
  lineHeight: "1.2",
  letterSpacing: "-0.5px",
};

export function Header() {
  return (
    <Section style={header}>
      <Row style={brandRow}>
        <Column style={iconCol}>
          {/* Free Plate Check BoltMark — custom geometric bolt, 24×32 cyan */}
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='32' viewBox='0 0 24 32' fill='%2322d3ee'%3E%3Cpath d='M 15 0 L 5 17 L 12 17 L 10 32 L 19 15 L 12 15 Z'/%3E%3C/svg%3E"
            width="24"
            height="32"
            alt=""
            style={{ display: "block" }}
          />
        </Column>
        <Column style={textCol}>
          <Text style={wordmark}>Free Plate Check</Text>
        </Column>
      </Row>
    </Section>
  );
}
