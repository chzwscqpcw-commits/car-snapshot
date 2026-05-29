import type { Metadata } from "next";
import { Suspense } from "react";
import BookingWizard from "@/components/booking/BookingWizard";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does the booking flow work?",
    answer:
      "Four quick steps on Free Plate Check: confirm your vehicle, pick a service, share your postcode and timing, then hand off to BookMyGarage for live garage prices. We pre-fill everything we can, so the BMG side is just choosing the garage and confirming.",
  },
  {
    question: "Why not just go to BookMyGarage directly?",
    answer:
      "You can — but this flow uses your DVLA vehicle data to recommend the right service for your car's age and MOT history, shows realistic local price ranges before you compare quotes, and skips the steps BMG would otherwise ask you (vehicle details, service selection). It's faster end-to-end.",
  },
  {
    question: "Are the prices I see on this page accurate?",
    answer:
      "The ranges shown are typical for your vehicle category and region, compiled from public garage pricing and BookMyGarage averages. Actual quotes from local garages will sit within those ranges in most cases. MOT pricing is regulated to a £54.85 legal maximum.",
  },
  {
    question: "Do I have to give my postcode?",
    answer:
      "No. You can skip the postcode step — BookMyGarage will ask for it when you hand off. The only benefit of entering it here is seeing local price context before you click through.",
  },
  {
    question: "How does Free Plate Check make money from this?",
    answer:
      "When you book through BookMyGarage we earn a small affiliate commission. The price you pay is unaffected — same as if you went to BMG directly. We never share your data with them and we don't take an email or phone number on our side.",
  },
  {
    question: "Can I book through this for any car?",
    answer:
      "Yes — any UK-registered car or small van (MOT Class 4). Motorbikes, large vans (Class 7), and commercial vehicles need a different MOT class and aren't covered by this flow yet.",
  },
];

export const metadata: Metadata = {
  title: "Book MOT or Service Near You — Compare Prices Free | Free Plate Check",
  description:
    "Compare MOT and service prices from local garages in seconds. Pre-fill your registration, postcode and service type, then book with BookMyGarage. Free, no signup, no email.",
  keywords: [
    "book MOT online",
    "book MOT near me",
    "compare MOT prices UK",
    "book car service near me",
    "MOT booking comparison",
    "find a garage near me",
    "MOT booking",
    "car service booking UK",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/booking",
  },
  openGraph: {
    title: "Book MOT or Service Near You — Compare Prices Free",
    description:
      "Compare MOT and service prices from local garages in seconds. Pre-fill your registration and book through BookMyGarage.",
    url: "https://www.freeplatecheck.co.uk/booking",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book MOT or Service Near You — Compare Prices Free",
    description:
      "Compare MOT and service prices from local garages in seconds. Pre-fill your registration and book through BookMyGarage.",
  },
};

export default function BookingPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.freeplatecheck.co.uk",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Book MOT or Service",
        item: "https://www.freeplatecheck.co.uk/booking",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — MOT & Service Booking",
    url: "https://www.freeplatecheck.co.uk/booking",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Compare MOT and service prices from local garages. Free, no signup.",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4 pt-5 pb-4 sm:pt-8 sm:pb-6">
          <a href="/tools" className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm mb-3 sm:mb-6 inline-block">
            &larr; Back to all tools
          </a>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-100 leading-tight">
            Book your MOT or service
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-emerald-300">
            Pre-fill once · Compare prices in seconds · Free
          </p>
          {/* Description shown only on tablet+ — on mobile the wizard takes
              priority and the description belongs in the FAQ at the bottom. */}
          <p className="hidden sm:block mt-3 text-sm text-slate-400 leading-relaxed">
            We pull your vehicle details from DVLA, recommend the right service for its
            age and MOT history, and show local price ranges — then hand off to BookMyGarage
            with everything ready to go.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 sm:py-10">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 h-96 animate-pulse" />
          }
        >
          <BookingWizard />
        </Suspense>

        <section className="mt-8 sm:mt-12">
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-3 sm:mb-4">Frequently asked questions</h2>
          <FaqAccordion items={FAQ_ITEMS} />
        </section>
      </div>
    </div>
  );
}
