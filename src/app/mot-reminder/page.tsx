import Link from "next/link";
import type { Metadata } from "next";
import MOTReminderSignup from "@/components/MOTReminderSignup";
import MOTBookingCTA from "@/components/MOTBookingCTA";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import StatCallouts from "@/components/StatCallouts";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I get an MOT reminder?",
    answer:
      "Enter your reg and email in the form above. We'll look up your MOT expiry from DVLA records and email you in good time before it's due — 5 weeks and 1 week before by default, or choose your own timing.",
  },
  {
    question: "When will you remind me?",
    answer:
      "By default we email you 5 weeks before expiry and again 1 week before. You can change this to any combination of 5 weeks, 1 month, 2 weeks or 1 week. The early reminder matters: you can have an MOT done up to a month before it expires and keep the same renewal date, so booking early can save you money without losing any days.",
  },
  {
    question: "Is this service free?",
    answer:
      "Yes — no charges, no premium tiers, no upsells. Just timely reminders, each with a link to compare and book a local MOT (often below the £54.85 cap).",
  },
  {
    question: "How do I unsubscribe?",
    answer:
      "One-click link in every reminder email. No login, no extra steps.",
  },
  {
    question: "What if I have more than one car?",
    answer:
      "Add up to 5 vehicles at once via '+ Add another vehicle' on the form. Each gets its own reminders.",
  },
  {
    question: "Can you remind me about road tax too?",
    answer:
      "Not yet, but coming soon. For now, check your vehicle's tax status any time on our site.",
  },
  {
    question: "What do you do with my email address?",
    answer:
      "Only used to send MOT reminders for the vehicle you registered. Never shared with third parties, no marketing emails. Unsubscribe any time.",
  },
];

export const metadata: Metadata = {
  title: "Free MOT Reminders by Email — Choose When You're Reminded | Free Plate Check",
  description:
    "Set a free MOT reminder by email — you choose when (5 weeks + 1 week before by default). Book early, keep your renewal date, compare prices. No signup, no spam. Add up to 5 vehicles.",
  keywords: [
    "MOT reminder",
    "MOT reminders",
    "free MOT reminder",
    "MOT reminder email",
    "MOT expiry reminder",
    "MOT due date alert",
    "set MOT reminder",
    "MOT reminder service",
  ],
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/mot-reminder",
  },
  openGraph: {
    title: "Free MOT Reminders by Email — Choose When You're Reminded",
    description:
      "Set a free MOT reminder by email — you choose when. Book early and keep your renewal date. Add up to 5 vehicles in one go.",
    url: "https://www.freeplatecheck.co.uk/mot-reminder",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free MOT Reminders by Email — Choose When You're Reminded",
    description:
      "Set a free MOT reminder by email — you choose when. Book early and keep your renewal date. Add up to 5 vehicles in one go.",
  },
};

export default function MotReminderPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
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
      "Set up a free MOT reminder for any UK vehicle. Choose when you're reminded — 5 weeks and 1 week before expiry by default.",
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Free MOT Reminder Service",
    description:
      "Free email reminder service — choose when you're reminded before your MOT expires (5 weeks and 1 week before by default). No account required, no marketing emails — just timely reminders to keep your vehicle legal.",
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

      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/tools"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to all tools
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
        {/* Primary signup form */}
        <MOTReminderSignup context="generic" triggerVariant="reminder_page" allowTimingPicker />

        <StatCallouts
          stats={[
            { value: "You choose", label: "When we remind you" },
            { value: "£1,000", label: "Max fine for no MOT", tone: "danger" },
            { value: "£0", label: "Always free", tone: "good" },
          ]}
        />

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">How it works</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">1</span>
                <div>
                  <p className="font-semibold text-slate-100">Enter your reg and email</p>
                  <p className="text-sm mt-1">Up to 5 vehicles at once.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">2</span>
                <div>
                  <p className="font-semibold text-slate-100">We pull the expiry from DVLA</p>
                  <p className="text-sm mt-1">No need to look it up yourself.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">3</span>
                <div>
                  <p className="font-semibold text-slate-100">Reminders when you want them</p>
                  <p className="text-sm mt-1">5 weeks and 1 week before by default — or pick your own timing. The early nudge means you can test up to a month early and keep your renewal date.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">4</span>
                <div>
                  <p className="font-semibold text-slate-100">Each reminder includes local garage prices</p>
                  <p className="text-sm mt-1">Direct link to compare MOT prices near you via BookMyGarage.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Why set an MOT reminder?</h2>
            <p className="leading-relaxed mb-3">
              Easy to forget; consequences aren&apos;t small:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">Up to £1,000 fine</strong> — driving without a valid MOT is a criminal offence.</li>
              <li><strong className="text-slate-100">Insurance may be void</strong> — most policies require a valid MOT. Crash without one and you may be personally liable.</li>
              <li><strong className="text-slate-100">ANPR cameras flag it automatically</strong> — no need for police to stop you to be caught.</li>
              <li><strong className="text-slate-100">Save money</strong> — an early reminder lets you test up to a month before, keep your renewal date, and compare local garage prices instead of paying the chain rate.</li>
            </ul>
            <p className="leading-relaxed">
              More in our <Link href="/blog/what-happens-driving-without-mot" className="text-blue-400 hover:text-blue-300">guide to driving without an MOT</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">What&apos;s in the reminder email?</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
              <li><strong className="text-slate-100">MOT expiry date</strong></li>
              <li><strong className="text-slate-100">Days remaining</strong></li>
              <li><strong className="text-slate-100">Local garage prices</strong> via BookMyGarage</li>
            </ul>
            <p className="leading-relaxed">
              No clutter, no ads, no upsells. Run a full <a href="/mot-check" className="text-blue-400 hover:text-blue-300">MOT history</a> or <a href="/tax-check" className="text-blue-400 hover:text-blue-300">tax check</a> any time.
            </p>
          </section>

          <section>
            <MOTBookingCTA regNumber="" context="neutral" />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Frequently asked questions</h2>
            <FaqAccordion items={FAQ_ITEMS} />
          </section>
        </div>
      </div>

      {/* Related guides */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/blog/when-is-my-mot-due" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">When Is My MOT Due?</p>
            <p className="text-xs text-slate-500 mt-2">How to check when your MOT is due and make sure you never miss it.</p>
          </Link>
          <Link href="/blog/what-happens-driving-without-mot" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">What Happens if You Drive Without an MOT?</p>
            <p className="text-xs text-slate-500 mt-2">Penalties, insurance issues, and the exceptions you need to know about.</p>
          </Link>
          <Link href="/blog/how-to-read-mot-history" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Read a Car&apos;s MOT History</p>
            <p className="text-xs text-slate-500 mt-2">Understand test results, advisories, and how to spot red flags in a vehicle&apos;s history.</p>
          </Link>
          <Link href="/blog/how-to-appeal-mot-failure" className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
            <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">How to Appeal an MOT Failure</p>
            <p className="text-xs text-slate-500 mt-2">Your rights explained — how the appeal process works and when it&apos;s worth challenging.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
