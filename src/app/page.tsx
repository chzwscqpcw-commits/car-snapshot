"use client";

import { useMemo, useState } from "react";

type VehicleData = {
  registrationNumber: string;

  make?: string;
  colour?: string;
  fuelType?: string;
  engineCapacity?: number;
  yearOfManufacture?: number;

  taxStatus?: string;
  taxDueDate?: string; // YYYY-MM-DD

  motStatus?: string;
  motExpiryDate?: string; // YYYY-MM-DD

  // Extra DVLA fields (may be missing on some vehicles)
  monthOfFirstRegistration?: string; // YYYY-MM
  dateOfFirstRegistration?: string; // YYYY-MM-DD (sometimes present)
  dateOfLastV5CIssued?: string; // YYYY-MM-DD
  markedForExport?: boolean;

  co2Emissions?: number;
  euroStatus?: string;
  realDrivingEmissions?: number;

  wheelplan?: string;
  revenueWeight?: number;
  typeApproval?: string;
  automatedVehicle?: boolean;
  additionalRateEndDate?: string; // YYYY-MM-DD
};

type LookupResponse =
  | {
      ok: true;
      data: VehicleData;
      source: string;
      cached: boolean;
      vrmHash?: string | null;
    }
  | {
      ok: false;
      error: string;
    };

type InsightTone = "good" | "warn" | "risk" | "info";
type Insight = { tone: InsightTone; title: string; detail: string };

function cleanReg(s: string) {
  return s.replace(/\s+/g, "").toUpperCase();
}

function looksLikeEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

function formatDate(iso?: string) {
  return iso ? iso : "—"; // stable, no locale hydration weirdness
}

function parseISODate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysSince(iso?: string) {
  const d = parseISODate(iso);
  if (!d) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// YYYY-MM + years => YYYY-MM (month/year only)
function addYearsToYearMonth(ym: string, years: number) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!year || !month) return null;
  const outYear = year + years;
  const outMonth = String(month).padStart(2, "0");
  return `${outYear}-${outMonth}`;
}

function extractEuroNumber(euroStatus?: string) {
  if (!euroStatus) return null;
  const m = /EURO\s*([0-9]+)/i.exec(euroStatus);
  return m ? Number(m[1]) : null;
}

export default function Page() {
  const [vrm, setVrm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<VehicleData | null>(null);
  const [meta, setMeta] = useState<{ source: string; cached: boolean } | null>(null);
  const [vrmHash, setVrmHash] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  // Email capture
  const [email, setEmail] = useState("");
  const [wantsReminders, setWantsReminders] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMsg, setSignupMsg] = useState<string | null>(null);

  const checklist = useMemo(() => {
    if (!data) return [];
    const items: string[] = [
      "Ask for full service history and receipts.",
      "Confirm the VIN on the car matches the V5C/logbook.",
      "Check tyres (tread + uneven wear) and look for warning lights.",
    ];

    const year = data.yearOfManufacture ?? 0;
    const fuel = (data.fuelType ?? "").toUpperCase();
    const mot = (data.motStatus ?? "").toLowerCase();

    if (fuel.includes("DIESEL")) items.push("Diesel: ask about DPF/EGR issues and motorway vs short-trip use.");
    if (year && year <= new Date().getFullYear() - 10) items.push("Older car: inspect for corrosion underneath and around arches.");
    if (mot && !mot.includes("valid")) items.push("MOT is not shown as valid: clarify why before viewing.");

    return items;
  }, [data]);

  const insights = useMemo<Insight[]>(() => {
    if (!data) return [];
    const list: Insight[] = [];

    const motLower = (data.motStatus ?? "").toLowerCase();
    const hasNoMotDetails = motLower.includes("no details held");
    const firstRegMonth = data.monthOfFirstRegistration;

    if (hasNoMotDetails && firstRegMonth) {
      const due = addYearsToYearMonth(firstRegMonth, 3);
      if (due) {
        list.push({
          tone: "info",
          title: "Likely under 3 years old",
          detail: `First MOT due around ${due} (month/year only — check V5C for exact date; NI rules can differ).`,
        });
      }
    }

    // ULEZ hint (carefully worded; always tell them to verify)
    const euroN = extractEuroNumber(data.euroStatus);
    const fuel = (data.fuelType ?? "").toUpperCase();
    if (euroN && fuel) {
      const isDiesel = fuel.includes("DIESEL");
      const likelyOk = isDiesel ? euroN >= 6 : euroN >= 4;

      if (likelyOk) {
        list.push({
          tone: "good",
          title: "Likely ULEZ / Clean Air compliant (London)",
          detail: `Euro ${euroN} ${isDiesel ? "diesel" : "petrol"} usually meets the standard — still verify on the TfL checker.`,
        });
      } else {
        list.push({
          tone: "warn",
          title: "May be chargeable in ULEZ / Clean Air zones",
          detail: `This looks like Euro ${euroN}. London ULEZ cars typically need Euro 4 (petrol) / Euro 6 (diesel) — check TfL to be sure.`,
        });
      }
    }

    if (data.markedForExport === true) {
      list.push({
        tone: "risk",
        title: "Marked for export",
        detail: "Ask the seller why. Double-check the V5C/logbook and consider a full history check before paying a deposit.",
      });
    }

    const v5cDays = daysSince(data.dateOfLastV5CIssued);
    if (v5cDays !== null && v5cDays >= 0 && v5cDays <= 90) {
      list.push({
        tone: "warn",
        title: "V5C issued recently",
        detail: "Often normal (address change can do it), but do ask the seller why and confirm keeper details match the logbook.",
      });
    }

    const taxLower = (data.taxStatus ?? "").toLowerCase();
    if (taxLower && !taxLower.includes("taxed")) {
      list.push({
        tone: "warn",
        title: `Tax status: ${data.taxStatus}`,
        detail: "Could be SORN/untaxed. Budget time to tax it before driving away (don’t assume you can ‘use the seller’s tax’).",
      });
    }

    return list;
  }, [data]);

  async function handleLookup(e?: React.FormEvent) {
    e?.preventDefault();

    setLoading(true);
    setError(null);
    setToast(null);
    setSignupMsg(null);
    setData(null);
    setMeta(null);
    setVrmHash(null);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm }),
      });

      const json = (await res.json()) as LookupResponse;

      if (!json.ok) {
        setError(json.error || "Lookup failed.");
        return;
      }

      setData(json.data);
      setMeta({ source: json.source, cached: json.cached });
      setVrmHash(json.vrmHash ?? null);
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e?: React.FormEvent) {
    e?.preventDefault();

    setSignupMsg(null);
    setToast(null);

    const emailNorm = email.trim().toLowerCase();
    if (!looksLikeEmail(emailNorm)) {
      setSignupMsg("Enter a valid email.");
      return;
    }

    setSignupLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailNorm,
          wantsReminders,
          vrmHash,
          motExpiryDate: data?.motExpiryDate ?? null,
          taxDueDate: data?.taxDueDate ?? null,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setSignupMsg(json?.error || "Could not save email.");
        return;
      }

      if (json?.already) {
        setSignupMsg("You’re already on the list.");
      } else {
        setSignupMsg("Saved. We’ll keep you posted.");
      }

      setEmail("");
    } catch (err: any) {
      setSignupMsg(err?.message ? String(err.message) : "Could not save email.");
    } finally {
      setSignupLoading(false);
    }
  }

  function copyShareLink() {
    try {
      const url = window.location.origin;
      const text = `UK Car Snapshot — DVLA basics + buying checklist.\n${url}\nTip: check tax/MOT before you view a car.`;
      navigator.clipboard.writeText(text);
      setToast("Copied share text to clipboard.");
    } catch {
      setToast("Couldn’t copy automatically. You can share this page URL from your browser.");
    }
  }

  function openMotHistoryPrefilled() {
    if (!data?.registrationNumber) return;
    const reg = cleanReg(data.registrationNumber);
    const url = `https://www.check-mot.service.gov.uk/results?registration=${encodeURIComponent(reg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function openTflWithCopiedReg() {
    const reg = cleanReg(data?.registrationNumber ?? "");
    if (!reg) return;

    try {
      await navigator.clipboard.writeText(reg);
      setToast(`✅ Copied ${reg}. Paste it into the TfL checker (Cmd+V). Opening…`);
    } catch {
      setToast(`Couldn’t auto-copy. Your reg is: ${reg}`);
    }

    setTimeout(() => {
      window.open("https://tfl.gov.uk/modes/driving/check-your-vehicle/", "_blank", "noopener,noreferrer");
    }, 2000);
  }

  const toneClasses: Record<InsightTone, string> = {
    good: "border-emerald-900/40 bg-emerald-950/30 text-emerald-100",
    warn: "border-amber-900/40 bg-amber-950/25 text-amber-100",
    risk: "border-red-900/40 bg-red-950/30 text-red-100",
    info: "border-sky-900/40 bg-sky-950/25 text-sky-100",
  };

  const toneIcon: Record<InsightTone, string> = {
    good: "✅",
    warn: "⚠️",
    risk: "🚩",
    info: "ℹ️",
  };

  return (
    <main className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto w-full max-w-3xl px-6 sm:px-8 py-10 sm:py-12">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">UK Car Snapshot</h1>
          <p className="mt-2 text-neutral-300">
            Enter a registration number to get vehicle basics + a buying checklist.
          </p>
          <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
            Privacy: we treat registration numbers as sensitive. We don’t put them in URLs on this site and we don’t try
            to identify owners. For performance we cache results using a hashed version of the registration.
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-5">
          <form onSubmit={handleLookup} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={vrm}
              onChange={(e) => setVrm(e.target.value)}
              placeholder="e.g. AB12 CDE"
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-base outline-none focus:border-neutral-600"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto whitespace-nowrap rounded-xl bg-neutral-200 px-5 py-3 font-medium text-black disabled:opacity-60"
            >
              {loading ? "Checking..." : "Lookup"}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {data && (
          <div className="mt-6 grid gap-4">
            {/* Vehicle summary */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {(data.make ?? "Vehicle").toUpperCase()} — {cleanReg(data.registrationNumber)}
                  </h2>

                  {meta && (
                    <p className="mt-1 text-sm text-neutral-400">
                      {meta.cached ? "Fast result (cached)" : "Fresh result"} ·{" "}
                      {meta.source === "dvla" ? "DVLA data" : "Demo data"}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={copyShareLink}
                  className="whitespace-nowrap w-fit rounded-xl border border-neutral-700 bg-neutral-900/40 px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-900"
                >
                  Copy share link
                </button>
              </div>

              {/* Insights */}
              {insights.length > 0 && (
                <div className="mt-4 space-y-2">
                  {insights.map((it, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl border px-3 py-2 ${toneClasses[it.tone]}`}
                    >
                      <div className="text-sm font-medium">
                        {toneIcon[it.tone]} {it.title}
                      </div>
                      <div className="mt-0.5 text-sm opacity-90">{it.detail}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-neutral-400">Year</div>
                  <div className="text-base">{data.yearOfManufacture ?? "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400">Fuel</div>
                  <div className="text-base">{data.fuelType ?? "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400">Colour</div>
                  <div className="text-base">{data.colour ?? "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400">Engine</div>
                  <div className="text-base">{data.engineCapacity ? `${data.engineCapacity} cc` : "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400">Tax</div>
                  <div className="text-base">{data.taxStatus ?? "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400">Tax due</div>
                  <div className="text-base">{formatDate(data.taxDueDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400">MOT</div>
                  <div className="text-base">{data.motStatus ?? "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-400">MOT expiry</div>
                  <div className="text-base">{formatDate(data.motExpiryDate)}</div>
                </div>
              </div>

              {toast && <p className="mt-3 text-sm text-neutral-300">{toast}</p>}

              {/* Progressive disclosure: extra DVLA fields */}
              <details className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
                <summary className="cursor-pointer select-none text-sm font-medium text-neutral-200">
                  More DVLA details <span className="text-neutral-500 font-normal">(some vehicles won’t have all fields)</span>
                </summary>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-neutral-500">First registered (month)</div>
                    <div className="text-sm">{data.monthOfFirstRegistration ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Marked for export</div>
                    <div className="text-sm">{data.markedForExport === true ? "Yes" : data.markedForExport === false ? "No" : "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500">Last V5C (logbook) issued</div>
                    <div className="text-sm">{data.dateOfLastV5CIssued ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Euro status</div>
                    <div className="text-sm">{data.euroStatus ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500">CO₂ emissions</div>
                    <div className="text-sm">{typeof data.co2Emissions === "number" ? `${data.co2Emissions} g/km` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Real driving emissions (RDE)</div>
                    <div className="text-sm">{typeof data.realDrivingEmissions === "number" ? String(data.realDrivingEmissions) : "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500">Revenue weight</div>
                    <div className="text-sm">{typeof data.revenueWeight === "number" ? `${data.revenueWeight} kg` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Wheelplan</div>
                    <div className="text-sm">{data.wheelplan ?? "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-neutral-500">Type approval</div>
                    <div className="text-sm">{data.typeApproval ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Additional rate end date</div>
                    <div className="text-sm">{data.additionalRateEndDate ?? "—"}</div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-neutral-500">
                  Tip: if the V5C issue date is very recent, ask the seller why (address change can be normal).
                </p>
              </details>
            </section>

            {/* Next steps */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-5">
              <h3 className="text-lg font-semibold">Next steps</h3>
              <p className="mt-1 text-sm text-neutral-400">Useful checks before you travel to view a car.</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  type="button"
                  onClick={openMotHistoryPrefilled}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4 text-left hover:bg-neutral-900/50 active:scale-[0.99]"
                >
                  <div className="text-sm font-semibold">Check MOT history</div>
                  <div className="mt-1 text-sm text-neutral-400">Past failures + advisories (official GOV.UK).</div>
                </button>

                <button
                  type="button"
                  onClick={openTflWithCopiedReg}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4 text-left hover:bg-neutral-900/50 active:scale-[0.99]"
                >
                  <div className="text-sm font-semibold">Check ULEZ / Clean Air</div>
                  <div className="mt-1 text-sm text-neutral-400">Copies reg first, then opens the TfL checker.</div>
                </button>

                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="cursor-not-allowed rounded-2xl border border-neutral-800 bg-neutral-900/10 p-4 text-left opacity-60"
                >
                  <div className="text-sm font-semibold">Full history report</div>
                  <div className="mt-1 text-sm text-neutral-400">
                    Write-off, finance, theft, mileage flags (coming soon).
                  </div>
                </button>
              </div>

              <p className="mt-3 text-xs text-neutral-500">Opens official sites in a new tab.</p>
            </section>

            {/* Buying checklist */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-5">
              <h3 className="text-lg font-semibold">Buying checklist</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-200">
                {checklist.map((item, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Email capture */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-5">
              <h3 className="text-lg font-semibold">Get updates</h3>
              <p className="mt-1 text-sm text-neutral-400">
                I’m building this tool. Leave your email for new features (MOT history, alerts, pricing checks).
              </p>

              <label className="mt-3 flex items-center gap-2 text-sm text-neutral-200">
                <input
                  type="checkbox"
                  checked={wantsReminders}
                  onChange={(e) => setWantsReminders(e.target.checked)}
                  className="h-4 w-4"
                />
                Email me before MOT/tax expiry
              </label>

              <form onSubmit={handleSignup} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  inputMode="email"
                  className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-base outline-none focus:border-neutral-600"
                />
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="whitespace-nowrap shrink-0 rounded-xl bg-neutral-200 px-6 py-3 font-medium text-black disabled:opacity-60"
                >
                  {signupLoading ? "Saving..." : "Notify me"}
                </button>
              </form>

              {signupMsg && <p className="mt-3 text-sm text-neutral-300">{signupMsg}</p>}
            </section>

            <p className="text-xs text-neutral-600">
              This tool uses DVLA vehicle data. Always verify details with the seller and official documents.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
