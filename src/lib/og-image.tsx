import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export function generateOGImage(title: string, description: string) {
  const truncatedDesc =
    description.length > 120 ? description.slice(0, 117) + "..." : description;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 60%, #164e63 100%)",
          padding: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative circles for visual depth */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
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
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)",
          }}
        />

        {/* Gradient accent bar */}
        <div
          style={{
            display: "flex",
            height: 6,
            width: "100%",
            background: "linear-gradient(to right, #3b82f6, #06b6d4, #3b82f6)",
          }}
        />

        {/* Content area */}
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
          {/* Checkmark icon top-right */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 56,
              right: 80,
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Title + description */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: "#f1f5f9",
                lineHeight: 1.15,
                display: "flex",
                maxWidth: 950,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>
            {truncatedDesc && (
              <div
                style={{
                  fontSize: 24,
                  color: "#94a3b8",
                  marginTop: 28,
                  lineHeight: 1.5,
                  display: "flex",
                  maxWidth: 880,
                }}
              >
                {truncatedDesc}
              </div>
            )}
          </div>

          {/* Branding footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Small car silhouette icon */}
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
              <div
                style={{
                  fontSize: 20,
                  color: "#64748b",
                  display: "flex",
                }}
              >
                Free Plate Check
              </div>
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#475569",
                display: "flex",
              }}
            >
              freeplatecheck.co.uk
            </div>
          </div>
        </div>

        {/* Bottom gradient accent bar */}
        <div
          style={{
            display: "flex",
            height: 4,
            width: "100%",
            background: "linear-gradient(to right, #06b6d4, #3b82f6, #06b6d4)",
          }}
        />
      </div>
    ),
    {
      ...ogSize,
    }
  );
}
