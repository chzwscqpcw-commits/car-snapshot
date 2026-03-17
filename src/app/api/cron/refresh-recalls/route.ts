export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecallRecord {
  make: string;
  models: string[];
  buildDateStart: string;
  buildDateEnd: string;
  recallDate: string;
  defect: string;
  remedy: string;
  recallNumber: string;
}

// ---------------------------------------------------------------------------
// Configuration (replicated from scripts/process-recalls.ts)
// ---------------------------------------------------------------------------

const DVSA_CSV_URL =
  "https://www.check-vehicle-recalls.service.gov.uk/documents/RecallsFile.csv";

const INCLUDED_VEHICLE_TYPES = new Set([
  "car",
  "cars",
  "light vehicle",
  "light vehicles",
  "lcv",
  "passenger vehicle",
  "passenger car",
  "m1",
]);

const MAKE_ALIASES: Record<string, string> = {
  "FIAT CHRYSLER AUTOMOBILES  UK LTD": "FIAT",
  "FIAT CHRYSLER AUTOMOBILES UK LTD": "FIAT",
  "TOYOTA (GB) PLC": "TOYOTA",
  "MERCEDES-BENZ CARS UK LTD": "MERCEDES-BENZ",
  "MERCEDES BENZ UK LIMITED": "MERCEDES-BENZ",
  "MERCEDES-BENZ VANS UK LTD": "MERCEDES-BENZ",
  VW: "VOLKSWAGEN",
  "NISSAN MOTOR (GB) LIMITED": "NISSAN",
  "VOLVO CAR": "VOLVO",
  "HONDA MOTOR CO": "HONDA",
  "SUZUKI GB PLC": "SUZUKI",
  "CHRYSLER UK LTD": "CHRYSLER",
  "CHEVROLET UK": "CHEVROLET",
  "INFINITI GB": "INFINITI",
  "DS AUTOMOBILES": "DS",
  "GENESIS MOTOR UK": "GENESIS",
  "MG MOTOR": "MG",
  "MCLAREN AUTOMOTIVE LIMITED": "MCLAREN",
  "BENTLEY MOTORS LIMITED": "BENTLEY",
  "POLESTAR AUTOMOTIVE": "POLESTAR",
  "GENERAL MOTORS CO LLC": "GENERAL MOTORS",
};

const EXCLUDED_MAKE_PATTERNS = [
  /MOTORCYCLE/i,
  /MOTORRAD/i,
  /TRUCK/i,
  /BUS\b/i,
  /TRAILER/i,
  /TRACTOR/i,
  /AGRICULTURAL/i,
];
const EXCLUDED_MAKES = new Set([
  "YAMAHA", "KAWASAKI", "DUCATI", "HARLEY DAVIDSON", "KTM",
  "PIAGGIO", "APRILIA", "MOTO GUZZI", "BUELL", "GAS GAS",
  "POLARIS", "BRP-CAN AM", "CCM", "LEXMOTO",
  "HUSQVARNA MOTORCYCLES LTD", "INDIAN MOTORCYCLE COMPANY",
  "MV AGUSTA  MOTOR SPA", "ROYAL ENFIELD UK LTD", "ZERO MOTORCYCLES",
  "TRIUMPH MOTORCYCLES LIMITED",
  "VOLVO TRUCKS", "VOLVO BUS", "DAIMLER TRUCK UK LIMITED",
  "RENAULT TRUCKS UK LTD", "MERCEDES-BENZ & FUSO TRUCKS UK",
  "MERCEDES BENZ BUS", "SCANIA TRUCK", "SCANIA BUS",
  "MAN TRUCK AND BUS LTD", "MAN BUS", "DAF TRUCKS", "DAF BUS",
  "IVECO BUS", "HINO", "DENNIS EAGLE", "DENNIS", "ERF", "FODEN",
  "NEOMAN BUS UK", "OPTARE", "WRIGHTBUS", "ALEXANDER DENNIS",
  "DAIMLER BUSES GMBH", "SEDDON ATKINSON", "MITSUBISHI TRUCK",
  "ISUZU TRUCK",
  "IFOR WILLIAMS", "ADMIRAL TRAILERS",
  "SWIFT", "AUTO-TRAIL", "AUTO-SLEEPERS LTD", "HYMER GMBH & CO KG",
  "KNAUS TABBERT AG", "AUTOCRUISE AND PIONEER", "TRIGANO SPA",
  "NEW HOLLAND", "KUBOTA", "CASE IH", "CLAAS TRACTOR SAS",
  "BARRUS", "MICHELIN", "ALLIANCE AUTOMOTIVE GROUP", "COOPER TIRE",
  "BIKERS LIFESTYLE LTD",
]);

// ---------------------------------------------------------------------------
// Helpers (replicated from scripts/process-recalls.ts)
// ---------------------------------------------------------------------------

function shouldExcludeMake(make: string): boolean {
  if (EXCLUDED_MAKES.has(make)) return true;
  return EXCLUDED_MAKE_PATTERNS.some((p) => p.test(make));
}

function normalizeMake(make: string): string {
  return MAKE_ALIASES[make] || make;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

function parseDate(raw: string): string {
  if (!raw || raw.trim() === "") return "";
  const s = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dmyMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const myMatch = s.match(/^(\d{1,2})[/\-.](\d{4})$/);
  if (myMatch) {
    const month = myMatch[1].padStart(2, "0");
    const year = myMatch[2];
    return `${year}-${month}-01`;
  }

  if (/^\d{4}$/.test(s)) return `${s}-01-01`;

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];

  return "";
}

function parseModels(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw
    .split(/[,;/]|\band\b|\b&\b/i)
    .map((m) => m.trim().toUpperCase())
    .filter((m) => m.length > 0);
}

function detectColumns(headers: string[]) {
  const lower = headers.map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  function findIndex(patterns: string[]): number {
    for (const pattern of patterns) {
      const idx = lower.findIndex((h) => h === pattern);
      if (idx !== -1) return idx;
    }
    for (const pattern of patterns) {
      const idx = lower.findIndex((h) => h.includes(pattern));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  return {
    manufacturer: findIndex(["make", "manufacturer"]),
    model: findIndex(["model", "modelrange"]),
    buildStart: findIndex([
      "buildstart", "buildfrom", "startdate", "buildrangestart", "datefrom",
    ]),
    buildEnd: findIndex([
      "buildend", "buildto", "enddate", "buildrangeend", "dateto",
    ]),
    recallDate: findIndex([
      "recalldate", "launchdate", "dateofrecall", "daterecall",
    ]),
    defect: findIndex(["defect", "concern", "defectdescription", "faultdescription"]),
    remedy: findIndex(["remedy", "remedyaction", "correctiveaction", "remedydescription"]),
    recallNumber: findIndex([
      "recallsnumber", "recallnumber", "recallref", "recallno", "dvsarecall", "recallreference",
    ]),
    vehicleType: findIndex(["vehicletype", "type", "vehiclecategory", "category"]),
  };
}

// ---------------------------------------------------------------------------
// CSV Processing (in-memory, no filesystem writes)
// ---------------------------------------------------------------------------

function processCSVText(csvText: string): {
  records: RecallRecord[];
  totalRows: number;
  filteredOut: number;
  skippedIncomplete: number;
  uniqueMakes: number;
} {
  const lines = csvText.split(/\r?\n/);
  let headers: string[] | null = null;
  let columns: ReturnType<typeof detectColumns> | null = null;
  const records: RecallRecord[] = [];
  let totalRows = 0;
  let filteredOut = 0;
  let skippedIncomplete = 0;

  for (const line of lines) {
    if (line.trim() === "") continue;

    const fields = parseCSVLine(line);

    if (!headers) {
      headers = fields;
      columns = detectColumns(headers);

      // Validate essential columns
      const missing: string[] = [];
      if (columns.manufacturer === -1) missing.push("Manufacturer");
      if (columns.model === -1) missing.push("Model");
      if (columns.recallNumber === -1) missing.push("Recall Number");
      if (columns.defect === -1) missing.push("Defect");

      if (missing.length > 0) {
        throw new Error(
          `Could not detect required CSV columns: ${missing.join(", ")}. Headers found: ${headers.join(" | ")}`
        );
      }
      continue;
    }

    totalRows++;
    if (!columns) continue;

    // Filter by vehicle type if column exists
    if (columns.vehicleType !== -1) {
      const vehicleType = (fields[columns.vehicleType] || "")
        .toLowerCase()
        .trim();
      if (vehicleType && !INCLUDED_VEHICLE_TYPES.has(vehicleType)) {
        filteredOut++;
        continue;
      }
    }

    const rawMake = (fields[columns.manufacturer] || "").trim().toUpperCase();
    if (shouldExcludeMake(rawMake)) {
      filteredOut++;
      continue;
    }

    const make = normalizeMake(rawMake);
    const modelRaw = fields[columns.model] || "";
    const models = parseModels(modelRaw);
    const buildDateStart = parseDate(fields[columns.buildStart] || "");
    const buildDateEnd = parseDate(fields[columns.buildEnd] || "");
    const recallDate = parseDate(fields[columns.recallDate] || "");
    const defect = (fields[columns.defect] || "").trim();
    const remedy =
      columns.remedy !== -1 ? (fields[columns.remedy] || "").trim() : "";
    const recallNumber = (fields[columns.recallNumber] || "").trim();

    if (!make || models.length === 0 || !recallNumber || !defect) {
      skippedIncomplete++;
      continue;
    }

    records.push({
      make,
      models,
      buildDateStart,
      buildDateEnd,
      recallDate,
      defect,
      remedy,
      recallNumber,
    });
  }

  // Sort by recall date descending, then by make
  records.sort((a, b) => {
    const dateCompare = b.recallDate.localeCompare(a.recallDate);
    if (dateCompare !== 0) return dateCompare;
    return a.make.localeCompare(b.make);
  });

  return {
    records,
    totalRows,
    filteredOut,
    skippedIncomplete,
    uniqueMakes: new Set(records.map((r) => r.make)).size,
  };
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // 1. Download DVSA recalls CSV
    const csvResponse = await fetch(DVSA_CSV_URL, {
      headers: { "User-Agent": "FreePlateCheck/1.0 (data-refresh)" },
    });

    if (!csvResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to download DVSA recalls CSV",
          status: csvResponse.status,
          statusText: csvResponse.statusText,
        },
        { status: 502 }
      );
    }

    const csvText = await csvResponse.text();

    // 2. Parse in memory
    const result = processCSVText(csvText);

    // 3. Store in Supabase data_cache table
    const sb = supabaseServer();
    const now = new Date().toISOString();

    const { error: upsertError } = await sb.from("data_cache").upsert(
      {
        key: "recalls",
        data: result.records,
        updated_at: now,
      },
      { onConflict: "key" }
    );

    if (upsertError) {
      console.error("refresh_recalls_upsert_error:", upsertError);
      return NextResponse.json(
        {
          error: "Failed to store recalls in Supabase",
          details: upsertError.message,
        },
        { status: 500 }
      );
    }

    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      records: result.records.length,
      totalRows: result.totalRows,
      filteredOut: result.filteredOut,
      skippedIncomplete: result.skippedIncomplete,
      uniqueMakes: result.uniqueMakes,
      elapsedMs: elapsed,
      timestamp: now,
    });
  } catch (err) {
    console.error("refresh_recalls_error:", err);
    return NextResponse.json(
      {
        error: "Unexpected error during recalls refresh",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
