import type { Metadata } from "next";
import MOTReminderSignup from "@/components/MOTReminderSignup";
import MOTBookingCTA from "@/components/MOTBookingCTA";

export const metadata: Metadata = {
  title: "Free MOT Reminder — Never Miss Your MOT | Free Plate Check",
  description:
    "Get a free MOT reminder email 28 days and 7 days before your MOT expires. Never miss your MOT again — no signup, no spam, just a simple reminder.",
  keywords: [
    "MOT reminder",
    "MOT expiry reminder",
    "MOT reminder email",
    "free MOT reminder",
    "MOT due date alert",
    "never miss MOT",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/mot-reminder",
  },
  openGraph: {
    title: "Free MOT Reminder — Never Miss Your MOT",
    description:
      "Get a free MOT reminder email 28 days and 7 days before your MOT expires. Never miss your MOT again.",
    url: "https://www.freeplatecheck.co.uk/mot-reminder",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free MOT Reminder — Never Miss Your MOT",
    description:
      "Get a free MOT reminder email 28 days and 7 days before your MOT expires. Never miss your MOT again.",
  },
};

export default function MotReminderPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I get an MOT reminder?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Enter your vehicle registration and email address in the form on this page. We'll automatically look up your MOT expiry date and send you a reminder 28 days and 7 days before it expires.",
        },
      },
      {
        "@type": "Question",
        name: "Is this service free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, completely free. There are no charges, no hidden fees, and no premium tiers. You'll receive two reminder emails — one 28 days and one 7 days before your MOT expires — at no cost.",
        },
      },
      {
        "@type": "Question",
        name: "How do I unsubscribe?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every reminder email includes a one-click unsubscribe link. Click it and you'll be removed immediately — no account login or extra steps required.",
        },
      },
      {
        "@type": "Question",
        name: "What if I have more than one car?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can add up to 5 vehicles at once using the form on this page. Just click '+ Add another vehicle' to enter additional registration numbers. Each vehicle will receive its own set of reminders.",
        },
      },
      {
        "@type": "Question",
        name: "Can you remind me about road tax too?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Not yet, but road tax reminders are coming soon. For now, you can check your vehicle's tax status any time on our homepage.",
        },
      },
      {
        "@type": "Question",
        name: "What do you do with my email address?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We only use your email address to send MOT reminder emails for the vehicle you registered. We never share your email with third parties, and we don't send marketing emails. You can unsubscribe at any time.",
        },
      },
    ],
  };

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
        name: "MOT Reminder",
        item: "https://www.freeplatecheck.co.uk/mot-reminder",
      },
    ],
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Plate Check — MOT Reminder Service",
    url: "https://www.freeplatecheck.co.uk/mot-reminder",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    description:
      "Set up a free MOT reminder for any UK vehicle. Get email alerts 28 days and 7 days before your MOT expires.",
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Free MOT Reminder Service",
    description:
      "Free email reminder service that alerts you 28 days and 7 days before your MOT expires. No account required, no marketing emails — just timely reminders to keep your vehicle legal.",
    provider: {
      "@type": "Organization",
      name: "Free Plate Check",
      url: "https://www.freeplatecheck.co.uk",
    },
    serviceType: "MOT Reminder",
    areaServed: "United Kingdom",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to Free Plate Check
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            Free MOT Reminder Service
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Get email reminders before your MOT expires — completely free, no account needed.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is the MOT reminder service?</h2>
            <p className="leading-relaxed mb-3">
              Our free MOT reminder service sends you an email alert before your MOT certificate expires. You&apos;ll receive two reminders for each vehicle: one <strong className="text-slate-100">28 days before</strong> your MOT is due, and another <strong className="text-slate-100">7 days before</strong>. That gives you plenty of time to find and book a test at a price and time that suits you.
            </p>
            <p className="leading-relaxed">
              The service is completely free, with no account to create and no marketing emails. We only use your email address to send MOT reminders for the vehicle you registered — nothing else.
            </p>
          </section>

          {/* Primary signup form */}
          <div className="my-10">
            <MOTReminderSignup context="generic" />
          </div>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How it works</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">1</span>
                <div>
                  <p className="font-semibold text-slate-100">Enter your registration and email</p>
                  <p className="text-sm mt-1">Type your vehicle registration number and email address into the form above. You can add up to 5 vehicles at once.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">2</span>
                <div>
                  <p className="font-semibold text-slate-100">We look up your MOT expiry date automatically</p>
                  <p className="text-sm mt-1">We check official DVLA records to find your vehicle&apos;s current MOT expiry date — no need to look it up yourself.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">3</span>
                <div>
                  <p className="font-semibold text-slate-100">You receive an email 28 days before — and again 7 days before</p>
                  <p className="text-sm mt-1">Two well-timed reminders give you plenty of time to compare prices and book your test without the last-minute rush.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">4</span>
                <div>
                  <p className="font-semibold text-slate-100">Each reminder includes local garage prices via BookMyGarage</p>
                  <p className="text-sm mt-1">Every reminder email includes a direct link to compare MOT test prices at garages near you — so you can book at the best price in seconds.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why set an MOT reminder?</h2>
            <p className="leading-relaxed mb-3">
              It&apos;s surprisingly easy to forget when your MOT is due. Life gets busy, and a missed MOT can have serious consequences:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Up to &pound;1,000 fine</strong> — Driving without a valid MOT is a criminal offence. Police can issue a fixed penalty notice on the spot, and courts can impose fines up to &pound;1,000.</li>
              <li><strong className="text-slate-100">Insurance may be void</strong> — Most car insurance policies require a valid MOT. If you&apos;re in an accident without one, your insurer can refuse to pay out — leaving you personally liable for all damage and injuries.</li>
              <li><strong className="text-slate-100">ANPR cameras flag expired MOTs</strong> — Automatic Number Plate Recognition cameras across the UK actively check MOT status. You don&apos;t need to be stopped by police to be caught — the cameras do it automatically.</li>
              <li><strong className="text-slate-100">Convenience</strong> — A reminder 28 days in advance gives you time to shop around for the best price and book at a convenient time, rather than scrambling at the last minute or discovering your MOT has already lapsed.</li>
            </ul>
            <p className="leading-relaxed">
              Setting a reminder takes less than 30 seconds and costs nothing. It&apos;s one of the simplest things you can do to stay legal on the road. For more on the consequences of driving without an MOT, read our <a href="/blog/what-happens-driving-without-mot" className="text-blue-400 hover:text-blue-300">guide to driving without an MOT</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What&apos;s included in the reminder email?</h2>
            <p className="leading-relaxed mb-3">
              Each MOT reminder email is short, clear, and useful. Here&apos;s what you&apos;ll receive:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Your MOT expiry date</strong> — The exact date your current MOT certificate runs out.</li>
              <li><strong className="text-slate-100">Days remaining</strong> — A clear count of how many days you have left to book and complete your test.</li>
              <li><strong className="text-slate-100">Local garage prices</strong> — A direct link to compare MOT test prices at garages near you via BookMyGarage.</li>
            </ul>
            <p className="leading-relaxed">
              No clutter, no ads, no upsells. Just the information you need to stay on top of your MOT. You can also check your vehicle&apos;s full <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> or <a href="/tax-check" className="text-blue-400 hover:text-blue-300">tax status</a> at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Ready to book your MOT?</h2>
            <p className="leading-relaxed mb-4">
              If your MOT is coming up soon and you&apos;d rather book now, you can compare prices at local garages through our partner BookMyGarage. Enter your registration and postcode to see available slots and prices near you.
            </p>
            <MOTBookingCTA regNumber="" context="neutral" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">How do I get an MOT reminder?</h3>
                <p className="text-sm mt-1">Enter your vehicle registration and email address in the form at the top of this page. We&apos;ll automatically look up your MOT expiry date and send you a reminder 28 days and 7 days before it expires.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Is this service free?</h3>
                <p className="text-sm mt-1">Yes, completely free. There are no charges, no hidden fees, and no premium tiers. You&apos;ll receive two reminder emails — one 28 days and one 7 days before your MOT expires — at no cost.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How do I unsubscribe?</h3>
                <p className="text-sm mt-1">Every reminder email includes a one-click unsubscribe link. Click it and you&apos;ll be removed immediately — no account login or extra steps required.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What if I have more than one car?</h3>
                <p className="text-sm mt-1">You can add up to 5 vehicles at once using the form on this page. Just click &quot;+ Add another vehicle&quot; to enter additional registration numbers. Each vehicle will receive its own set of reminders.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Can you remind me about road tax too?</h3>
                <p className="text-sm mt-1">Not yet, but road tax reminders are coming soon. For now, you can <a href="/tax-check" className="text-blue-400 hover:text-blue-300">check your vehicle&apos;s tax status</a> any time on our site.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">What do you do with my email address?</h3>
                <p className="text-sm mt-1">We only use your email address to send MOT reminder emails for the vehicle you registered. We never share your email with third parties, and we don&apos;t send marketing emails. You can unsubscribe at any time.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/blog/when-is-my-mot-due" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">When Is My MOT Due?</p>
            <p className="text-xs text-slate-500 mt-2">How to check when your MOT is due and make sure you never miss it.</p>
          </a>
          <a href="/blog/what-happens-driving-without-mot" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">What Happens if You Drive Without an MOT?</p>
            <p className="text-xs text-slate-500 mt-2">Penalties, insurance issues, and the exceptions you need to know about.</p>
          </a>
          <a href="/blog/how-to-read-mot-history" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Read a Car&apos;s MOT History</p>
            <p className="text-xs text-slate-500 mt-2">Understand test results, advisories, and how to spot red flags in a vehicle&apos;s history.</p>
          </a>
          <a href="/blog/how-to-appeal-mot-failure" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Appeal an MOT Failure</p>
            <p className="text-xs text-slate-500 mt-2">Your rights explained — how the appeal process works and when it&apos;s worth challenging.</p>
          </a>
        </div>
      </div>

      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">Home</a>
            <span>&bull;</span>
            <a href="/blog" className="hover:text-slate-300">Guides</a>
            <span>&bull;</span>
            <a href="/privacy" className="hover:text-slate-300">Privacy Policy</a>
            <span>&bull;</span>
            <a href="/terms" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}
