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

function formatDate(iso?: string) {
  if (!iso) return "—";
  // Keep it simple and stable (no locale hydration weirdness)
  return iso;
}

function cleanReg(s: string) {
  return s.replace(/\s+/g, "").toUpperCase();
}

function looksLikeEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
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
  const [signupKind, setSignupKind] = useState<"success" | "updated" | "error" | null>(null);


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
    if (year && year <= new Date().getFullYear() - 10)
      items.push("Older car: inspect for corrosion underneath and around arches.");
    if (mot && !mot.includes("valid")) items.push("MOT is not shown as valid: clarify why before viewing.");

    return items;
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
    setSignupKind(null);


    const emailNorm = email.trim().toLowerCase();
    if (!looksLikeEmail(emailNorm)) {
  setSignupKind("error");
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
  setSignupKind("error");
  setSignupMsg(json?.error || "Could not save email.");
  return;
}

setSignupKind(json?.status === "updated" ? "updated" : "success");
setSignupMsg(json?.message || "Saved. We’ll keep you posted.");
setEmail("");


} catch (err: any) {
  setSignupKind("error");
  setSignupMsg(err?.message ? String(err.message) : "Could not save email.");
} finally {

      setSignupLoading(false);
    }
  }

  function copyShareLink() {
    try {
      const url = window.location.origin;
      const text = `Free UK car check (DVLA basics + buying checklist): ${url}\nWorth running before you view a used car.`;
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

    // Give the user time to see the message before the new tab steals focus
    setTimeout(() => {
      window.open("https://tfl.gov.uk/modes/driving/check-your-vehicle/", "_blank", "noopener,noreferrer");
    }, 2000);
  }

  return (
<main className="min-h-screen bg-black text-neutral-100 px-10 py-10">


      <div className="mx-auto w-full max-w-[820px] px-6 sm:px-8 lg:px-10 py-10">
<header className="mb-5">
  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">UK Car Snapshot</h1>

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
                  className="w-fit rounded-xl border border-neutral-700 bg-neutral-900/40 px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-900"
                >
                  Copy share link
                </button>
              </div>

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
                  className="w-full sm:w-auto shrink-0 rounded-xl bg-neutral-200 px-5 py-3 font-medium text-black disabled:opacity-60"
                >
                  {signupLoading ? "Saving..." : "Notify me"}
                </button>
              </form>

{signupMsg && (
  <div
    className={[
      "mt-3 rounded-xl border px-3 py-2 text-sm",
      signupKind === "success" && "border-emerald-900/40 bg-emerald-950/25 text-emerald-200",
      signupKind === "updated" && "border-sky-900/40 bg-sky-950/25 text-sky-200",
      signupKind === "error" && "border-red-900/40 bg-red-950/30 text-red-200",
      !signupKind && "border-neutral-800 bg-neutral-950/40 text-neutral-200",
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {signupKind === "success" && <span className="mr-2">✅</span>}
    {signupKind === "updated" && <span className="mr-2">🔄</span>}
    {signupKind === "error" && <span className="mr-2">⚠️</span>}
    {signupMsg}
  </div>
)}

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
