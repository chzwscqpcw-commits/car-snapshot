import type { Metadata } from "next";

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

const DARK_EMBED_CODE = `<div id="fpc-widget"></div>
<script src="https://www.freeplatecheck.co.uk/widget.js" data-theme="dark"></script>`;

const LIGHT_EMBED_CODE = `<div id="fpc-widget"></div>
<script src="https://www.freeplatecheck.co.uk/widget.js" data-theme="light"></script>`;

const CUSTOM_TARGET_CODE = `<div id="my-vehicle-checker"></div>
<script src="https://www.freeplatecheck.co.uk/widget.js" data-theme="dark" data-target="my-vehicle-checker"></script>`;

function CopyBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="relative group">
      <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
        {label}
      </p>
      <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 overflow-x-auto text-sm text-slate-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to Free Plate Check
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            Free Vehicle Check Widget
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Embed a vehicle check on your website in seconds
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-invert max-w-none space-y-10 text-slate-300">
          {/* Intro */}
          <section>
            <p className="text-lg">
              Add a free UK vehicle check to your website, forum, or blog. Your
              visitors can enter a registration number and instantly check MOT
              history, tax status, mileage, and more &mdash; all powered by Free
              Plate Check.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm font-medium">
                100% Free
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-4 py-1.5 text-sm font-medium">
                No API Key Needed
              </span>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-4 py-1.5 text-sm font-medium">
                No Dependencies
              </span>
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-4 py-1.5 text-sm font-medium">
                Responsive
              </span>
            </div>
          </section>

          {/* Live Preview */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Live Preview
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Dark preview */}
              <div>
                <p className="text-sm text-slate-400 mb-3 font-medium">
                  Dark Theme
                </p>
                <div className="bg-slate-800 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                  <div
                    style={{
                      fontFamily:
                        "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
                      maxWidth: 400,
                      width: "100%",
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <div style={{ marginBottom: 16, textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#f1f5f9",
                          marginBottom: 4,
                        }}
                      >
                        Free Plate Check
                      </div>
                      <div style={{ fontSize: 13, color: "#94a3b8" }}>
                        Check any UK vehicle free
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Enter reg"
                        disabled
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: "10px 12px",
                          fontSize: 16,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          border: "2px solid #d97706",
                          borderRadius: 6,
                          background: "#fbbf24",
                          color: "#0f172a",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        disabled
                        style={{
                          padding: "10px 16px",
                          fontSize: 14,
                          fontWeight: 600,
                          border: "none",
                          borderRadius: 6,
                          cursor: "default",
                          whiteSpace: "nowrap",
                          background: "#3b82f6",
                          color: "#ffffff",
                        }}
                      >
                        Check Vehicle
                      </button>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: 11,
                        color: "#94a3b8",
                      }}
                    >
                      Powered by{" "}
                      <span style={{ color: "#60a5fa" }}>
                        Free Plate Check
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Light preview */}
              <div>
                <p className="text-sm text-slate-400 mb-3 font-medium">
                  Light Theme
                </p>
                <div className="bg-slate-200 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                  <div
                    style={{
                      fontFamily:
                        "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
                      maxWidth: 400,
                      width: "100%",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <div style={{ marginBottom: 16, textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#0f172a",
                          marginBottom: 4,
                        }}
                      >
                        Free Plate Check
                      </div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        Check any UK vehicle free
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Enter reg"
                        disabled
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: "10px 12px",
                          fontSize: 16,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          border: "2px solid #d97706",
                          borderRadius: 6,
                          background: "#fbbf24",
                          color: "#0f172a",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        disabled
                        style={{
                          padding: "10px 16px",
                          fontSize: 14,
                          fontWeight: 600,
                          border: "none",
                          borderRadius: 6,
                          cursor: "default",
                          whiteSpace: "nowrap",
                          background: "#2563eb",
                          color: "#ffffff",
                        }}
                      >
                        Check Vehicle
                      </button>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: 11,
                        color: "#64748b",
                      }}
                    >
                      Powered by{" "}
                      <span style={{ color: "#2563eb" }}>
                        Free Plate Check
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Start */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Quick Start
            </h2>
            <p className="mb-4">
              Copy and paste this code into your HTML where you want the widget
              to appear:
            </p>
            <CopyBlock code={DARK_EMBED_CODE} label="Dark Theme (default)" />
          </section>

          {/* Light Theme */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Light Theme
            </h2>
            <p className="mb-4">
              For sites with a light background, use the light theme variant:
            </p>
            <CopyBlock code={LIGHT_EMBED_CODE} label="Light Theme" />
          </section>

          {/* Custom Target */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Custom Target Element
            </h2>
            <p className="mb-4">
              If you already have an element with a different ID, use the{" "}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 text-sm">
                data-target
              </code>{" "}
              attribute to specify where the widget should render:
            </p>
            <CopyBlock
              code={CUSTOM_TARGET_CODE}
              label="Custom target element"
            />
          </section>

          {/* Configuration */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Configuration Options
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
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
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      <code className="text-blue-400">data-theme</code>
                    </td>
                    <td className="py-3 px-4">
                      <code>&quot;dark&quot;</code> |{" "}
                      <code>&quot;light&quot;</code>
                    </td>
                    <td className="py-3 px-4">
                      <code>&quot;dark&quot;</code>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      Colour scheme of the widget
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      <code className="text-blue-400">data-target</code>
                    </td>
                    <td className="py-3 px-4">Any element ID</td>
                    <td className="py-3 px-4">
                      <code>&quot;fpc-widget&quot;</code>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      ID of the container element
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              How It Works
            </h2>
            <ol className="list-decimal list-inside space-y-3 ml-2">
              <li>
                The widget renders a small branded form on your page
              </li>
              <li>
                Your visitor enters a UK vehicle registration number
              </li>
              <li>
                Clicking &ldquo;Check Vehicle&rdquo; opens the full results on
                freeplatecheck.co.uk in a new tab
              </li>
              <li>
                Your visitor gets a complete free vehicle report: MOT history,
                tax status, mileage, recalls, valuations, and more
              </li>
            </ol>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Is it really free?
                </h3>
                <p>
                  Yes. The widget and all vehicle checks are completely free.
                  There are no hidden charges, API keys, or usage limits.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Does it load any external CSS or frameworks?
                </h3>
                <p>
                  No. The widget is a single self-contained JavaScript file with
                  all styles inline. It has no dependencies and won&apos;t
                  interfere with your existing styles.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Can I use it on a commercial site?
                </h3>
                <p>
                  Absolutely. Dealers, garages, car bloggers, and forums are all
                  welcome to embed the widget. We just ask that you keep the
                  &ldquo;Powered by&rdquo; attribution link.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  What data does it collect?
                </h3>
                <p>
                  The widget itself collects no data. When a visitor submits a
                  registration, they are taken to freeplatecheck.co.uk where our
                  standard{" "}
                  <a
                    href="/privacy"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    privacy policy
                  </a>{" "}
                  applies.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  Is it responsive?
                </h3>
                <p>
                  Yes. The widget adapts to any container width from 280px
                  upwards. It has a max-width of 400px and centres itself
                  automatically.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-slate-900 border border-slate-800 rounded-lg p-6 mt-12 text-center">
            <p className="text-slate-200 text-lg font-semibold mb-2">
              Questions or feedback?
            </p>
            <p className="text-slate-400">
              Get in touch at{" "}
              <a
                href="mailto:hello@freeplatecheck.co.uk"
                className="text-blue-400 hover:text-blue-300"
              >
                hello@freeplatecheck.co.uk
              </a>
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">
              Home
            </a>
            <span>&bull;</span>
            <a href="/blog" className="hover:text-slate-300">
              Guides
            </a>
            <span>&bull;</span>
            <a href="/privacy" className="hover:text-slate-300">
              Privacy Policy
            </a>
            <span>&bull;</span>
            <a href="/terms" className="hover:text-slate-300">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
