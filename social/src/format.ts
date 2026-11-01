/** Small text helpers shared by the pickers, captions and compositions. */

/** Tokens that stay in capitals when a name is title-cased. */
const KEEP_UPPER = new Set([
  "BMW", "MG", "VW", "SEAT", "DS", "MINI", "CUPRA", "KGM", "BYD", "GWM", "ORA", "SUV", "GTI", "GT", "RS",
  "ST", "CR", "HR", "MX", "CX", "NX", "RX", "UX", "AMG", "EQ", "EQA", "EQB", "EQC", "EQE", "EQS", "TT",
  "GLA", "GLB", "GLC", "GLE", "GLS", "SLK", "CLA", "CLS", "XE", "XF", "XJ", "XK", "ZS", "HS", "ZR", "ZT",
  "RCZ", "XC", "XC40", "XC60", "XC90", "V40", "V60", "V90", "S60", "S90", "X", "XL", "SE", "LS", "GS", "IS",
  "CT", "ID", "SL", "SLC", "SLS", "GLK", "ML", "GL", "CLK", "RAV4", "CHR", "CRV", "HRV", "SORN",
]);

/** Whole multi-word parts with their own spelling. */
const SPECIAL: Record<string, string> = {
  "MERCEDES BENZ": "Mercedes-Benz",
  MERCEDES: "Mercedes-Benz",
  "MERCEDES AMG": "Mercedes-AMG",
  "LAND ROVER": "Land Rover",
  "RANGE ROVER": "Range Rover",
  "RANGE ROVER EVOQUE": "Range Rover Evoque",
  "RANGE ROVER SPORT": "Range Rover Sport",
  "RANGE ROVER VELAR": "Range Rover Velar",
  "DISCOVERY SPORT": "Discovery Sport",
  "ALFA ROMEO": "Alfa Romeo",
  "ASTON MARTIN": "Aston Martin",
  "ROLLS ROYCE": "Rolls-Royce",
  CITROEN: "Citroën",
  "E CLASS": "E-Class",
  "C CLASS": "C-Class",
  "A CLASS": "A-Class",
  "B CLASS": "B-Class",
  "S CLASS": "S-Class",
  "G CLASS": "G-Class",
  "V CLASS": "V-Class",
  "CR V": "CR-V",
  "HR V": "HR-V",
  "C HR": "C-HR",
  "MX 5": "MX-5",
  "CX 5": "CX-5",
  "CX 3": "CX-3",
  "CX 30": "CX-30",
  "CX 60": "CX-60",
  "T ROC": "T-Roc",
  "T CROSS": "T-Cross",
  "E TRON": "e-tron",
  "E TRON GT": "e-tron GT",
  "Q4 E TRON": "Q4 e-tron",
  "Q6 E TRON": "Q6 e-tron",
  "ID 3": "ID.3",
  "ID 4": "ID.4",
  "ID 5": "ID.5",
  "ID 7": "ID.7",
  ID3: "ID.3",
  ID4: "ID.4",
  ID5: "ID.5",
  ID7: "ID.7",
  "X TYPE": "X-Type",
  "S TYPE": "S-Type",
  "9 3": "9-3",
  "9 5": "9-5",
  "MODEL 3": "Model 3",
  "MODEL Y": "Model Y",
  "MODEL S": "Model S",
  "MODEL X": "Model X",
  UP: "up!",
  I10: "i10",
  I20: "i20",
  I30: "i30",
  I40: "i40",
  IX: "iX",
  I3: "i3",
  I4: "i4",
  I5: "i5",
  I7: "i7",
  IX1: "iX1",
  IX3: "iX3",
  ZOE: "Zoe",
  "3 SERIES": "3 Series",
  "1 SERIES": "1 Series",
  "2 SERIES": "2 Series",
  "4 SERIES": "4 Series",
  "5 SERIES": "5 Series",
  "7 SERIES": "7 Series",
  "200 SERIES": "200",
  "400 SERIES": "400",
};

function titleToken(tok: string): string {
  if (SPECIAL[tok]) return SPECIAL[tok];
  if (tok.length <= 1) return tok;
  if (/\d/.test(tok)) return tok; // A3, X5, 500, 320D, ID.3
  if (KEEP_UPPER.has(tok)) return tok;
  return tok.charAt(0) + tok.slice(1).toLowerCase();
}

function titlePart(part: string): string {
  const p = part.toUpperCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const spaced = p.replace(/-/g, " ");
  if (SPECIAL[spaced]) return SPECIAL[spaced];
  return p
    .split(" ")
    .map((tok) =>
      tok
        .split("-")
        .map(titleToken)
        .join("-"),
    )
    .join(" ");
}

/** "FORD|FIESTA" → "Ford Fiesta", "MERCEDES-BENZ|C CLASS" → "Mercedes-Benz C-Class". */
export function prettyName(key: string): string {
  return key.split("|").map(titlePart).join(" ");
}

/** 12345 → "12,345". */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-GB");
}

/** 12345 → "£12,345"; with roundTo = 50, 12349 → "£12,350". */
export function fmtGbp(n: number, roundTo = 1): string {
  const r = Math.round(n / roundTo) * roundTo;
  return `£${r.toLocaleString("en-GB")}`;
}

/** 1234567 → "1.2m", 12345 → "12k", 950 → "950". */
export function fmtShort(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}m`;
  if (n >= 1e4) return `${Math.round(n / 1e3)}k`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
}

export function fmtPct(n: number, dp = 0): string {
  return `${n.toFixed(dp)}%`;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** "2026-03-09" → "9 March 2026". */
export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
