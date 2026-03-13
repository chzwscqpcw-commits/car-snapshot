import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  MODEL_REGISTRY,
  findModelEntry,
  getModelGuideData,
  getModelsForMake,
  getDisplayMake,
  getDisplayModel,
  type ModelGuideData,
  type DepreciationPoint,
  type FaqItem,
} from "@/lib/model-guides";

// ── Static generation ────────────────────────────────────────────────────────

export function generateStaticParams() {
  return MODEL_REGISTRY.map((m) => ({
    make: m.makeSlug,
    model: m.modelSlug,
  }));
}

// ── Metadata ─────────────────────────────────────────────────────────────────

type PageProps = { params: Promise<{ make: string; model: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { make, model } = await params;
  const entry = findModelEntry(make, model);
  if (!entry) return {};

  const data = getModelGuideData(make, model);
  if (!data) return {};

  const title = `${data.displayName} — Reliability, Safety & Running Costs | Free Plate Check`;

  // Build a compelling, data-rich description (target 120-160 chars)
  const highlights: string[] = [];
  if (data.motPassRate) {
    highlights.push(
      `${data.motPassRate.passRate}% MOT pass rate${data.motPassRate.aboveAverage ? " (above average)" : ""}`
    );
  }
  if (data.ncap) {
    highlights.push(`${data.ncap.overallStars}-star NCAP safety`);
  }
  if (data.runningCosts) {
    highlights.push(`£${data.runningCosts.monthlyCost}/mo running costs`);
  }
  if (data.fuelEconomy && !data.isEv) {
    highlights.push(`${data.fuelEconomy.combinedMpg} mpg`);
  }
  if (data.isEv && data.evSpecs.length > 0) {
    highlights.push(`${data.evSpecs[0].rangeWltp}-mile range`);
  }

  const suffix = "Free MOT history, recalls & valuation check.";
  const prefix = `${data.displayName} buyer's guide`;

  // Join highlights with commas, trim to fit ~155 chars total
  let description: string;
  if (highlights.length > 0) {
    const joined = highlights.join(", ");
    const full = `${prefix} — ${joined}. ${suffix}`;
    if (full.length <= 160) {
      description = full;
    } else {
      // Drop highlights from the end until it fits
      let trimmed = highlights.slice(0);
      while (trimmed.length > 1) {
        trimmed.pop();
        const candidate = `${prefix} — ${trimmed.join(", ")}. ${suffix}`;
        if (candidate.length <= 160) {
          description = candidate;
          break;
        }
      }
      description ??= `${prefix} — ${trimmed[0]}. ${suffix}`;
    }
  } else {
    description = `${prefix}. Reliability, safety & running costs. ${suffix}`;
  }

  return {
    title,
    description: description.replace(/\s+/g, " ").trim(),
    keywords: [
      `${data.displayName} review`,
      `${data.displayName} reliability`,
      `${data.displayName} MOT pass rate`,
      `${data.displayName} running costs`,
      `${data.displayName} safety rating`,
      `${data.displayModel} buyer guide`,
      `is the ${data.displayName} reliable`,
    ],
    alternates: {
      canonical: `https://www.freeplatecheck.co.uk/cars/${make}/${model}`,
    },
    openGraph: {
      title: `${data.displayName} — Buyer's Guide`,
      description: description.replace(/\s+/g, " ").trim(),
      url: `https://www.freeplatecheck.co.uk/cars/${make}/${model}`,
      siteName: "Free Plate Check",
      locale: "en_GB",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.displayName} — Buyer's Guide`,
      description: description.replace(/\s+/g, " ").trim(),
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${stars} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= stars ? "text-amber-400" : "text-slate-600"}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "warn" | "risk" | "info";
}) {
  const border =
    tone === "good"
      ? "border-emerald-700/40"
      : tone === "warn"
        ? "border-amber-700/40"
        : tone === "risk"
          ? "border-red-700/40"
          : "border-slate-700/40";
  return (
    <div
      className={`p-4 bg-slate-900/60 border ${border} rounded-lg text-center`}
    >
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function DepreciationTable({ curve, newPrice }: { curve: DepreciationPoint[]; newPrice: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th className="py-2 text-left font-medium">Age</th>
            <th className="py-2 text-right font-medium">Retained</th>
            <th className="py-2 text-right font-medium">Est. Value</th>
            <th className="py-2 text-right font-medium">Lost</th>
          </tr>
        </thead>
        <tbody>
          {curve.map((p) => (
            <tr
              key={p.year}
              className="border-b border-slate-800/50 text-slate-300"
            >
              <td className="py-2">{p.year} year{p.year !== 1 ? "s" : ""}</td>
              <td className="py-2 text-right">{p.retainedPercent}%</td>
              <td className="py-2 text-right">
                &pound;{p.estimatedValue.toLocaleString("en-GB")}
              </td>
              <td className="py-2 text-right text-red-400">
                &minus;&pound;
                {(newPrice - p.estimatedValue).toLocaleString("en-GB")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i}>
          <h3 className="font-semibold text-slate-100">{item.question}</h3>
          <p className="text-sm mt-1 text-slate-300">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ModelGuidePage({ params }: PageProps) {
  const { make, model } = await params;
  const data = getModelGuideData(make, model);
  if (!data) notFound();

  const siblings = getModelsForMake(make).filter(
    (m) => m.modelSlug !== model,
  );

  // JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Cars", item: "https://www.freeplatecheck.co.uk/cars" },
      { "@type": "ListItem", position: 3, name: data.displayMake, item: `https://www.freeplatecheck.co.uk/cars/${make}` },
      { "@type": "ListItem", position: 4, name: data.displayModel, item: `https://www.freeplatecheck.co.uk/cars/${make}/${model}` },
    ],
  };

  const faqJsonLd =
    data.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: data.faq.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  const passRateTone: "good" | "warn" | "risk" | "info" = data.motPassRate
    ? data.motPassRate.aboveAverage
      ? "good"
      : "warn"
    : "info";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <a href="/cars" className="text-blue-400 hover:text-blue-300">
              Cars
            </a>
            <span>/</span>
            <a
              href={`/cars/${make}`}
              className="text-blue-400 hover:text-blue-300"
            >
              {data.displayMake}
            </a>
            <span>/</span>
            <span className="text-slate-300">{data.displayModel}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">
            {data.displayName} — Buyer&apos;s Guide
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Reliability, safety, running costs and what to check before you buy.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center mb-12">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check a specific {data.displayName}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter a registration number to see MOT history, tax status,
            mileage, recalls and more for any {data.displayName}.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Look up a {data.displayName}
          </a>
        </div>

        <div className="space-y-10 text-slate-300">
          {/* ── Overview narrative ──────────────────────────────────────── */}
          {data.narrative.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                {data.displayName} overview
              </h2>
              {data.narrative.map((p, i) => (
                <p key={i} className="leading-relaxed mb-3">
                  {p}
                </p>
              ))}
            </section>
          )}

          {/* ── Key stats grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.ncap && (
              <div className="p-4 bg-slate-900/60 border border-slate-700/40 rounded-lg text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  NCAP Safety
                </p>
                <div className="flex justify-center mt-2">
                  <StarRating stars={data.ncap.overallStars} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {data.ncap.yearTested}
                </p>
              </div>
            )}
            {data.motPassRate && (
              <StatCard
                label="MOT Pass Rate"
                value={`${data.motPassRate.passRate}%`}
                sub={`${data.motPassRate.testCount.toLocaleString("en-GB")} tests`}
                tone={passRateTone}
              />
            )}
            {data.runningCosts && (
              <StatCard
                label="Monthly Cost"
                value={`\u00A3${data.runningCosts.monthlyCost}`}
                sub="est. annual total"
                tone="info"
              />
            )}
            {data.newPrice && (
              <StatCard
                label="New From"
                value={`\u00A3${data.newPrice.toLocaleString("en-GB")}`}
                tone="info"
              />
            )}
          </div>

          {/* ── Safety ─────────────────────────────────────────────────── */}
          {data.ncap && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Safety rating
              </h2>
              <p className="leading-relaxed mb-4">
                Euro NCAP tested the {data.displayModel} in{" "}
                {data.ncap.yearTested} and awarded it{" "}
                <strong className="text-slate-100">
                  {data.ncap.overallStars} out of 5 stars
                </strong>
                .
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Adult Occupant"
                  value={`${data.ncap.adultOccupant}%`}
                  tone={data.ncap.adultOccupant >= 80 ? "good" : "warn"}
                />
                <StatCard
                  label="Child Occupant"
                  value={`${data.ncap.childOccupant}%`}
                  tone={data.ncap.childOccupant >= 70 ? "good" : "warn"}
                />
                <StatCard
                  label="Pedestrian"
                  value={`${data.ncap.pedestrian}%`}
                  tone={data.ncap.pedestrian >= 60 ? "good" : "warn"}
                />
                <StatCard
                  label="Safety Assist"
                  value={`${data.ncap.safetyAssist}%`}
                  tone={data.ncap.safetyAssist >= 60 ? "good" : "warn"}
                />
              </div>
            </section>
          )}

          {/* ── Recalls ────────────────────────────────────────────────── */}
          {data.recalls.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Safety recalls
              </h2>
              <p className="leading-relaxed mb-4">
                There {data.recalls.length === 1 ? "is" : "are"}{" "}
                <strong className="text-slate-100">
                  {data.recalls.length} known DVSA recall
                  {data.recalls.length !== 1 ? "s" : ""}
                </strong>{" "}
                affecting the {data.displayName}. Enter a registration number to
                check whether a specific vehicle is affected.
              </p>
              <div className="space-y-3">
                {data.recalls.slice(0, 5).map((r, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-900/60 border border-red-900/30 rounded-lg"
                  >
                    <p className="text-sm font-medium text-red-400">
                      {r.recallNumber}
                    </p>
                    <p className="text-sm mt-1">{r.defect}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Build dates: {r.buildDateStart} to {r.buildDateEnd}
                    </p>
                  </div>
                ))}
                {data.recalls.length > 5 && (
                  <p className="text-sm text-slate-500">
                    + {data.recalls.length - 5} more recall
                    {data.recalls.length - 5 !== 1 ? "s" : ""}. Check a
                    specific vehicle to see the full list.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ── Reliability ────────────────────────────────────────────── */}
          {data.motPassRate && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Reliability &amp; MOT
              </h2>
              <p className="leading-relaxed mb-4">
                Based on{" "}
                {data.motPassRate.testCount.toLocaleString("en-GB")} MOT
                tests, the {data.displayModel} has a first-time pass rate of{" "}
                <strong className="text-slate-100">
                  {data.motPassRate.passRate}%
                </strong>{" "}
                — {data.motPassRate.aboveAverage ? "above" : "below"} the UK
                national average of {data.motPassRate.nationalAverage}%.
              </p>
              {data.motPassRate.aboveAverage ? (
                <p className="leading-relaxed">
                  This is a positive sign for reliability. The{" "}
                  {data.displayModel} is less likely to have issues at MOT
                  time than the average car on UK roads.
                </p>
              ) : (
                <p className="leading-relaxed">
                  This is slightly below average, which may mean the{" "}
                  {data.displayModel} needs more careful attention at MOT
                  time. Checking a specific vehicle&apos;s MOT history can reveal
                  whether it has a clean record.
                </p>
              )}
            </section>
          )}

          {/* ── Running costs ──────────────────────────────────────────── */}
          {data.runningCosts && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Running costs
              </h2>
              <p className="leading-relaxed mb-4">
                Annual running costs for a typical 5-year-old{" "}
                {data.displayName} are estimated at around{" "}
                <strong className="text-slate-100">
                  &pound;
                  {data.runningCosts.totalAnnual.toLocaleString("en-GB")}
                </strong>{" "}
                per year, or &pound;{data.runningCosts.monthlyCost} per
                month.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {data.runningCosts.breakdown.fuel != null && (
                  <StatCard
                    label="Fuel"
                    value={`\u00A3${data.runningCosts.breakdown.fuel.toLocaleString("en-GB")}`}
                    sub="/year"
                    tone="info"
                  />
                )}
                {data.runningCosts.breakdown.ved != null && (
                  <StatCard
                    label="Road Tax"
                    value={`\u00A3${data.runningCosts.breakdown.ved}`}
                    sub="/year"
                    tone="info"
                  />
                )}
                {data.runningCosts.breakdown.depreciation != null && (
                  <StatCard
                    label="Depreciation"
                    value={`\u00A3${data.runningCosts.breakdown.depreciation.toLocaleString("en-GB")}`}
                    sub="/year"
                    tone="info"
                  />
                )}
                {data.runningCosts.breakdown.mot != null && (
                  <StatCard
                    label="MOT"
                    value={`\u00A3${data.runningCosts.breakdown.mot}`}
                    sub="/year"
                    tone="info"
                  />
                )}
              </div>
              <p className="text-xs text-slate-500">
                {data.runningCosts.disclaimer}
              </p>
            </section>
          )}

          {/* ── Fuel economy ───────────────────────────────────────────── */}
          {data.fuelEconomy && !data.isEv && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Fuel economy
              </h2>
              <p className="leading-relaxed mb-4">
                The {data.displayModel} achieves a combined fuel economy of
                around{" "}
                <strong className="text-slate-100">
                  {data.fuelEconomy.combinedMpg} mpg
                </strong>
                {data.fuelEconomy.urbanMpg &&
                  ` (${data.fuelEconomy.urbanMpg} mpg urban, ${data.fuelEconomy.extraUrbanMpg} mpg extra-urban)`}
                .
              </p>
              {data.fuelVariants.length > 1 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700">
                        <th className="py-2 text-left font-medium">Variant</th>
                        <th className="py-2 text-right font-medium">Fuel</th>
                        <th className="py-2 text-right font-medium">Combined</th>
                        <th className="py-2 text-right font-medium">Engine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.fuelVariants.slice(0, 8).map((v, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-800/50 text-slate-300"
                        >
                          <td className="py-2">{v.model}</td>
                          <td className="py-2 text-right">{v.fuelType}</td>
                          <td className="py-2 text-right">
                            {v.combinedMpg} mpg
                          </td>
                          <td className="py-2 text-right">
                            {v.engineCapacity
                              ? `${(v.engineCapacity / 1000).toFixed(1)}L`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ── EV specs ───────────────────────────────────────────────── */}
          {data.isEv && data.evSpecs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Electric specifications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatCard
                  label="Battery"
                  value={`${data.evSpecs[0].batteryKwh} kWh`}
                  tone="info"
                />
                <StatCard
                  label="Range (WLTP)"
                  value={`${data.evSpecs[0].rangeWltp} mi`}
                  tone="info"
                />
                {data.evSpecs[0].motorKw && (
                  <StatCard
                    label="Motor"
                    value={`${data.evSpecs[0].motorKw} kW`}
                    sub={`${Math.round(data.evSpecs[0].motorKw * 1.341)} bhp`}
                    tone="info"
                  />
                )}
                {data.evSpecs[0].driveType && (
                  <StatCard
                    label="Drive"
                    value={data.evSpecs[0].driveType}
                    tone="info"
                  />
                )}
              </div>
              {data.evSpecs[0].chargeFast && (
                <p className="text-sm text-slate-400">
                  Rapid charge: {data.evSpecs[0].chargeFast}
                  {data.evSpecs[0].chargeSlow &&
                    ` | Home charge: ${data.evSpecs[0].chargeSlow}`}
                </p>
              )}
            </section>
          )}

          {/* ── Depreciation ───────────────────────────────────────────── */}
          {data.newPrice && data.depreciationCurve.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Depreciation
              </h2>
              <p className="leading-relaxed mb-4">
                Starting from &pound;
                {data.newPrice.toLocaleString("en-GB")} new, a{" "}
                {data.displayName} typically retains about{" "}
                <strong className="text-slate-100">
                  {data.depreciationCurve.find((p) => p.year === 3)
                    ?.retainedPercent ?? "–"}
                  % after 3 years
                </strong>{" "}
                and{" "}
                {data.depreciationCurve.find((p) => p.year === 5)
                  ?.retainedPercent ?? "–"}
                % after 5 years.
              </p>
              <DepreciationTable
                curve={data.depreciationCurve}
                newPrice={data.newPrice}
              />
            </section>
          )}

          {/* ── Theft risk ─────────────────────────────────────────────── */}
          {data.theftRisk && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Theft risk
              </h2>
              <p className="leading-relaxed">
                The {data.displayModel} has a theft rate of{" "}
                <strong className="text-slate-100">
                  {data.theftRisk.theftsPer1000} per 1,000
                </strong>{" "}
                registered vehicles, rated{" "}
                {data.theftRisk.riskCategory.replace("-", " ")} compared to the
                national average of {data.theftRisk.nationalAverage} per 1,000.
                {(data.theftRisk.riskCategory === "very-high" ||
                  data.theftRisk.riskCategory === "high") &&
                  " Consider additional security measures such as a steering lock or tracking device."}
              </p>
            </section>
          )}

          {/* ── Rarity ─────────────────────────────────────────────────── */}
          {data.rarity && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                How common is the {data.displayModel}?
              </h2>
              <p className="leading-relaxed">
                There are currently{" "}
                <strong className="text-slate-100">
                  {data.rarity.licensed.toLocaleString("en-GB")} licensed
                </strong>{" "}
                and {data.rarity.sorn.toLocaleString("en-GB")} SORN{" "}
                {data.displayModel}s in the UK ({data.rarity.total.toLocaleString("en-GB")}{" "}
                total). This makes it a{" "}
                {data.rarity.category.replace("-", " ")} vehicle on UK roads.
              </p>
            </section>
          )}

          {/* ── FAQ ────────────────────────────────────────────────────── */}
          {data.faq.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                Frequently asked questions
              </h2>
              <FaqSection items={data.faq} />
            </section>
          )}

          {/* ── Second CTA ─────────────────────────────────────────────── */}
          <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center">
            <p className="text-lg font-semibold text-slate-100 mb-2">
              Found a {data.displayName} you like?
            </p>
            <p className="text-sm text-slate-400 mb-4">
              Enter the registration to check its full MOT history, tax status,
              mileage, recalls and estimated value — all free.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Check a {data.displayModel} now
            </a>
          </div>

          {/* ── Related models ─────────────────────────────────────────── */}
          {siblings.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">
                More {data.displayMake} guides
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {siblings.map((s) => (
                  <a
                    key={s.modelSlug}
                    href={`/cars/${s.makeSlug}/${s.modelSlug}`}
                    className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                  >
                    <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                      {data.displayMake}{" "}
                      {getDisplayModel(s.model)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Reliability, safety &amp; running costs
                    </p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* ── Cross-links ────────────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              Related checks
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="/mot-check"
                className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                  Free MOT History Check
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  See every test result, advisory and failure since 2005.
                </p>
              </a>
              <a
                href="/car-valuation"
                className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                  Free Car Valuation
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Estimate what a vehicle is worth based on age, mileage and
                  condition.
                </p>
              </a>
              <a
                href="/recall-check"
                className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                  Safety Recall Check
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Check if a vehicle has any outstanding safety recalls.
                </p>
              </a>
              <a
                href="/ulez-check"
                className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                  ULEZ Compliance Check
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Check if a vehicle meets London ULEZ emission standards.
                </p>
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">
              Home
            </a>
            <span>&bull;</span>
            <a href="/cars" className="hover:text-slate-300">
              Car Guides
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

