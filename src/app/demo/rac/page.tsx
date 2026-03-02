"use client";

/**
 * RAC Placement Demo — password gate.
 * Sets a cookie so the main site renders annotated RAC banner placements
 * for affiliate partner review. Not indexed, not linked anywhere.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

const DEMO_PASSWORD = "access2026";

export default function RacDemoGatePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === DEMO_PASSWORD) {
      document.cookie = "fpc_demo=rac; path=/; max-age=604800"; // 7 days
      router.push("/");
    } else {
      setError("Incorrect password. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm p-8 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
            <Lock className="w-6 h-6 text-orange-400" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-100 text-center mb-2">
          RAC Placement Demo
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          Enter the password to preview RAC ad placements across the live site.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Password"
            autoFocus
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            View Demo
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-600 text-center">
          This page is for authorised partner review only.
        </p>
      </div>
    </div>
  );
}
