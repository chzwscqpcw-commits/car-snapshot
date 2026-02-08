"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const [vrm, setVrm] = useState("");
  const router = useRouter();

  function handleLookup() {
    const cleaned = vrm.replace(/\s/g, "").toUpperCase();
    if (!cleaned) return;
    router.push(`/?vrm=${encodeURIComponent(cleaned)}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <p className="text-6xl font-bold text-slate-700 mb-4">404</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">
            That page doesn&apos;t exist
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            You might have followed an old link or typed the address wrong.
            No worries — you can still check a vehicle below.
          </p>
        </div>

        {/* Vehicle lookup */}
        <div className="mb-12 p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg">
          <p className="text-sm font-medium text-slate-200 mb-3 text-center">
            Look up any UK vehicle
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter reg, e.g. AB12 CDE"
              value={vrm}
              onChange={(e) => setVrm(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLookup();
              }}
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleLookup}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all whitespace-nowrap"
            >
              Look up
            </button>
          </div>
        </div>

        {/* Useful links */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Popular checks
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a
                href="/mot-check"
                className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors text-center"
              >
                <p className="text-sm font-medium text-slate-200">MOT Check</p>
              </a>
              <a
                href="/car-check"
                className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors text-center"
              >
                <p className="text-sm font-medium text-slate-200">Car Check</p>
              </a>
              <a
                href="/tax-check"
                className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors text-center"
              >
                <p className="text-sm font-medium text-slate-200">Tax Check</p>
              </a>
              <a
                href="/mileage-check"
                className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors text-center"
              >
                <p className="text-sm font-medium text-slate-200">Mileage Check</p>
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Helpful guides
            </h2>
            <div className="space-y-2">
              <a
                href="/blog/what-does-mot-advisory-mean"
                className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <p className="text-sm font-medium text-slate-200">What Does an MOT Advisory Mean?</p>
              </a>
              <a
                href="/blog/used-car-checks-before-buying"
                className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <p className="text-sm font-medium text-slate-200">10 Essential Checks Before Buying a Used Car</p>
              </a>
              <a
                href="/blog"
                className="block text-center text-sm text-blue-400 hover:text-blue-300 transition-colors mt-2"
              >
                See all guides &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">Home</a>
            <span>&bull;</span>
            <a href="/blog" className="hover:text-slate-300">Guides</a>
            <span>&bull;</span>
            <a href="/privacy" className="hover:text-slate-300">Privacy Policy</a>
            <span>&bull;</span>
            <a href="/terms" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}
