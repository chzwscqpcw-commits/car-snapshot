import type { Metadata } from "next";

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
        name: "Is the MOT reminder service free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, completely free. There are no charges, no hidden fees, and no premium tiers. You'll receive two reminder emails — one 28 days and one 7 days before your MOT expires — at no cost.",
        },
      },
      {
        "@type": "Question",
        name: "How many reminder emails will I receive?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You'll receive two emails per vehicle: the first 28 days before your MOT expiry date, and the second 7 days before. This gives you plenty of time to book your test.",
        },
      },
      {
        "@type": "Question",
        name: "Can I set up reminders for multiple vehicles?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can set up a separate MOT reminder for each vehicle you own. Just look up each registration number on our homepage and enter your email address to activate the reminder.",
        },
      },
      {
        "@type": "Question",
        name: "How do I unsubscribe from MOT reminders?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every reminder email includes a one-click unsubscribe link. Click it and you'll be removed immediately — no account login or extra steps required.",
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
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Set up your free MOT reminder
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Look up your vehicle on our homepage, then enter your email to receive reminders 28 days and 7 days before your MOT expires.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Look up your vehicle
          </a>
        </div>

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What is the MOT reminder service?</h2>
            <p className="leading-relaxed mb-3">
              Our free MOT reminder service sends you an email alert before your MOT certificate expires. You&apos;ll receive two reminders for each vehicle: one <strong className="text-slate-100">28 days before</strong> your MOT is due, and another <strong className="text-slate-100">7 days before</strong>. That gives you plenty of time to find and book a test at a price and time that suits you.
            </p>
            <p className="leading-relaxed mb-3">
              The service is completely free, with no account to create and no marketing emails. We only use your email address to send MOT reminders for the vehicle you registered — nothing else.
            </p>
            <p className="leading-relaxed">
              Each reminder email includes your vehicle&apos;s MOT expiry date, how many days you have left, and a direct link to book an MOT test. It&apos;s the simplest way to make sure you never miss your MOT.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How it works</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">1</span>
                <div>
                  <p className="font-semibold text-slate-100">Check your vehicle</p>
                  <p className="text-sm mt-1">Enter your registration number on our <a href="/" className="text-blue-400 hover:text-blue-300">homepage</a> to look up your vehicle&apos;s MOT status and expiry date.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">2</span>
                <div>
                  <p className="font-semibold text-slate-100">Enter your email</p>
                  <p className="text-sm mt-1">After looking up your vehicle, you&apos;ll see the option to set up an MOT reminder. Enter your email address and confirm it with one click.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">3</span>
                <div>
                  <p className="font-semibold text-slate-100">Get your reminders</p>
                  <p className="text-sm mt-1">We&apos;ll email you 28 days and 7 days before your MOT expires — giving you time to book your test without the last-minute rush.</p>
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
              <li><strong className="text-slate-100">One-click MOT booking</strong> — A direct link to book your MOT test, so you can take action straight from the email.</li>
            </ul>
            <p className="leading-relaxed">
              No clutter, no ads, no upsells. Just the information you need to stay on top of your MOT. You can also check your vehicle&apos;s full <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> or <a href="/tax-check" className="text-blue-400 hover:text-blue-300">tax status</a> at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-100">Is the MOT reminder service free?</h3>
                <p className="text-sm mt-1">Yes, completely free. There are no charges, no hidden fees, and no premium tiers. You&apos;ll receive two reminder emails — one 28 days and one 7 days before your MOT expires — at no cost.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How many reminder emails will I receive?</h3>
                <p className="text-sm mt-1">You&apos;ll receive two emails per vehicle: the first 28 days before your MOT expiry date, and the second 7 days before. This gives you plenty of time to book your test.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Can I set up reminders for multiple vehicles?</h3>
                <p className="text-sm mt-1">Yes. You can set up a separate MOT reminder for each vehicle you own. Just look up each registration number on our homepage and enter your email address to activate the reminder.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">How do I unsubscribe from MOT reminders?</h3>
                <p className="text-sm mt-1">Every reminder email includes a one-click unsubscribe link. Click it and you&apos;ll be removed immediately — no account login or extra steps required.</p>
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
