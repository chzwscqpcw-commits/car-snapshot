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
  },
  twitter: {
    card: "summary",
    title: "Free Plate Check — Free UK Vehicle Check",
    description:
      "Check any UK vehicle free. MOT history, tax status, mileage data and buying checklists.",
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
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Free Plate Check" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>{children}</body>
    </html>
  );
}