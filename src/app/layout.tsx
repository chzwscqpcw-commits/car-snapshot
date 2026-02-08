import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Plate Check — Free UK Vehicle Check | MOT History, Tax Status & More",
  description:
    "Check any UK vehicle free. Enter a reg plate to instantly see MOT history, tax status, mileage data, and get checklists for buying, selling or owning a car. DVLA data, no signup required.",
  keywords: [
    "free car check",
    "number plate check",
    "vehicle reg check",
    "MOT check",
    "car tax check",
    "DVLA vehicle check",
    "free vehicle check UK",
    "registration lookup",
    "MOT history check",
    "used car check",
  ],
  openGraph: {
    title: "Free Plate Check — Free UK Vehicle Check",
    description:
      "Enter a reg plate to instantly check MOT history, tax status, mileage and more. Free, private, no signup.",
    url: "https://www.freeplatecheck.co.uk",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Plate Check — Free UK Vehicle Check",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Plate Check — Free UK Vehicle Check",
    description:
      "Check any UK vehicle free. MOT history, tax status, mileage data and buying checklists.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-title" content="Free Plate Check" />
      </head>
      <body>{children}</body>
    </html>
  );
}