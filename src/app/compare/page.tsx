"use client";

import { useState, useMemo } from "react";
import {
  Search,
  AlertCircle,
  Car,
  Gauge,
  ArrowLeftRight,
  History,
  FileText,
} from "lucide-react";
import Link from "next/link";

/* ---------- types ---------- */

type MOTTest = {
  completedDate: string;
  testResult: "PASSED" | "FAILED" | "NO DETAILS HELD";
  expiryDate?: string;
  odometer?: { value: number; unit: string };
  motTestNumber?: string;
  rfrAndComments?: Array<{ text: string; type: string }>;
};

type VehicleData = {
  registrationNumber: string;
  make?: string;
  model?: string;
  colour?: string;
  fuelType?: string;
  engineCapacity?: number;
  yearOfManufacture?: number;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  co2Emissions?: number;
  motTests?: MOTTest[];
  [key: string]: unknown;
};

/* ---------- helpers ---------- */

function cleanReg(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatDate(iso: string | undefined) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function motPassRate(tests: MOTTest[] | undefined) {
  if (!tests || tests.length === 0) return null;
  const passed = tests.filter((t) => t.testResult === "PASSED").length;
  return Math.round((passed / tests.length) * 100);
}

function advisoryCount(tests: MOTTest[] | undefined) {
  if (!tests) return 0;
  return tests.reduce((acc, t) => {
    return (
      acc +
      (t.rfrAndComments?.filter((r) => r.type === "ADVISORY").length ?? 0)
    );
  }, 0);
}

function latestMileage(tests: MOTTest[] | undefined) {
  if (!tests || tests.length === 0) return null;
  for (const t of tests) {
    if (t.odometer?.value) return t.odometer.value;
  }
  return null;
}

function avgAnnualMileage(tests: MOTTest[] | undefined) {
  if (!tests || tests.length < 2) return null;
  const sorted = [...tests]
    .filter((t) => t.odometer?.value)
    .sort(
      (a, b) =>
        new Date(a.completedDate).getTime() -
        new Date(b.completedDate).getTime()
    );
  if (sorted.length < 2) return null;
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];
  const years =
    (new Date(newest.completedDate).getTime() -
      new Date(oldest.completedDate).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);
  if (years < 0.25) return null;
  const miles = newest.odometer!.value - oldest.odometer!.value;
  return Math.round(miles / years);
}

function statusColor(status: string | undefined, type: "mot" | "tax") {
  if (!status) return "text-slate-400";
  const s = status.toLowerCase();
  if (type === "mot") {
    if (s === "valid") return "text-emerald-400";
    if (s.includes("no details")) return "text-slate-400";
    return "text-red-400";
  }
  if (s === "taxed") return "text-emerald-400";
  if (s === "sorn") return "text-amber-400";
  return "text-red-400";
}

function highlightBetter(a: number | null, b: number | null, higherIsBetter: boolean) {
  if (a === null || b === null) return { a: "", b: "" };
  if (a === b) return { a: "", b: "" };
  const aWins = higherIsBetter ? a > b : a < b;
  return {
    a: aWins ? "text-emerald-400 font-semibold" : "",
    b: aWins ? "" : "text-emerald-400 font-semibold",
  };
}

/* ---------- JSON-LD ---------- */

function BreadcrumbJsonLd() {
  const jsonLd = {
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
        name: "Compare Vehicles",
        item: "https://www.freeplatecheck.co.uk/compare",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ---------- metadata (exported from layout) ---------- */
// Since this is a client component, metadata is set via a separate layout or
// head approach. We use a <title> + meta tags in the head via the component.

/* ---------- main component ---------- */

export default function ComparePage() {
  const [reg1, setReg1] = useState("");
  const [reg2, setReg2] = useState("");
  const [vehicle1, setVehicle1] = useState<VehicleData | null>(null);
  const [vehicle2, setVehicle2] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleCompare() {
    const clean1 = cleanReg(reg1);
    const clean2 = cleanReg(reg2);

    if (!clean1 || !clean2) {
      setError("Please enter two registration numbers.");
      return;
    }
    if (clean1 === clean2) {
      setError("Please enter two different registration numbers.");
      return;
    }

    setError(null);
    setLoading(true);
    setHasSearched(true);
    setVehicle1(null);
    setVehicle2(null);

    try {
      const [res1, res2] = await Promise.all([
        fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vrm: clean1 }),
        }),
        fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vrm: clean2 }),
        }),
      ]);

      const json1 = await res1.json();
      const json2 = await res2.json();

      if (!json1.ok && !json2.ok) {
        setError("Neither vehicle was found. Please check both registrations.");
      } else if (!json1.ok) {
        setError(`Vehicle 1 not found: ${json1.error || "Unknown error"}`);
        if (json2.ok) setVehicle2(json2.data);
      } else if (!json2.ok) {
        setError(`Vehicle 2 not found: ${json2.error || "Unknown error"}`);
        if (json1.ok) setVehicle1(json1.data);
      } else {
        setVehicle1(json1.data);
        setVehicle2(json2.data);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* derived stats */
  const pr1 = useMemo(() => motPassRate(vehicle1?.motTests), [vehicle1]);
  const pr2 = useMemo(() => motPassRate(vehicle2?.motTests), [vehicle2]);
  const adv1 = useMemo(() => advisoryCount(vehicle1?.motTests), [vehicle1]);
  const adv2 = useMemo(() => advisoryCount(vehicle2?.motTests), [vehicle2]);
  const mi1 = useMemo(() => latestMileage(vehicle1?.motTests), [vehicle1]);
  const mi2 = useMemo(() => latestMileage(vehicle2?.motTests), [vehicle2]);
  const avg1 = useMemo(() => avgAnnualMileage(vehicle1?.motTests), [vehicle1]);
  const avg2 = useMemo(() => avgAnnualMileage(vehicle2?.motTests), [vehicle2]);

  const prHL = highlightBetter(pr1, pr2, true);
  const advHL = highlightBetter(adv1, adv2, false);
  const miHL = highlightBetter(mi1, mi2, false);
  const avgHL = highlightBetter(avg1, avg2, false);

  const bothLoaded = vehicle1 && vehicle2;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <BreadcrumbJsonLd />

      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to Free Plate Check
          </Link>
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-7 h-7 text-blue-400" />
            <h1 className="text-3xl font-bold text-slate-100">
              Compare Two Vehicles
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Enter two UK registration numbers to compare MOT history, tax
            status, mileage, and specifications side by side.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Input section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-stretch gap-4">
            {/* Reg 1 */}
            <div className="flex-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                Vehicle 1
              </label>
              <input
                type="text"
                value={reg1}
                onChange={(e) => {
                  setReg1(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCompare();
                }}
                placeholder="AB12 CDE"
                maxLength={10}
                className="w-full px-4 py-3 bg-yellow-400 text-slate-900 font-bold text-lg uppercase tracking-wider rounded-lg border-2 border-yellow-500 placeholder:text-yellow-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center"
                style={{ fontFamily: "Arial Black, sans-serif" }}
              />
            </div>

            {/* VS divider */}
            <div className="flex items-end justify-center pb-1 md:pb-0 md:items-end">
              <span className="text-slate-500 font-bold text-lg">vs</span>
            </div>

            {/* Reg 2 */}
            <div className="flex-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                Vehicle 2
              </label>
              <input
                type="text"
                value={reg2}
                onChange={(e) => {
                  setReg2(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCompare();
                }}
                placeholder="FG34 HIJ"
                maxLength={10}
                className="w-full px-4 py-3 bg-yellow-400 text-slate-900 font-bold text-lg uppercase tracking-wider rounded-lg border-2 border-yellow-500 placeholder:text-yellow-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center"
                style={{ fontFamily: "Arial Black, sans-serif" }}
              />
            </div>
          </div>

          {/* Compare button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleCompare}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all transform active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Compare Vehicles
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-900/40 rounded-lg text-red-100 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results */}
        {bothLoaded && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Vehicle headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[vehicle1, vehicle2].map((v, i) => (
                <div
                  key={i}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center"
                >
                  <div className="inline-block bg-yellow-300 border-2 border-yellow-800 rounded-sm px-3 py-1 mb-3">
                    <span
                      className="text-sm font-black text-black tracking-widest"
                      style={{
                        fontFamily: "Arial Black, sans-serif",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {v!.registrationNumber}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">
                    {v!.make} {v!.model}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {v!.yearOfManufacture} &middot; {v!.colour} &middot;{" "}
                    {v!.fuelType}
                  </p>
                </div>
              ))}
            </div>

            {/* Comparison table: Vehicle Details */}
            <ComparisonSection
              icon={<Car className="w-5 h-5 text-blue-400" />}
              title="Vehicle Details"
            >
              <CompRow label="Make" a={vehicle1!.make} b={vehicle2!.make} />
              <CompRow label="Model" a={vehicle1!.model} b={vehicle2!.model} />
              <CompRow
                label="Year"
                a={vehicle1!.yearOfManufacture?.toString()}
                b={vehicle2!.yearOfManufacture?.toString()}
              />
              <CompRow
                label="Colour"
                a={vehicle1!.colour}
                b={vehicle2!.colour}
              />
              <CompRow
                label="Fuel Type"
                a={vehicle1!.fuelType}
                b={vehicle2!.fuelType}
              />
              <CompRow
                label="Engine Size"
                a={
                  vehicle1!.engineCapacity
                    ? `${vehicle1!.engineCapacity} cc`
                    : undefined
                }
                b={
                  vehicle2!.engineCapacity
                    ? `${vehicle2!.engineCapacity} cc`
                    : undefined
                }
              />
              <CompRow
                label="CO2 Emissions"
                a={
                  vehicle1!.co2Emissions
                    ? `${vehicle1!.co2Emissions} g/km`
                    : undefined
                }
                b={
                  vehicle2!.co2Emissions
                    ? `${vehicle2!.co2Emissions} g/km`
                    : undefined
                }
              />
            </ComparisonSection>

            {/* Status */}
            <ComparisonSection
              icon={<FileText className="w-5 h-5 text-blue-400" />}
              title="Status"
            >
              <CompRowCustom label="MOT Status">
                <td className="py-2 px-3 text-center">
                  <span className={statusColor(vehicle1!.motStatus, "mot")}>
                    {vehicle1!.motStatus || "N/A"}
                  </span>
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={statusColor(vehicle2!.motStatus, "mot")}>
                    {vehicle2!.motStatus || "N/A"}
                  </span>
                </td>
              </CompRowCustom>
              <CompRow
                label="MOT Expires"
                a={formatDate(vehicle1!.motExpiryDate)}
                b={formatDate(vehicle2!.motExpiryDate)}
              />
              <CompRowCustom label="Tax Status">
                <td className="py-2 px-3 text-center">
                  <span className={statusColor(vehicle1!.taxStatus, "tax")}>
                    {vehicle1!.taxStatus || "N/A"}
                  </span>
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={statusColor(vehicle2!.taxStatus, "tax")}>
                    {vehicle2!.taxStatus || "N/A"}
                  </span>
                </td>
              </CompRowCustom>
              <CompRow
                label="Tax Due"
                a={formatDate(vehicle1!.taxDueDate)}
                b={formatDate(vehicle2!.taxDueDate)}
              />
            </ComparisonSection>

            {/* MOT History */}
            <ComparisonSection
              icon={<History className="w-5 h-5 text-blue-400" />}
              title="MOT History"
            >
              <CompRowCustom label="Pass Rate">
                <td className={`py-2 px-3 text-center ${prHL.a}`}>
                  {pr1 !== null ? `${pr1}%` : "N/A"}
                </td>
                <td className={`py-2 px-3 text-center ${prHL.b}`}>
                  {pr2 !== null ? `${pr2}%` : "N/A"}
                </td>
              </CompRowCustom>
              <CompRow
                label="Total Tests"
                a={vehicle1!.motTests?.length?.toString() ?? "0"}
                b={vehicle2!.motTests?.length?.toString() ?? "0"}
              />
              <CompRowCustom label="Total Advisories">
                <td className={`py-2 px-3 text-center ${advHL.a}`}>
                  {adv1}
                </td>
                <td className={`py-2 px-3 text-center ${advHL.b}`}>
                  {adv2}
                </td>
              </CompRowCustom>
            </ComparisonSection>

            {/* Mileage */}
            <ComparisonSection
              icon={<Gauge className="w-5 h-5 text-blue-400" />}
              title="Mileage"
            >
              <CompRowCustom label="Latest Mileage">
                <td className={`py-2 px-3 text-center ${miHL.a}`}>
                  {mi1 !== null ? `${mi1.toLocaleString()} mi` : "N/A"}
                </td>
                <td className={`py-2 px-3 text-center ${miHL.b}`}>
                  {mi2 !== null ? `${mi2.toLocaleString()} mi` : "N/A"}
                </td>
              </CompRowCustom>
              <CompRowCustom label="Avg Annual Mileage">
                <td className={`py-2 px-3 text-center ${avgHL.a}`}>
                  {avg1 !== null ? `${avg1.toLocaleString()} mi/yr` : "N/A"}
                </td>
                <td className={`py-2 px-3 text-center ${avgHL.b}`}>
                  {avg2 !== null ? `${avg2.toLocaleString()} mi/yr` : "N/A"}
                </td>
              </CompRowCustom>
            </ComparisonSection>

            {/* CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {[vehicle1, vehicle2].map((v, i) => (
                <Link
                  key={i}
                  href={`/?vrm=${v!.registrationNumber}`}
                  className="block bg-slate-900 border border-slate-800 rounded-xl p-5 text-center hover:border-blue-500/50 transition-colors group"
                >
                  <p className="text-slate-400 text-sm mb-1">
                    View full report for
                  </p>
                  <p className="text-blue-400 font-bold text-lg group-hover:text-blue-300 transition-colors">
                    {v!.registrationNumber}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!bothLoaded && !loading && hasSearched && !error && (
          <div className="text-center py-16 text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-500" />
            <p>Could not load both vehicles. Please check the registrations and try again.</p>
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-16">
            <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-400 mb-2">
              Compare any two UK vehicles
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Choosing between two used cars? Enter both registration numbers
              above to see how they stack up on MOT history, mileage, tax
              status, and more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- reusable table components ---------- */

function ComparisonSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-900/80">
        {icon}
        <h3 className="font-semibold text-slate-100">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
            <th className="py-2 px-3 text-left w-1/3">&nbsp;</th>
            <th className="py-2 px-3 text-center w-1/3">Vehicle 1</th>
            <th className="py-2 px-3 text-center w-1/3">Vehicle 2</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">{children}</tbody>
      </table>
    </div>
  );
}

function CompRow({
  label,
  a,
  b,
}: {
  label: string;
  a: string | undefined;
  b: string | undefined;
}) {
  return (
    <tr className="hover:bg-slate-800/30 transition-colors">
      <td className="py-2 px-3 text-slate-400 font-medium">{label}</td>
      <td className="py-2 px-3 text-center text-slate-100">{a || "N/A"}</td>
      <td className="py-2 px-3 text-center text-slate-100">{b || "N/A"}</td>
    </tr>
  );
}

function CompRowCustom({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="hover:bg-slate-800/30 transition-colors">
      <td className="py-2 px-3 text-slate-400 font-medium">{label}</td>
      {children}
    </tr>
  );
}
