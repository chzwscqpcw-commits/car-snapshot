import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Two Vehicles | Free Plate Check",
  description:
    "Compare two UK vehicles side by side. Check MOT history, tax status, mileage, and specs to help you choose the right used car.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/compare",
  },
  openGraph: {
    title: "Compare Two Vehicles | Free Plate Check",
    description:
      "Compare two UK vehicles side by side. Check MOT history, tax status, mileage, and specs to help you choose the right used car.",
    url: "https://www.freeplatecheck.co.uk/compare",
    siteName: "Free Plate Check",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Plate Check — Compare Two Vehicles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare Two Vehicles | Free Plate Check",
    description:
      "Compare two UK vehicles side by side. Check MOT history, tax status, mileage, and specs to help you choose the right used car.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
