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
          backgroundColor: "#0f172a",
          padding: 0,
        }}
      >
        {/* Gradient accent bar */}
        <div
          style={{
            display: "flex",
            height: 8,
            width: "100%",
            background: "linear-gradient(to right, #3b82f6, #06b6d4)",
          }}
        />

        {/* Content area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "60px 80px 40px 80px",
            justifyContent: "space-between",
          }}
        >
          {/* Title + description */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "#f1f5f9",
                lineHeight: 1.2,
                display: "flex",
                maxWidth: 1000,
              }}
            >
              {title}
            </div>
            {truncatedDesc && (
              <div
                style={{
                  fontSize: 24,
                  color: "#94a3b8",
                  marginTop: 24,
                  lineHeight: 1.4,
                  display: "flex",
                  maxWidth: 900,
                }}
              >
                {truncatedDesc}
              </div>
            )}
          </div>

          {/* Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: "#64748b",
                display: "flex",
              }}
            >
              Free Plate Check | freeplatecheck.co.uk
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
    }
  );
}
