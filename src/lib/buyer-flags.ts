// Red-flag scan for the buyer check (/check-before-you-buy).
// Pure functions — no React, no fetches — so scripts/test-buyer-flags.ts can
// exercise every rule against hand-built vehicles.
//
// Why a separate scan rather than the homepage's checklist: the buyer check
// exists to put carVertical in front of people who are BUYING. Placements
// gated on a detected signal convert ~20x better than ones gated on who the
// visitor might be (mot-history-anomaly 4.5% vs warranty 0.2%, Sep 2026), so
// the page leads with what this particular car's free data shows, and each
// flag says what the free data can't settle.

export type FlagSeverity = "stop" | "ask" | "note";

export interface BuyerFlag {
  id: string;
  severity: FlagSeverity;
  title: string;
  detail: string;
}

export interface BuyerFlagInput {
  motStatus?: string;
  motExpiryDate?: string;
  taxStatus?: string;
  yearOfManufacture?: number;
  /** ISO date (YYYY-MM-DD) the current V5C logbook was issued. */
  dateOfLastV5CIssued?: string;
  markedForExport?: boolean;
  /** Most recent MOT first or last — order doesn't matter, it's sorted here. */
  motTests?: Array<{
    completedDate: string;
    testResult: string;
    rfrAndComments?: Array<{ text: string; type: string }>;
  }>;
  /** From analyseMileage(); only `kind` and `message` are read. */
  clockingFlags: Array<{ kind: "rollback" | "implausible_jump"; message: string }>;
  recallCount: number;
  theftRiskCategory?: string | null;
  ulezStatus?: string | null;
}

const DAY_MS = 86_400_000;

function daysUntil(iso: string | undefined, now: Date): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - now.getTime()) / DAY_MS);
}

/** Advisory texts seen on two or more separate MOTs, most frequent first. */
export function recurringAdvisories(
  tests: BuyerFlagInput["motTests"],
): Array<{ text: string; count: number }> {
  const counts = new Map<string, { text: string; count: number }>();
  for (const t of tests ?? []) {
    const seen = new Set<string>();
    for (const r of t.rfrAndComments ?? []) {
      if (r.type !== "ADVISORY") continue;
      const key = r.text.toLowerCase().replace(/\s+/g, " ").trim();
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = counts.get(key) ?? { text: r.text, count: 0 };
      entry.count++;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].filter((a) => a.count >= 2).sort((a, b) => b.count - a.count);
}

const ORDER: Record<FlagSeverity, number> = { stop: 0, ask: 1, note: 2 };

export function buildBuyerFlags(input: BuyerFlagInput, now: Date = new Date()): BuyerFlag[] {
  const flags: BuyerFlag[] = [];
  const tests = [...(input.motTests ?? [])].sort(
    (a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime(),
  );

  const rollback = input.clockingFlags.find((f) => f.kind === "rollback");
  if (rollback) {
    flags.push({
      id: "mileage-rollback",
      severity: "stop",
      title: "The mileage went backwards between MOTs",
      detail: `${rollback.message}. Either a recording error or a clocked car — the MOT record alone can't say which.`,
    });
  }
  const jump = input.clockingFlags.find((f) => f.kind === "implausible_jump");
  if (jump) {
    flags.push({
      id: "mileage-jump",
      severity: "ask",
      title: "An unusual jump in recorded mileage",
      detail: `${jump.message}. Ask the seller what the car was used for in that period.`,
    });
  }

  if (input.markedForExport) {
    flags.push({
      id: "export",
      severity: "stop",
      title: "DVLA has this car marked for export",
      detail: "A car marked for export shouldn't normally be on sale in the UK. Ask the seller to explain before going further.",
    });
  }

  const age = input.yearOfManufacture ? now.getFullYear() - input.yearOfManufacture : null;
  const motStatus = (input.motStatus ?? "").toLowerCase();
  const motDays = daysUntil(input.motExpiryDate, now);
  if (age !== null && age >= 3 && motStatus && motStatus !== "valid" && motStatus !== "no details held by dvla") {
    flags.push({
      id: "mot-expired",
      severity: "stop",
      title: "No valid MOT",
      detail: "It can't legally be driven away or test-driven on the road (except to a pre-booked MOT). Ask for a fresh MOT before you pay.",
    });
  } else if (motDays !== null && motDays >= 0 && motDays <= 60) {
    flags.push({
      id: "mot-soon",
      severity: "ask",
      title: `MOT runs out in ${motDays} day${motDays === 1 ? "" : "s"}`,
      detail: "Ask the seller to MOT it before the sale, or knock the cost of the test and any likely repairs off the price.",
    });
  }

  const last = tests[0];
  if (last && last.testResult === "FAILED") {
    const retestPassed = tests.some(
      (t) => t.testResult === "PASSED" && new Date(t.completedDate) >= new Date(last.completedDate),
    );
    if (!retestPassed) {
      flags.push({
        id: "last-mot-failed",
        severity: "ask",
        title: "Its most recent MOT was a fail",
        detail: "Check the failure items were fixed — ask for the invoice or a passed retest.",
      });
    }
  }

  const tax = (input.taxStatus ?? "").toLowerCase();
  if (tax === "sorn") {
    flags.push({
      id: "sorn",
      severity: "ask",
      title: "Declared off the road (SORN)",
      detail: "Ask why it was taken off the road and for how long. You'll need to tax it before driving it home.",
    });
  } else if (tax === "untaxed" || tax === "not taxed") {
    flags.push({
      id: "untaxed",
      severity: "note",
      title: "Not currently taxed",
      detail: "Tax doesn't transfer with the car anyway — you'll tax it yourself before driving away.",
    });
  }

  const v5cDays = daysUntil(input.dateOfLastV5CIssued, now);
  if (v5cDays !== null && v5cDays <= 0 && -v5cDays <= 90) {
    flags.push({
      id: "recent-v5c",
      severity: "ask",
      title: `Logbook (V5C) issued ${-v5cDays} day${v5cDays === -1 ? "" : "s"} ago`,
      detail: "A new logbook means a recent change of keeper or a replacement V5C. If the seller says they've owned it for years, ask why.",
    });
  }

  if (input.recallCount > 0) {
    flags.push({
      id: "recalls",
      severity: "ask",
      title: `${input.recallCount} safety recall${input.recallCount === 1 ? "" : "s"} on this model`,
      detail: "Recalls are fixed free by a franchised dealer. Ask for proof the work was done on this car.",
    });
  }

  const recurring = recurringAdvisories(tests);
  if (recurring.length > 0) {
    const top = recurring[0];
    flags.push({
      id: "recurring-advisory",
      severity: "ask",
      title: `${recurring.length} MOT advisor${recurring.length === 1 ? "y keeps" : "ies keep"} coming back`,
      detail: `e.g. "${top.text}" on ${top.count} tests. Advised and never fixed — ask whether it has been, or budget for it.`,
    });
  }

  if (input.theftRiskCategory === "very-high" || input.theftRiskCategory === "high") {
    flags.push({
      id: "theft-risk",
      severity: "note",
      title: "One of the UK's most-stolen models",
      detail: "Stolen cars of popular models are often cloned onto another car's plates and resold. Check the VIN on the car matches the logbook.",
    });
  }

  if (input.ulezStatus === "non-compliant") {
    flags.push({
      id: "ulez",
      severity: "note",
      title: "Not ULEZ compliant",
      detail: "£12.50 a day to drive in London's ULEZ, and charged in some other clean air zones too.",
    });
  }

  return flags.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}
