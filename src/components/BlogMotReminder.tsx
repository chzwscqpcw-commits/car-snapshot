"use client";

import { useState } from "react";

function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function BlogMotReminder() {
  const [email, setEmail] = useState("");
  const [vrm, setVrm] = useState("");
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!looksLikeEmail(email)) {
      setMsg("Please enter a valid email.");
      return;
    }
    const cleaned = vrm.replace(/\s+/g, "").toUpperCase();
    if (cleaned.length < 2 || cleaned.length > 8) {
      setMsg("Please enter a valid registration.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      // First look up the vehicle to get MOT expiry
      const lookupRes = await fetch(`/api/lookup?vrm=${encodeURIComponent(cleaned)}`);
      const lookupData = await lookupRes.json();
      const motExpiry = lookupData?.motExpiryDate;
      const makeModel = `${lookupData?.make || ""} ${lookupData?.model || ""}`.trim();

      if (!motExpiry) {
        setMsg("Could not find MOT data for this vehicle.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/mot-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          vrm: cleaned,
          makeModel,
          motExpiry,
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setMsg(json?.error || "Could not set reminder.");
        return;
      }
      setSuccess(true);
    } catch {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-12 max-w-[700px] mx-auto p-5 rounded-xl border border-green-500/30 bg-gradient-to-r from-green-950/30 to-emerald-950/30">
        <p className="text-sm font-semibold text-green-300">Reminder set! Check your inbox for confirmation.</p>
      </div>
    );
  }

  return (
    <div className="mt-12 max-w-[700px] mx-auto p-5 rounded-xl border border-slate-700/50 bg-slate-800/40">
      <p className="text-sm font-semibold text-slate-200 mb-1">Check your MOT history free</p>
      <p className="text-xs text-slate-400 mb-3">
        Or set a free MOT reminder &mdash; we&apos;ll email you when it&apos;s time to book.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="REG e.g. AB12 CDE"
          value={vrm}
          onChange={(e) => { setVrm(e.target.value.toUpperCase()); setMsg(""); }}
          className="sm:w-36 rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-mono"
        />
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setMsg(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          className="flex-1 min-w-0 rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-shrink-0 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap"
        >
          {loading ? "..." : "Remind Me"}
        </button>
      </div>
      {msg && <p className="text-xs text-red-400 mt-2">{msg}</p>}
      <p className="text-[10px] text-slate-600 mt-2">Free service. Unsubscribe anytime.</p>
    </div>
  );
}
