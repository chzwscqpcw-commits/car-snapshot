/**
 * Pull the two Rakuten Advertising reports and write them as clean CSVs, so
 * they can be read outside the app (a spreadsheet, another tool).
 *
 *   npm run rakuten:pull
 *
 * Writes `rakuten-revenue-by-day.csv` and `rakuten-lock-status.csv` into the
 * folder named by RAKUTEN_EXPORT_DIR, replacing the last run's files. The lock
 * file has no `SKU` and no `Product Name` column: those are the customer's
 * registration and car, and the parser never lets them out
 * (src/lib/rakuten-reports.ts).
 *
 * Environment (shell, or .env.local at the repo root):
 *   RAKUTEN_REVENUE_REPORT_URL   the "Revenue Report by Day" Get API link
 *   RAKUTEN_LOCK_REPORT_URL      the "Lock Status Report" Get API link
 *   RAKUTEN_EXPORT_DIR           where the two files go
 *
 * To clean a hand export instead of fetching (no links needed):
 *   npm run rakuten:pull -- --revenue-file <path> --lock-file <path>
 *
 * This only fetches and writes files. It does not start the site, and it
 * touches no database. The links hold a token: they are never printed.
 */
import * as fs from "fs";
import * as path from "path";
import {
  LOCK_REPORT,
  RAKUTEN_ENV,
  REVENUE_REPORT,
  fetchReportCsv,
  ordersToCsv,
  parseLockStatus,
  parseRevenueByDay,
  rakutenConfig,
  revenueToCsv,
} from "../src/lib/rakuten-reports";

function loadEnvLocal(): void {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

async function main(): Promise<number> {
  loadEnvLocal();
  const revenueFile = argValue("--revenue-file");
  const lockFile = argValue("--lock-file");
  const fromFiles = Boolean(revenueFile || lockFile);

  const dir = process.env[RAKUTEN_ENV.exportDir]?.trim();
  if (!dir) {
    console.error(`${RAKUTEN_ENV.exportDir} is not set: name the folder the two CSVs should go in.`);
    return 1;
  }

  const config = rakutenConfig();
  if (!fromFiles && config.missing.length > 0) {
    console.log(`Not connected: ${config.missing.join(" and ")} ${config.missing.length === 1 ? "is" : "are"} not set. Nothing fetched.`);
    return 0;
  }

  const now = Date.now();
  const jobs = [
    {
      label: REVENUE_REPORT,
      out: "rakuten-revenue-by-day.csv",
      file: revenueFile,
      url: config.revenueUrl,
      clean: (csv: string) => {
        const days = parseRevenueByDay(csv);
        return { rows: days.length, csv: revenueToCsv(days) };
      },
    },
    {
      label: LOCK_REPORT,
      out: "rakuten-lock-status.csv",
      file: lockFile,
      url: config.lockUrl,
      clean: (csv: string) => {
        const orders = parseLockStatus(csv);
        return { rows: orders.length, csv: ordersToCsv(orders) };
      },
    },
  ];

  fs.mkdirSync(dir, { recursive: true });
  let failures = 0;
  for (const job of jobs) {
    if (fromFiles && !job.file) continue;
    try {
      const raw = job.file ? fs.readFileSync(job.file, "utf8") : await fetchReportCsv(job.label, job.url ?? "", now);
      const cleaned = job.clean(raw);
      fs.writeFileSync(path.join(dir, job.out), cleaned.csv, "utf8");
      console.log(`✓ ${job.label}: ${cleaned.rows} rows → ${job.out}`);
    } catch (err: unknown) {
      failures++;
      // Only messages written by rakuten-reports.ts, or a file error's code:
      // nothing that could repeat a link or a row.
      const message = err instanceof Error && err.name === "RakutenReportError" ? err.message : `${job.label}: ${(err as NodeJS.ErrnoException)?.code ?? "failed"}`;
      console.error(`✗ ${message}`);
    }
  }
  return failures === 0 ? 0 : 1;
}

main().then((code) => process.exit(code));
