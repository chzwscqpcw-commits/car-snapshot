import { ImageResponse } from "next/og";
import { OGBrandFrame, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "How Many Are Left? — UK car survivors by reg";
export const size = ogSize;
export const contentType = ogContentType;

// A few real "endangered" survivor counts, as brand-style pills (same family as
// the /cheap-mot price pills) — conveys the hook without leaving the house style.
const PILLS: { name: string; n: string }[] = [
  { name: "MG Maestro", n: "45" },
  { name: "Fiat Uno", n: "126" },
  { name: "Austin Metro", n: "261" },
];

export default function OGImage() {
  return new ImageResponse(
    (
      <OGBrandFrame>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              color: "#f1f5f9",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            How Many Are Left?
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#94a3b8",
              marginTop: 18,
              maxWidth: 860,
              lineHeight: 1.4,
            }}
          >
            How many of your car survive on Britain&apos;s roads? Find out by reg.
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 36 }}>
            {PILLS.map((p) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 20px",
                  borderRadius: 14,
                  background: "rgba(248, 113, 113, 0.10)",
                  border: "1px solid rgba(248, 113, 113, 0.30)",
                }}
              >
                <span style={{ display: "flex", fontSize: 22, color: "#e2e8f0", fontWeight: 600 }}>
                  {p.name}
                </span>
                <span style={{ display: "flex", fontSize: 22, color: "#f87171", fontWeight: 700 }}>
                  {p.n} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </OGBrandFrame>
    ),
    { ...ogSize }
  );
}
