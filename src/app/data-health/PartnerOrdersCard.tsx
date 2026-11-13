"use client";

import { useEffect, useState } from "react";
import type { OrderTotals, PartnerOrdersSummary, ReconDay } from "@/lib/partner-orders";

// "Partner orders" on /data-health: what the We Buy Any Car clicks became,
// from the Rakuten reports the daily job stores (src/lib/partner-orders.ts).
// The figures come from /api/admin/partner-orders, behind the admin PIN.
// /data-health?partner-orders=sample shows the panel with made-up figures.

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-GB"));
const shortDay = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

const TH = "px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500";
const TD = "px-2.5 py-2 font-mono text-sm tabular-nums text-slate-200";

function Totals({ label, sub, t }: { label: string; sub?: string; t: OrderTotals }) {
  const cells: { label: string; value: string; tone?: string }[] = [
    { label: "Clicks", value: num(t.clicks) },
    { label: "Orders", value: num(t.orders) },
    { label: "Paying", value: num(t.paying), tone: "text-emerald-300" },
    { label: "At zero", value: num(t.atZero), tone: t.atZero > 0 ? "text-amber-300" : undefined },
    { label: "Provisional", value: gbp(t.provisional) },
    { label: `Locked · ${num(t.lockedCount)}`, value: gbp(t.lockedCommission) },
  ];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
        {sub && <span className="normal-case tracking-normal text-slate-600"> · {sub}</span>}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-3">
        {cells.map((c) => (
          <div key={c.label}>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{c.label}</p>
            <p className={`mt-0.5 font-mono text-lg font-bold tabular-nums ${c.tone ?? "text-white"}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const RECON_LABEL: Record<ReconDay["state"], { text: string; cls: string }> = {
  match: { text: "matches", cls: "text-emerald-300" },
  flag: { text: "differs", cls: "text-rose-300 font-semibold" },
  incomplete: { text: "day not finished", cls: "text-slate-500" },
  no_report: { text: "before the report", cls: "text-slate-600" },
};

export default function PartnerOrdersCard({ adminFetch }: { adminFetch: (url: string) => Promise<Response> }) {
  const [data, setData] = useState<PartnerOrdersSummary | null>(null);

  useEffect(() => {
    let active = true;
    const sample = new URLSearchParams(window.location.search).get("partner-orders") === "sample";
    adminFetch(`/api/admin/partner-orders${sample ? "?sample=1" : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (active && json) setData(json as PartnerOrdersSummary);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [adminFetch]);

  if (!data) return null;

  const pulled = data.lastPulledAt
    ? new Date(data.lastPulledAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <section className="mt-7">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Partner orders
          {data.sample && (
            <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-amber-300">
              sample figures, not real
            </span>
          )}
        </h2>
        <p className="text-[11px] text-slate-600">
          We Buy Any Car · Rakuten reports{pulled ? ` · pulled ${pulled}` : ""}
        </p>
      </div>

      {data.state !== "ok" ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400">{data.note}</p>
      ) : (
        <div className="space-y-3">
          {data.stale && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
              The last successful pull was {pulled}. Check /api/cron/rakuten-reports in the Vercel logs: a report
              link&apos;s token may have expired.
            </p>
          )}
          {data.wentToZeroThisWeek > 0 && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
              <p className="font-semibold">
                {data.wentToZeroThisWeek} order{data.wentToZeroThisWeek === 1 ? "" : "s"} that{" "}
                {data.wentToZeroThisWeek === 1 ? "was" : "were"} paying dropped to zero this week
              </p>
              <ul className="mt-1 space-y-0.5 text-[13px] text-rose-200/90">
                {data.wentToZero.slice(0, data.wentToZeroThisWeek).map((z) => (
                  <li key={z.transactionId}>
                    Order of {shortDay(z.transactionDate)} · <span className="font-mono">{z.placement}</span> · was{" "}
                    {gbp(z.previousCommission)} · changed {shortDay(z.changedAt)} · transaction{" "}
                    <span className="font-mono">{z.transactionId}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <Totals label="This week" sub="last 7 days" t={data.week} />
            <Totals label="Since launch" sub={data.coverage ? `from ${shortDay(data.coverage.from)}` : undefined} t={data.sinceLaunch} />
          </div>

          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
              <p className="px-3 pt-3 text-[11px] uppercase tracking-wider text-slate-500">By placement (u1)</p>
              <table className="mt-1 w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className={TH}>Placement</th>
                    <th className={`${TH} whitespace-nowrap text-right`}>Clicks 7d</th>
                    <th className={`${TH} whitespace-nowrap text-right`}>Orders 7d</th>
                    <th className={`${TH} text-right`}>Orders</th>
                    <th className={`${TH} whitespace-nowrap text-right`}>Paid / zero</th>
                    <th className={`${TH} text-right`}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {data.placements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-3 text-sm text-slate-500">
                        No orders or clicks yet.
                      </td>
                    </tr>
                  ) : (
                    data.placements.map((p) => (
                      <tr key={p.placement} className="border-b border-slate-800/60 last:border-0">
                        <td className="whitespace-nowrap px-2.5 py-2 font-mono text-[13px] text-slate-300">{p.placement}</td>
                        <td className={`${TD} text-right`}>{num(p.siteClicksWeek)}</td>
                        <td className={`${TD} text-right`}>{num(p.week.orders)}</td>
                        <td className={`${TD} text-right`}>{num(p.sinceLaunch.orders)}</td>
                        <td className={`${TD} text-right`}>
                          {num(p.sinceLaunch.paying)} / {num(p.sinceLaunch.atZero)}
                        </td>
                        <td className={`${TD} text-right text-cyan-300`}>{gbp(p.sinceLaunch.commission)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <p className="px-3 pb-3 pt-2 text-[11px] leading-relaxed text-slate-600">
                Clicks 7d are our own (site_events); the rest is since launch unless it says 7d. Provisional = commission
                on orders not locked yet, which can still change; locked is final. Orders sit on their transaction date.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
              <p className="px-3 pt-3 text-[11px] uppercase tracking-wider text-slate-500">
                Clicks · Rakuten against ours
                {data.flaggedDays > 0 && (
                  <span className="ml-2 normal-case tracking-normal text-rose-300">
                    {data.flaggedDays} day{data.flaggedDays === 1 ? "" : "s"} differ
                  </span>
                )}
              </p>
              <table className="mt-1 w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className={TH}>Day</th>
                    <th className={`${TH} text-right`}>Rakuten</th>
                    <th className={`${TH} text-right`}>Ours</th>
                    <th className={`${TH} text-right`}>Gap</th>
                    <th className={TH}></th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.reconciliation].reverse().map((d) => {
                    const gap = d.rakuten === null ? null : d.rakuten - d.site;
                    return (
                      <tr
                        key={d.day}
                        className={`border-b border-slate-800/60 last:border-0 ${d.state === "flag" ? "bg-rose-950/30" : ""}`}
                      >
                        <td className="px-3 py-1.5 text-[13px] text-slate-300">{shortDay(d.day)}</td>
                        <td className={`${TD} py-1.5 text-right`}>{num(d.rakuten)}</td>
                        <td className={`${TD} py-1.5 text-right`}>{num(d.site)}</td>
                        <td className={`${TD} py-1.5 text-right`}>{gap === null ? "—" : gap > 0 ? `+${gap}` : gap}</td>
                        <td className={`px-3 py-1.5 text-[12px] ${RECON_LABEL[d.state].cls}`}>{RECON_LABEL[d.state].text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="px-3 pb-3 pt-2 text-[11px] leading-relaxed text-slate-600">
                Ours = partner_click rows for We Buy Any Car, owner traffic left out. A day is flagged when the two
                differ by more than 3 clicks (or a tenth of the day). Today is never judged.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
