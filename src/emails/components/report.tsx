import { Column, Head, Img, Link, Row, Section, Text } from "@react-email/components";

/**
 * The PDF report's look (src/lib/report-v2), for email: the yellow plate, a
 * serif display headline with one italic accent word, a vitals strip and a
 * mono running head and foot. Colours are the report's "light" (print)
 * edition, not the dark one: mail clients' dark modes rewrite colours, and a
 * light page is the one thing every client transforms predictably (Outlook
 * turned the dark edition's page grey and its plate olive, and ignored every
 * override). The plate is an image for the same reason, attached inline
 * (lib/plate-image.tsx) so it shows without an "external images" prompt.
 * Email clients can't take the report's inlined fonts, so the serif comes from
 * Google Fonts where a client allows web fonts (Apple Mail, iOS Mail) and
 * falls back to Georgia elsewhere; the sans falls back to the system font.
 */

export const INK = "#0B1220";
export const SOFT = "#334155";
export const MUTED = "#475569";
export const RULE = "#E2E8F0";
export const ACCENT = "#0E7490";
export const GOOD = "#047857";
export const WARN = "#B45309";
export const RISK = "#B91C1C";
export const PAGE = "#FFFFFF";

export const SANS = "'Geist', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
export const MONO = "'Geist Mono', 'SF Mono', Menlo, Consolas, 'Courier New', monospace";
export const DISPLAY = "'Instrument Serif', Georgia, 'Times New Roman', serif";

export const page: React.CSSProperties = { backgroundColor: PAGE, margin: 0, padding: 0, fontFamily: SANS };
export const sheet: React.CSSProperties = { backgroundColor: PAGE, maxWidth: "600px", margin: "0 auto", padding: "28px 28px 24px" };

const mono = (size: number, color: string): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: `${size}px`,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color,
  margin: 0,
  lineHeight: 1.3,
});

/** The display serif, where a client allows web fonts. */
export function ReportHead() {
  return (
    <Head>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');`}</style>
    </Head>
  );
}

/** Bolt + wordmark on the left, the mono kicker ("MOT alert") on the right, then
 *  the rule. The kicker stays to two or three words: at phone width there is
 *  no room for a date beside the wordmark, so the date lives in the foot. */
export function Masthead({ kicker }: { kicker: string }) {
  return (
    <>
      <Row>
        <Column style={{ verticalAlign: "middle" }}>
          <Text style={{ margin: 0, fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", color: INK, fontFamily: SANS, lineHeight: 1, whiteSpace: "nowrap" as const }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- email HTML; inline data-URI SVG */}
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='20' viewBox='0 0 18 26' fill='%2322D3EE'%3E%3Cpath d='M11 0 L1 15 L8 15 L5 26 L17 10 L10 10 L13 0 Z'/%3E%3C/svg%3E"
              width="14"
              height="20"
              alt=""
              style={{ display: "inline-block", verticalAlign: "middle", marginRight: "10px" }}
            />
            <span style={{ verticalAlign: "middle" }}>FREE PLATE CHECK</span>
          </Text>
        </Column>
        <Column style={{ verticalAlign: "middle", textAlign: "right" as const }}>
          <Text style={{ ...mono(11, MUTED), whiteSpace: "nowrap" as const }}>{kicker}</Text>
        </Column>
      </Row>
      <Rule gap="14px 0 28px" />
    </>
  );
}

export function Rule({ gap = "0", strong = false }: { gap?: string; strong?: boolean }) {
  return (
    <Section style={{ margin: gap }}>
      <Text style={{ margin: 0, fontSize: 0, lineHeight: "1px", height: "1px", backgroundColor: strong ? "#94A3B8" : RULE }}>&nbsp;</Text>
    </Section>
  );
}

/** The report's yellow plate, as an image so no dark mode can recolour it.
 *  `src` is the inline attachment by default; a preview can point it at a file. */
export function Plate({ reg, src = "cid:plate" }: { reg: string; src?: string }) {
  const shown = /^[A-Z]{2}\d{2}[A-Z]{3}$/i.test(reg) ? `${reg.slice(0, 4)} ${reg.slice(4)}` : reg;
  return (
    <Section style={{ margin: "0 0 22px" }}>
      <Img src={src} width="180" height="46" alt={shown.toUpperCase()} style={{ display: "block", borderRadius: "8px", border: 0 }} />
    </Section>
  );
}

/** The display headline: "{lead} <em>{accent}</em> {tail}", the accent italic and cyan. */
export function Headline({ lead, accent, tail }: { lead: string; accent: string; tail?: string }) {
  return (
    <Text style={{ margin: "0 0 14px", fontFamily: DISPLAY, fontWeight: 400, fontSize: "40px", lineHeight: 1.02, letterSpacing: "-0.01em", color: INK }}>
      {lead}{" "}
      <em style={{ fontStyle: "italic", color: ACCENT }}>
        {accent}
      </em>
      {tail ? ` ${tail}` : ""}
    </Text>
  );
}

export function Deck({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "0 0 26px", fontFamily: SANS, fontSize: "16px", lineHeight: 1.6, color: SOFT }}>{children}</Text>;
}

export interface Vital {
  label: string;
  value: string;
  sub?: string;
  /** Value colour; the ink by default. */
  tone?: "ink" | "accent" | "good" | "warn" | "risk";
}

const TONES = { ink: INK, accent: ACCENT, good: GOOD, warn: WARN, risk: RISK } as const;

/** The report's vitals strip: label / value / sub in columns, ruled above and below. */
export function Vitals({ items }: { items: Vital[] }) {
  return (
    <Section style={{ margin: "0 0 26px", borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
      <Row>
        {items.map((v) => (
          <Column key={v.label} style={{ verticalAlign: "top", padding: "14px 12px 14px 0", width: `${Math.floor(100 / items.length)}%` }}>
            <Text style={{ ...mono(11, MUTED), margin: "0 0 6px" }}>{v.label}</Text>
            <Text style={{ margin: "0 0 4px", fontFamily: SANS, fontSize: "20px", fontWeight: 600, lineHeight: 1.1, color: TONES[v.tone ?? "ink"] }}>{v.value}</Text>
            {v.sub && <Text style={{ margin: 0, fontFamily: SANS, fontSize: "12px", lineHeight: 1.4, color: MUTED }}>{v.sub}</Text>}
          </Column>
        ))}
      </Row>
    </Section>
  );
}

/** One action: the report's accent as a solid button. */
export function Action({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ margin: "0 0 22px" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: ACCENT,
          color: "#FFFFFF",
          fontFamily: SANS,
          fontSize: "15px",
          fontWeight: 600,
          textDecoration: "none",
          padding: "14px 26px",
          borderRadius: "8px",
          lineHeight: 1,
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

export function Fine({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "0 0 22px", fontFamily: SANS, fontSize: "13px", lineHeight: 1.5, color: MUTED }}>{children}</Text>;
}

/** The running foot: a rule, the wordmark and the date, the honest line about the plate, and the stop link. */
export function Foot({
  stopUrl,
  reason,
  date,
  stopLabel = "Stop alerts for this car",
}: {
  stopUrl: string;
  reason: string;
  date?: string;
  stopLabel?: string;
}) {
  const small: React.CSSProperties = { margin: "0 0 8px", fontFamily: SANS, fontSize: "12px", lineHeight: 1.6, color: MUTED };
  return (
    <>
      <Rule gap="6px 0 18px" />
      <Row style={{ marginBottom: "14px" }}>
        <Column>
          <Text style={mono(11, MUTED)}>Free Plate Check</Text>
        </Column>
        <Column style={{ textAlign: "right" as const }}>
          <Text style={mono(11, MUTED)}>
            {date ?? (
              <Link href="https://www.freeplatecheck.co.uk" style={{ color: MUTED, textDecoration: "none" }}>
                freeplatecheck.co.uk
              </Link>
            )}
          </Text>
        </Column>
      </Row>
      <Text style={small}>{reason}</Text>
      <Text style={small}>
        We keep this car&apos;s registration and your email only to send these, and never share them.
      </Text>
      <Text style={{ ...small, margin: 0 }}>
        <Link href={stopUrl} style={{ color: SOFT, textDecoration: "underline", textUnderlineOffset: "2px" }}>
          {stopLabel}
        </Link>
      </Text>
    </>
  );
}
