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
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
};

const cardStyle: React.CSSProperties = {
  padding: 16,
  border: "1px solid #ddd",
};

function checklistFor(data: VehicleData) {
  const items: string[] = [];
  items.push("Ask for full service history and receipts.");
  items.push("Confirm the VIN on the car matches the V5C/logbook.");
  items.push("Check tyres (tread + uneven wear) and look for warning lights.");

  const fuel = (data.fuelType || "").toUpperCase();
  if (fuel.includes("DIESEL")) {
    items.push("Diesel: ask about DPF/EGR issues and motorway vs short trips.");
  }

  const year = data.yearOfManufacture ?? 0;
  if (year > 0 && year <= 2012) {
    items.push("Older car: inspect for corrosion underneath and around arches.");
  }

  if ((data.engineCapacity ?? 0) >= 2000) {
    items.push("Bigger engine: sanity-check insurance + running costs.");
  }

  const mot = (data.motStatus || "").toUpperCase();
  if (mot && mot !== "VALID") {
    items.push("MOT is not valid: clarify why before viewing.");
  }

  return items;
}

export default function Home() {
  const [vrm, setVrm] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VehicleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [meta, setMeta] = useState<{ source?: string; cached?: boolean } | null>(
    null
  );

  const [email, setEmail] = useState("");
  const [wantsReminders, setWantsReminders] = useState(false);
  const [signupMsg, setSignupMsg] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [vrmHash, setVrmHash] = useState<string | null>(null);


  const checklist = useMemo(() => (data ? checklistFor(data) : []), [data]);

  async function handleLookup() {
    setLoading(true);
    setError(null);
    setData(null);
    setMeta(null);
    setVrmHash(null);



    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrm }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setError(json?.error || "Lookup failed. Try again.");
        return;
      }

      setData(json.data);
      setMeta({ source: json.source, cached: json.cached });
      setVrmHash(json.vrmHash ?? null);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    setSignupLoading(true);
    setSignupMsg(null);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          wantsReminders,
          vrmHash,
          motExpiryDate: data?.motExpiryDate,
          taxDueDate: data?.taxDueDate,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setSignupMsg(json?.error || "Could not save email.");
        return;
      }

setSignupMsg(json.already ? "You’re already on the list." : "Saved. We’ll keep you posted.");

      setEmail("");
      setWantsReminders(false);
    } catch {
      setSignupMsg("Network error. Try again.");
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 820,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>UK Car Snapshot</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Enter a registration number to get vehicle basics + a buying checklist.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <input
          value={vrm}
          onChange={(e) => setVrm(e.target.value)}
          placeholder="e.g. AB12 CDE"
          style={{ flex: 1, padding: 12, fontSize: 16 }}
          autoCapitalize="characters"
        />
        <button
          onClick={handleLookup}
          disabled={loading}
          style={{
            padding: "12px 16px",
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Checking..." : "Lookup"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ccc" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>
              {data.make ?? "Vehicle"} — {data.registrationNumber}
            </h2>
<button
  onClick={() => {
    const url = window.location.origin;
const text =
  `Free UK car check (DVLA basics + buying checklist): ${url}\n` +
  `Worth running before you view a used car.`;
navigator.clipboard.writeText(text);

    setSignupMsg("Copied share text to clipboard.");
  }}
  style={{
    marginTop: 10,
    padding: "10px 12px",
    fontSize: 14,
    cursor: "pointer",
  }}
>
  Copy share link
</button>

            {meta && (
              <p style={{ marginTop: 6, opacity: 0.75 }}>
                {meta.cached ? "Fast result (cached)" : "Fresh result"}{" "}
                <span style={{ opacity: 0.7 }}>
                  {meta.source === "dvla" ? "· DVLA data" : "· Demo data"}
                </span>
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <strong>Year:</strong> {data.yearOfManufacture ?? "—"}
              </div>
              <div>
                <strong>Fuel:</strong> {data.fuelType ?? "—"}
              </div>
              <div>
                <strong>Colour:</strong> {data.colour ?? "—"}
              </div>
              <div>
                <strong>Engine:</strong>{" "}
                {data.engineCapacity ? `${data.engineCapacity} cc` : "—"}
              </div>
              <div>
                <strong>Tax:</strong> {data.taxStatus ?? "—"}
              </div>
              <div>
                <strong>Tax due:</strong> {data.taxDueDate ?? "—"}
              </div>
              <div>
                <strong>MOT:</strong> {data.motStatus ?? "—"}
              </div>
              <div>
                <strong>MOT expiry:</strong> {data.motExpiryDate ?? "—"}
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Buying checklist</h3>
            <ul>
              {checklist.map((item, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Get updates</h3>
            <p style={{ marginTop: 0, opacity: 0.8 }}>
              Leave your email for new features (MOT history, alerts, pricing
              checks).
            </p>

            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <input
                type="checkbox"
                checked={wantsReminders}
                onChange={(e) => setWantsReminders(e.target.checked)}
              />
              Email me before MOT/tax expiry
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={{ flex: 1, padding: 12, fontSize: 16 }}
                inputMode="email"
              />
              <button
                onClick={handleSignup}
                disabled={signupLoading}
                style={{
                  padding: "12px 16px",
                  fontSize: 16,
                  cursor: signupLoading ? "not-allowed" : "pointer",
                }}
              >
                {signupLoading ? "Saving..." : "Notify me"}
              </button>
            </div>

            {signupMsg && (
              <p style={{ marginTop: 10, opacity: 0.85 }}>{signupMsg}</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
