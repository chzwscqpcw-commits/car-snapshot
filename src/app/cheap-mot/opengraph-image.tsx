import { ImageResponse } from "next/og";
import { ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Cheap MOT Near You — Compare Local Prices";
export const size = ogSize;
export const contentType = ogContentType;

/**
 * Bespoke OG image for the /cheap-mot landing page. Reuses the brand family
 * (dark gradient, accent bars, branding footer) from lib/og-image, but leads
 * with the page's actual hook — the regulated £54.85 cap vs what people
 * actually pay — instead of the generic checkmark template. Price-forward
 * visuals carry the value prop in the social/SERP thumbnail.
 */
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 60%, #164e63 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative depth circles (emerald-tinted to match the page hero) */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: -120,
            left: -60,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)",
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            display: "flex",
            height: 6,
            width: "100%",
            background: "linear-gradient(to right, #10b981, #06b6d4, #10b981)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "56px 80px 48px 80px",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Pound badge top-right */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 56,
              right: 80,
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              color: "white",
            }}
          >
            £
          </div>

          {/* Headline + sub + price pills */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 60,
                fontWeight: 700,
                color: "#f1f5f9",
                lineHeight: 1.1,
                display: "flex",
                maxWidth: 900,
                letterSpacing: "-0.02em",
              }}
            >
              Cheap MOT Near You
            </div>
            <div
              style={{
                fontSize: 25,
                color: "#94a3b8",
                marginTop: 24,
                lineHeight: 1.45,
                display: "flex",
                maxWidth: 820,
              }}
            >
              Compare local garage prices — many charge well below the £54.85
              legal maximum.
            </div>

            {/* Price pills: the cap vs what people actually pay */}
            <div style={{ display: "flex", marginTop: 40, gap: 20 }}>
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
                <div
                  style={{ display: "flex", fontSize: 18, color: "#34d399" }}
                >
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

          {/* Branding footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 17h2m10 0h2M3 11l1.5-5h15l1.5 5" />
                <rect x="2" y="11" width="20" height="6" rx="2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
              <div style={{ display: "flex", fontSize: 20, color: "#64748b" }}>
                Free Plate Check
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 18, color: "#475569" }}>
              freeplatecheck.co.uk
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            display: "flex",
            height: 4,
            width: "100%",
            background: "linear-gradient(to right, #06b6d4, #10b981, #06b6d4)",
          }}
        />
      </div>
    ),
    { ...ogSize }
  );
}
