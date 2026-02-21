import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.freeplatecheck.co.uk"),
  title: "Free Plate Check — Free UK Vehicle Check | MOT, Tax, Valuation & More",
  description:
    "Check any UK vehicle free. MOT history, tax status, mileage, ULEZ compliance, safety recalls, car valuation, running costs, NCAP ratings and a full PDF report. No signup — just enter a reg.",
  keywords: [
    "free car check",
    "number plate check",
    "vehicle reg check",
    "MOT check",
    "MOT history check",
    "car tax check",
    "DVLA vehicle check",
    "free vehicle check UK",
    "registration lookup",
    "used car check",
    "car valuation free",
    "ULEZ check",
    "car recall check",
    "vehicle running costs",
  ],
  openGraph: {
    title: "Free Plate Check — Free UK Vehicle Check",
    description:
      "Enter a reg plate to instantly check MOT history, tax status, valuation, ULEZ, safety recalls and more. Free, private, no signup.",
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
      "Check any UK vehicle free. MOT history, tax status, valuation, ULEZ, safety recalls, running costs and more.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "02sH93JGp8XsbrfdNpHmwLLXY_Kw9NdmXGVCcGgduH0",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Free Plate Check",
  url: "https://www.freeplatecheck.co.uk",
  logo: "https://www.freeplatecheck.co.uk/og-image.png",
  sameAs: [],
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Free Plate Check",
  url: "https://www.freeplatecheck.co.uk",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate:
        "https://www.freeplatecheck.co.uk/?reg={search_term_string}",
    },
    "query-input": "required name=search_term_string",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteJsonLd),
          }}
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-title" content="Free Plate Check" />
        <link rel="alternate" type="application/rss+xml" title="Free Plate Check — Car Guides & MOT Tips" href="https://www.freeplatecheck.co.uk/feed.xml" />
      </head>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LW3HZS1Z5H"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-LW3HZS1Z5H');`}
        </Script>
        {children}
      </body>
    </html>
  );
}