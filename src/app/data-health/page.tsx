import recalls from "@/data/recalls.json";
import fuelEconomy from "@/data/fuel-economy.json";
import ncapRatings from "@/data/ncap-ratings.json";
import newPrices from "@/data/new-prices.json";
import evSpecs from "@/data/ev-specs.json";
import howManyLeft from "@/data/how-many-left.json";
import motPassRates from "@/data/mot-pass-rates.json";
import motFailureReasons from "@/data/mot-failure-reasons.json";
import bodyTypes from "@/data/body-types.json";
import theftRisk from "@/data/theft-risk.json";
import colourPopularity from "@/data/colour-popularity.json";
import tyreSizes from "@/data/tyre-sizes.json";
import vehicleDimensions from "@/data/vehicle-dimensions.json";

export const dynamic = "force-static";

export const metadata = {
  title: "Data Health | Free Plate Check",
  robots: { index: false, follow: false },
};

const BUILD_TIME = new Date().toISOString();
const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

function count(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (typeof data === "object" && data !== null) return Object.keys(data).length;
  return 0;
}

const files: { file: string; entries: number; type: string; source: "auto" | "curated" }[] = [
  { file: "recalls.json", entries: count(recalls), type: "Array", source: "auto" },
  { file: "fuel-economy.json", entries: count(fuelEconomy), type: "Array", source: "curated" },
  { file: "ncap-ratings.json", entries: count(ncapRatings), type: "Array", source: "curated" },
  { file: "new-prices.json", entries: count(newPrices), type: "Array", source: "curated" },
  { file: "ev-specs.json", entries: count(evSpecs), type: "Array", source: "curated" },
  { file: "how-many-left.json", entries: count(howManyLeft), type: "Object", source: "auto" },
  { file: "mot-pass-rates.json", entries: count(motPassRates), type: "Object", source: "curated" },
  { file: "mot-failure-reasons.json", entries: count(motFailureReasons), type: "Object", source: "curated" },
  { file: "body-types.json", entries: count(bodyTypes), type: "Object", source: "auto" },
  { file: "theft-risk.json", entries: count(theftRisk), type: "Object", source: "curated" },
  { file: "colour-popularity.json", entries: count(colourPopularity), type: "Object", source: "curated" },
  { file: "tyre-sizes.json", entries: count(tyreSizes), type: "Object", source: "curated" },
  { file: "vehicle-dimensions.json", entries: count(vehicleDimensions), type: "Object", source: "curated" },
];

const totalEntries = files.reduce((sum, f) => sum + f.entries, 0);

export default function DataHealthPage() {
  const buildDate = new Date(BUILD_TIME);
  const formattedDate = buildDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = buildDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const shortCommit = COMMIT === "local" ? "local" : COMMIT.slice(0, 7);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Data Health Dashboard</h1>
          <p className="text-slate-400 text-sm">Build-time snapshot of all data files powering Free Plate Check</p>
        </div>

        {/* Build info cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">Built</p>
            <p className="text-white font-semibold text-sm">{formattedDate}</p>
            <p className="text-slate-400 text-xs">{formattedTime} UTC</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">Commit</p>
            <p className="text-white font-mono font-semibold text-sm">{shortCommit}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">Total Entries</p>
            <p className="text-white font-semibold text-sm">{totalEntries.toLocaleString()}</p>
            <p className="text-slate-400 text-xs">across {files.length} files</p>
          </div>
        </div>

        {/* Validation status */}
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-4 mb-8 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-300 font-semibold text-sm">All {files.length} files validated at build time</p>
            <p className="text-emerald-400/70 text-xs">Prebuild validation passed — schema checks, entry thresholds, and field-level rules</p>
          </div>
        </div>

        {/* Data files table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Data Files</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800/50">
                <th className="text-left px-5 py-2.5 font-medium">File</th>
                <th className="text-right px-5 py-2.5 font-medium">Entries</th>
                <th className="text-right px-5 py-2.5 font-medium">Type</th>
                <th className="text-right px-5 py-2.5 font-medium">Refresh</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr
                  key={f.file}
                  className={`border-b border-slate-800/30 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-900/50"} hover:bg-slate-800/50 transition-colors`}
                >
                  <td className="px-5 py-3">
                    <span className="text-slate-200 font-mono text-xs">{f.file}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-white font-semibold tabular-nums">{f.entries.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-slate-400 text-xs">{f.type}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {f.source === "auto" ? (
                      <span className="inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-900/50 text-sky-300 border border-sky-800/50">
                        Auto
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                        Manual
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8">
          This page is not indexed. Validation runs automatically before every deploy.
        </p>
      </div>
    </div>
  );
}
