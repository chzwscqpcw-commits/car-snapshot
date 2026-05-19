import type { Metadata } from "next";
import EmbedConfigurator from "@/components/EmbedConfigurator";
import BoltMark from "@/components/BoltMark";

export const metadata: Metadata = {
  title: "Free Vehicle Check Widget | Embed on Your Site | Free Plate Check",
  description:
    "Add a free UK vehicle check widget to your website. Easy embed code for forums, dealers, and bloggers. Let your visitors check any UK vehicle instantly.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/embed",
  },
  openGraph: {
    title: "Free Vehicle Check Widget | Embed on Your Site",
    description:
      "Add a free UK vehicle check widget to your website. Easy embed code for forums, dealers, and bloggers.",
    url: "https://www.freeplatecheck.co.uk/embed",
    siteName: "Free Plate Check",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Plate Check — Embeddable Widget",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Vehicle Check Widget | Embed on Your Site",
    description:
      "Add a free UK vehicle check widget to your website. Easy embed code for forums, dealers, and bloggers.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function EmbedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden border-b border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-950">
        <div className="absolute inset-0 opacity-30 pointer-events-none [background-image:radial-gradient(circle_at_30%_0%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(circle_at_70%_0%,rgba(139,92,246,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-8 sm:pt-14 sm:pb-10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-3">
            <BoltMark className="h-3.5 w-3.5" />
            Embeddable widget
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Drop a free vehicle check into your site.
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
            One <code className="text-cyan-300">&lt;script&gt;</code> tag. No
            framework, no API key, no dependencies. Configure the theme, size and
            accent below — the embed code updates live.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Free forever · no signup
            </span>
            <span>~4&nbsp;KB vanilla JS</span>
            <span>Responsive 280–420&nbsp;px</span>
            <span>Dark + light themes</span>
          </div>
        </div>
      </section>

      {/* ─── Live configurator ─── */}
      <EmbedConfigurator />

      {/* ─── Reference + FAQ ─── */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="space-y-10 text-slate-300">
          {/* Configuration reference */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Configuration reference
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/60">
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">
                      Attribute
                    </th>
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">
                      Values
                    </th>
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">
                      Default
                    </th>
                    <th className="text-left py-3 px-4 text-slate-200 font-semibold">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="font-[family-name:var(--font-geist-mono)]">
                  <ConfigRow
                    attr="data-theme"
                    values={`"dark" | "light"`}
                    defaultValue={`"dark"`}
                    description="Colour scheme of the widget."
                  />
                  <ConfigRow
                    attr="data-size"
                    values={`"full" | "compact"`}
                    defaultValue={`"full"`}
                    description="Compact is a single-line variant for sidebars and footers."
                  />
                  <ConfigRow
                    attr="data-accent"
                    values={`"cyan" | "emerald" | "amber" | "violet"`}
                    defaultValue={`"cyan"`}
                    description="Accent gradient used for the button and value pills."
                  />
                  <ConfigRow
                    attr="data-style"
                    values={`"modern" | "plate"`}
                    defaultValue={`"modern"`}
                    description={`Set to "plate" to keep the classic UK yellow input.`}
                  />
                  <ConfigRow
                    attr="data-target"
                    values="Any element ID"
                    defaultValue={`"fpc-widget"`}
                    description="ID of the container element where the widget renders."
                  />
                </tbody>
              </table>
            </div>
          </section>

          {/* How it works */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              How it works
            </h2>
            <ol className="list-decimal list-inside space-y-2.5 ml-2 marker:text-cyan-400">
              <li>The widget renders a small branded form on your page.</li>
              <li>
                Your visitor enters a UK vehicle registration number — the input
                supports keyboard, voice and paste.
              </li>
              <li>
                Tapping <span className="text-slate-100 font-medium">Check</span>{" "}
                opens the full results on freeplatecheck.co.uk in a new tab,
                tagged with{" "}
                <code className="text-cyan-300 text-xs">utm_source=widget</code>{" "}
                so you can see referrals in your analytics.
              </li>
              <li>
                Your visitor gets the full report: MOT history, tax status,
                mileage, recalls, valuation, running costs.
              </li>
            </ol>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-5">
              <Faq q="Is it really free?">
                Yes. The widget and all vehicle checks are completely free. No
                hidden charges, no API keys, no usage limits.
              </Faq>
              <Faq q="Does it load any external CSS or frameworks?">
                No. The widget is a single self-contained JavaScript file (~4&nbsp;KB)
                with all styles inline. No dependencies, no font downloads,
                nothing that will interfere with your existing styles.
              </Faq>
              <Faq q="Can I use it on a commercial site?">
                Absolutely. Dealers, garages, car bloggers and forums are all
                welcome to embed it. The only ask: keep the small &ldquo;Powered
                by&rdquo; link — it&apos;s how we cover the cost of running the
                free check.
              </Faq>
              <Faq q="What data does it collect?">
                The widget itself collects no data. When a visitor submits a
                registration, they&apos;re taken to freeplatecheck.co.uk where our
                standard{" "}
                <a href="/privacy" className="text-cyan-400 hover:text-cyan-300">
                  privacy policy
                </a>{" "}
                applies. Reg numbers are never stored.
              </Faq>
              <Faq q="Is it responsive?">
                Yes. The widget adapts to any container width from 280&nbsp;px
                upwards. Full size caps at 420&nbsp;px; compact caps at 340&nbsp;px.
                Both centre themselves automatically.
              </Faq>
              <Faq q="Can I use it inside a CMS like WordPress?">
                Yes — paste the snippet into a Custom HTML block (or wherever your
                CMS allows raw HTML). No plugin required.
              </Faq>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900/70 to-slate-900 p-6 text-center">
            <p className="text-slate-100 text-lg font-semibold mb-2">
              Questions or feedback?
            </p>
            <p className="text-slate-400 text-sm">
              Get in touch at{" "}
              <a
                href="mailto:hello@freeplatecheck.co.uk"
                className="text-cyan-400 hover:text-cyan-300"
              >
                hello@freeplatecheck.co.uk
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({
  attr,
  values,
  defaultValue,
  description,
}: {
  attr: string;
  values: string;
  defaultValue: string;
  description: string;
}) {
  return (
    <tr className="border-b border-slate-800 last:border-b-0">
      <td className="py-2.5 px-4">
        <code className="text-cyan-300 text-xs whitespace-nowrap">{attr}</code>
      </td>
      <td className="py-2.5 px-4 text-xs text-slate-300">{values}</td>
      <td className="py-2.5 px-4 text-xs text-slate-400">{defaultValue}</td>
      <td className="py-2.5 px-4 text-xs text-slate-400 font-sans">
        {description}
      </td>
    </tr>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-100 mb-1.5">{q}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}
