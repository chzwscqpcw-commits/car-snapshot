import { ImageResponse } from "next/og";
import { OGBrandFrame, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Cheap MOT Near You — Compare Local Prices";
export const size = ogSize;
export const contentType = ogContentType;

/**
 * /cheap-mot OG — uses the shared brand frame (navy, grid, bolt lockup,
 * domain) but swaps the standard title/description hero for a price-forward
 * one: the regulated £54.85 cap struck through next to what people actually
 * pay. The page's whole hook is price, so the thumbnail leads with it.
 */
export default function OGImage() {
  return new ImageResponse(
    (
      <OGBrandFrame>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 60,
              fontWeight: 700,
              color: "#f1f5f9",
              lineHeight: 1.1,
              maxWidth: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Cheap MOT Near You
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 25,
              color: "#94a3b8",
              marginTop: 22,
              lineHeight: 1.45,
              maxWidth: 820,
            }}
          >
            Compare local garage prices — many charge well below the £54.85
            legal maximum.
          </div>

          {/* Price pills: the cap vs what people actually pay */}
          <div style={{ display: "flex", marginTop: 36, gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 24px",
                borderRadius: 14,
                border: "1px solid #334155",
                background: "rgba(15, 23, 42, 0.6)",
              }}
            >
              <div style={{ display: "flex", fontSize: 18, color: "#64748b" }}>
                LEGAL MAX
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  fontWeight: 700,
                  color: "#cbd5e1",
                  textDecoration: "line-through",
                }}
              >
                £54.85
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 24px",
                borderRadius: 14,
                border: "1px solid rgba(16, 185, 129, 0.5)",
                background: "rgba(16, 185, 129, 0.12)",
              }}
            >
              <div style={{ display: "flex", fontSize: 18, color: "#34d399" }}>
                MANY PAY
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  fontWeight: 700,
                  color: "#6ee7b7",
                }}
              >
                from ~£30
              </div>
            </div>
          </div>
        </div>
      </OGBrandFrame>
    ),
    { ...ogSize }
  );
}
