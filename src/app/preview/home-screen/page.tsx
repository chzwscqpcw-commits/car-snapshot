"use client";

import PreviewGate from "@/components/preview/PreviewGate";
import HomeScreenWalkthrough from "@/components/pwa/HomeScreenWalkthrough";
import type { IosBrowser } from "@/components/pwa/ios-browser";

const LAYOUTS: { browser: IosBrowser; title: string; where: string }[] = [
  { browser: "safari", title: "Safari, Share in the toolbar", where: "iOS 18 and earlier, and iOS 26 with the old bottom toolbar." },
  { browser: "safari-new", title: "Safari on iOS 26, Share under •••", where: "The default layout since iOS 26: the address bar floats at the bottom with a ••• button." },
  { browser: "chrome", title: "Chrome on iOS", where: "Share sits in the address bar." },
];

/**
 * The add-to-Home-Screen walkthrough in every layout it draws, for viewing on
 * a desktop. On a real iPhone it appears in two places: behind "Show me" on
 * the install toast (results page, after the share moment) and, once a car's
 * alerts are saved by email, behind "See how" on the save card.
 */
export default function HomeScreenPreviewPage() {
  return (
    <PreviewGate>
      <main className="min-h-screen bg-slate-950 px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <h1 className="text-xl font-semibold text-white">Add to Home Screen walkthrough — preview</h1>
            <p className="mt-2 text-sm text-slate-400">
              The layout a visitor sees is picked from their browser. Tap a phone to pause. With &ldquo;Reduce Motion&rdquo; on, each
              shows the finished still and the three steps.
            </p>
          </div>
          {LAYOUTS.map((l) => (
            <section key={l.browser} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-base font-semibold text-white">{l.title}</h2>
              <p className="mb-4 mt-1 text-xs text-slate-500">{l.where}</p>
              <HomeScreenWalkthrough browser={l.browser} source="toast" track={false} />
            </section>
          ))}
        </div>
      </main>
    </PreviewGate>
  );
}
