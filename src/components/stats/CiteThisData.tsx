"use client";

import { useState } from "react";
import { Quote, Copy, Check } from "lucide-react";

interface CiteThisDataProps {
  /** The data-story page title (used in the citation). */
  title: string;
  /** Canonical URL of this page. */
  url: string;
  /** Source/publisher name. */
  publisher?: string;
}

/**
 * "Cite or link to this data" box for the /stats data-story pages.
 *
 * Digital-PR mechanism (see the digital-pr-backlinks-initiative): journalists
 * and bloggers who use these figures get a ready-made, copy-paste citation that
 * carries a link back — turning data usage into earned backlinks. Reusable
 * across every stats page; pass the page title + canonical URL.
 */
export default function CiteThisData({
  title,
  url,
  publisher = "Free Plate Check",
}: CiteThisDataProps) {
  const plainCite = `${publisher}. "${title}." ${url}`;
  const htmlCite = `<a href="${url}">${title} — ${publisher}</a>`;
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      // Clipboard unavailable/blocked — fail silently.
    }
  }

  const rows: { key: string; label: string; value: string }[] = [
    { key: "plain", label: "Plain text", value: plainCite },
    { key: "html", label: "HTML link", value: htmlCite },
  ];

  return (
    <section className="my-10 rounded-xl border border-slate-700/60 bg-slate-900/40 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Quote className="h-4 w-4 text-cyan-400" />
        <h2 className="text-base font-semibold text-slate-100">
          Cite or link to this data
        </h2>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        Using these figures in an article or post? A credit with a link back is
        appreciated — copy a ready-made citation:
      </p>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key}>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {r.label}
            </p>
            <div className="flex items-start gap-2">
              <code className="flex-1 break-all rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                {r.value}
              </code>
              <button
                type="button"
                onClick={() => copy(r.value, r.key)}
                aria-label={`Copy ${r.label} citation`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
              >
                {copied === r.key ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
