import { Section, Text, Row, Column } from "@react-email/components";

/**
 * Branded email header. Three layers:
 * 1. Dark slate top band with a larger BoltMark (32×42) + wordmark
 *    — sized so it reads as a brand on a phone screen, not as an
 *    inline favicon.
 * 2. A 3px cyan→blue gradient strip below the band. Echoes the on-site
 *    cyan→blue gradient used for primary CTAs and the loading ring,
 *    and acts as a visual handover from "this is Free Plate Check"
 *    into the content area.
 * 3. Fallback background colours so Outlook desktop (which ignores
 *    linear-gradient) still gets a solid cyan strip rather than
 *    nothing.
 */

const header: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  padding: "36px 0 28px",
  textAlign: "center" as const,
};

const brandRow: React.CSSProperties = {
  width: "auto",
  margin: "0 auto",
};

const iconCol: React.CSSProperties = {
  verticalAlign: "middle",
  paddingRight: "14px",
  width: "32px",
};

const textCol: React.CSSProperties = {
  verticalAlign: "middle",
};

const wordmark: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: 700,
  fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
  margin: "0",
  lineHeight: "1.2",
  letterSpacing: "-0.6px",
};

const accentStrip: React.CSSProperties = {
  backgroundColor: "#06b6d4",
  backgroundImage: "linear-gradient(90deg, #22d3ee 0%, #3b82f6 100%)",
  height: "3px",
  fontSize: "0",
  lineHeight: "0",
};

export function Header() {
  return (
    <>
      <Section style={header}>
        <Row style={brandRow}>
          <Column style={iconCol}>
            {/* BoltMark — 32×42 cyan, geometric bolt. Inline SVG via data
                URI so every client renders identically without an asset
                load. Width/height attributes are required for Outlook. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- email HTML cannot use next/image; inline data-URI SVG */}
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='42' viewBox='0 0 24 32' fill='%2322d3ee'%3E%3Cpath d='M 15 0 L 5 17 L 12 17 L 10 32 L 19 15 L 12 15 Z'/%3E%3C/svg%3E"
              width="32"
              height="42"
              alt="Free Plate Check"
              style={{ display: "block" }}
            />
          </Column>
          <Column style={textCol}>
            <Text style={wordmark}>Free Plate Check</Text>
          </Column>
        </Row>
      </Section>
      <Section style={accentStrip}>
        <Text style={{ margin: 0, fontSize: 0, lineHeight: 0 }}>&nbsp;</Text>
      </Section>
    </>
  );
}
