import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/**
 * Shared brand background for all generated OG images — matches the static
 * /og-image.png house style: deep navy, a soft blue glow, a faint grid, the
 * Free Plate Check bolt + wordmark lockup top-left, and the domain bottom-
 * right. `children` is the page-specific hero (title/description, or a custom
 * composition like the /cheap-mot price pills). This keeps every shared link
 * — tool pages, blog posts, stats — visually one family with the fallback.
 */
export function OGBrandFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#0b1120",
        overflow: "hidden",
      }}
    >
      {/* Soft blue glow, upper-left (behind the bolt) */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse 70% 60% at 22% 22%, rgba(37, 99, 235, 0.22) 0%, rgba(11, 17, 32, 0) 60%)",
        }}
      />
      {/* Faint grid overlay */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "linear-gradient(to right, rgba(148, 163, 184, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.06) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "60px 72px 52px 72px",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        {/* Brand lockup top-left: bolt in a subtle panel + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.20)",
            }}
          >
            <svg width="34" height="45" viewBox="0 0 24 32" fill="none">
              <defs>
                <linearGradient id="ogbolt" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path
                d="M 15 0 L 5 17 L 12 17 L 10 32 L 19 15 L 12 15 Z"
                fill="url(#ogbolt)"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              color: "#f8fafc",
              letterSpacing: "-0.01em",
            }}
          >
            Free Plate Check
          </div>
        </div>

        {/* Page-specific hero */}
        {children}

        {/* Footer: domain bottom-right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ display: "flex", fontSize: 20, color: "#64748b" }}>
            freeplatecheck.co.uk
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard generated OG image: brand frame + a title/description hero.
 * Most pages use this directly (one ~5-line opengraph-image.tsx). Pages with
 * a distinct visual hook (e.g. /cheap-mot price pills) compose OGBrandFrame
 * with their own hero instead.
 */
export function generateOGImage(title: string, description: string) {
  const truncatedDesc =
    description.length > 130 ? description.slice(0, 127) + "..." : description;

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
              maxWidth: 980,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          {truncatedDesc && (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#94a3b8",
                marginTop: 24,
                lineHeight: 1.45,
                maxWidth: 900,
              }}
            >
              {truncatedDesc}
            </div>
          )}
        </div>
      </OGBrandFrame>
    ),
    { ...ogSize }
  );
}
