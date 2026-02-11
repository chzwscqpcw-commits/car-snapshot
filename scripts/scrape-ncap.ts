#!/usr/bin/env npx tsx
/**
 * Euro NCAP Scraper Script
 *
 * Attempts to fetch Euro NCAP safety ratings from euroncap.com.
 *
 * NOTE (Feb 2026): The Euro NCAP website blocks programmatic API access.
 * Their AngularJS app uses an Umbraco CMS backend at:
 *   /Umbraco/EuroNCAP/SearchApi/GetAssessmentSearch
 * which returns 302 redirects to /InternalError.html for non-browser requests.
 *
 * Individual result pages (e.g. /en/results/ford/focus/35230) also redirect.
 * The site likely uses Cloudflare or similar anti-bot protection.
 *
 * Current workaround: Manual curation of ncap-ratings.json from web research.
 * This script is kept as a framework for future automation if API access
 * becomes available or an alternative data source is found.
 *
 * Usage:
 *   npx tsx scripts/scrape-ncap.ts
 *   npx tsx scripts/scrape-ncap.ts --dry-run    # show what would be fetched
 *
 * Alternative data sources to investigate:
 *   - Euro NCAP may publish CSV/Excel exports in the future
 *   - IIHS (US equivalent) has more accessible data
 *   - GitHub repos with scraped NCAP data (check license)
 */

import * as fs from "fs";
import * as path from "path";

const NCAP_API_URL =
  "https://www.euroncap.com/Umbraco/EuroNCAP/SearchApi/GetAssessmentSearch";
const OUTPUT_FILE = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "ncap-ratings.json"
);
const DRY_RUN = process.argv.includes("--dry-run");

interface NcapEntry {
  make: string;
  model: string;
  year: number;
  overall: number;
  adult: number;
  child: number;
  pedestrian: number;
  safetyAssist: number;
}

interface ApiResponse {
  SearchResults?: Array<{
    MakeName: string;
    ModelName: string;
    Year: number;
    OverallRating: number;
    AdultOccupantScore: number;
    ChildOccupantScore: number;
    PedestrianScore: number;
    SafetyAssistScore: number;
  }>;
}

async function fetchAssessments(): Promise<NcapEntry[]> {
  console.log("Attempting to fetch Euro NCAP assessments...");
  console.log(`API URL: ${NCAP_API_URL}`);

  if (DRY_RUN) {
    console.log("(Dry run — not making actual requests)");
    return [];
  }

  try {
    const response = await fetch(NCAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://www.euroncap.com/en/ratings/a-702/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        SelectedMake: "",
        SelectedMakeName: "",
        SelectedModel: "",
        SelectedStar: "",
        IncludeSuperseded: false,
        SelectedProtocols: [],
        SelectedClasses: [],
        AllProtocols: true,
        AllClasses: true,
      }),
    });

    if (!response.ok) {
      console.error(
        `API returned HTTP ${response.status}: ${response.statusText}`
      );
      if (response.status === 302 || response.status === 301) {
        console.error(
          "Redirected — site is blocking programmatic access (anti-bot protection)"
        );
      }
      return [];
    }

    const data = (await response.json()) as ApiResponse;
    if (!data.SearchResults) {
      console.error("No SearchResults in response");
      return [];
    }

    return data.SearchResults.map((r) => ({
      make: r.MakeName.toUpperCase(),
      model: r.ModelName.toUpperCase(),
      year: r.Year,
      overall: r.OverallRating,
      adult: Math.round(r.AdultOccupantScore),
      child: Math.round(r.ChildOccupantScore),
      pedestrian: Math.round(r.PedestrianScore),
      safetyAssist: Math.round(r.SafetyAssistScore),
    }));
  } catch (err) {
    console.error("Failed to fetch from Euro NCAP API:", err);
    console.error("");
    console.error("The Euro NCAP website blocks programmatic API access.");
    console.error("To expand the dataset, manually research ratings and add");
    console.error(`them to ${OUTPUT_FILE}`);
    return [];
  }
}

function mergeWithExisting(newEntries: NcapEntry[]): NcapEntry[] {
  const existing: NcapEntry[] = JSON.parse(
    fs.readFileSync(OUTPUT_FILE, "utf-8")
  );
  console.log(`Existing entries: ${existing.length}`);

  const key = (e: NcapEntry) =>
    `${e.make}|${e.model}|${e.year}`.toUpperCase();
  const existingKeys = new Set(existing.map(key));

  let added = 0;
  for (const entry of newEntries) {
    if (!existingKeys.has(key(entry))) {
      existing.push(entry);
      existingKeys.add(key(entry));
      added++;
    }
  }

  console.log(`New entries added: ${added}`);
  console.log(`Total entries: ${existing.length}`);

  existing.sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model));
  return existing;
}

async function main() {
  console.log("Euro NCAP Scraper");
  console.log("=================\n");

  const entries = await fetchAssessments();

  if (entries.length === 0) {
    console.log("\nNo new entries fetched.");
    console.log(
      `Current dataset has ${JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8")).length} entries.`
    );
    console.log(
      "\nTo add entries manually, edit src/data/ncap-ratings.json directly."
    );
    console.log("Each entry should have: make, model, year, overall, adult, child, pedestrian, safetyAssist");
    return;
  }

  const merged = mergeWithExisting(entries);

  if (!DRY_RUN) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2) + "\n");
    console.log(`\nWritten to ${OUTPUT_FILE}`);
  }
}

main().catch(console.error);
