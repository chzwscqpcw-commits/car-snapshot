// VED (Vehicle Excise Duty) road tax calculator
// Based on GOV.UK rates — verify periodically

export const RATES_LAST_VERIFIED = "2026-02-09";

export type VedResult = {
  estimatedAnnualRate: number | null;
  band: string | null;
  rateType: "post-2017" | "pre-2017" | null;
  details: string;
  disclaimer: string;
};

// Post-April 2017 flat rates (2025/26 rates — from April 2025)
const POST_2017_STANDARD = 195; // all fuel types pay the same from April 2025
const PREMIUM_SUPPLEMENT = 425; // cars with list price over £40,000, years 2-6

// Pre-2017 electric vehicles pay a reduced flat rate (Band A/B equivalent)
const PRE_2017_ELECTRIC = 20;

// Pre-March 2001 engine-size based rates
const PRE_2001_SMALL_ENGINE = 220; // up to 1549cc
const PRE_2001_LARGE_ENGINE = 360; // over 1549cc

// Pre-April 2017 CO2-based bands
type VedBand = { band: string; co2Min: number; co2Max: number; petrol: number; diesel: number; altFuel: number };

// Pre-2017 rates: 2025/26 — alt fuel discount removed from April 2025
const PRE_2017_BANDS: VedBand[] = [
  { band: "A", co2Min: 0, co2Max: 100, petrol: 20, diesel: 20, altFuel: 20 },
  { band: "B", co2Min: 101, co2Max: 110, petrol: 20, diesel: 20, altFuel: 20 },
  { band: "C", co2Min: 111, co2Max: 120, petrol: 35, diesel: 35, altFuel: 35 },
  { band: "D", co2Min: 121, co2Max: 130, petrol: 165, diesel: 165, altFuel: 165 },
  { band: "E", co2Min: 131, co2Max: 140, petrol: 195, diesel: 195, altFuel: 195 },
  { band: "F", co2Min: 141, co2Max: 150, petrol: 215, diesel: 215, altFuel: 215 },
  { band: "G", co2Min: 151, co2Max: 165, petrol: 265, diesel: 265, altFuel: 265 },
  { band: "H", co2Min: 166, co2Max: 175, petrol: 315, diesel: 315, altFuel: 315 },
  { band: "I", co2Min: 176, co2Max: 185, petrol: 345, diesel: 345, altFuel: 345 },
  { band: "J", co2Min: 186, co2Max: 200, petrol: 395, diesel: 395, altFuel: 395 },
  { band: "K", co2Min: 201, co2Max: 225, petrol: 430, diesel: 430, altFuel: 430 },
  { band: "L", co2Min: 226, co2Max: 255, petrol: 735, diesel: 735, altFuel: 735 },
  { band: "M", co2Min: 256, co2Max: 9999, petrol: 760, diesel: 760, altFuel: 760 },
];

function isElectric(fuelType?: string): boolean {
  const f = (fuelType ?? "").toLowerCase();
  // Pure electric only — exclude hybrids like "PETROL/ELECTRICITY"
  return f.includes("electric") && !f.includes("hybrid") && !f.includes("petrol") && !f.includes("diesel");
}

function isAltFuel(fuelType?: string): boolean {
  const f = (fuelType ?? "").toLowerCase();
  if (f.includes("hybrid") || f.includes("gas") || f.includes("lpg") || f.includes("cng")) return true;
  // Mixed fuel types (e.g. "PETROL/ELECTRICITY") are hybrid/alt fuel
  if (f.includes("electric") && (f.includes("petrol") || f.includes("diesel"))) return true;
  return false;
}

function isDiesel(fuelType?: string): boolean {
  return (fuelType ?? "").toLowerCase().includes("diesel");
}

export function calculateVed(vehicle: {
  co2Emissions?: number;
  engineCapacity?: number;
  fuelType?: string;
  monthOfFirstRegistration?: string;
}): VedResult {
  const { co2Emissions, engineCapacity, fuelType, monthOfFirstRegistration } = vehicle;
  const disclaimer = `Estimated rate based on GOV.UK data (last verified ${RATES_LAST_VERIFIED}). Actual rate may differ — check GOV.UK for your exact vehicle.`;

  // Determine registration date
  let regDate: Date | null = null;
  if (monthOfFirstRegistration) {
    const [year, month] = monthOfFirstRegistration.split("-").map(Number);
    if (year && month) {
      regDate = new Date(year, month - 1);
    }
  }

  const postApril2017 = regDate && regDate >= new Date(2017, 3); // April 2017
  const preMarch2001 = regDate && regDate < new Date(2001, 2); // March 2001

  // ── Post-April 2017: flat rate for all fuel types ──
  if (postApril2017) {
    const rate = POST_2017_STANDARD;
    const supplementNote = ` Vehicles with a list price over £40,000 may pay an additional £${PREMIUM_SUPPLEMENT}/year supplement for years 2–6.`;

    if (isElectric(fuelType)) {
      return {
        estimatedAnnualRate: rate,
        band: "Standard (zero emission)",
        rateType: "post-2017",
        details: `From April 2025, electric vehicles pay the standard rate of £${rate}/year.${supplementNote}`,
        disclaimer,
      };
    }

    return {
      estimatedAnnualRate: rate,
      band: isAltFuel(fuelType) ? "Standard (alternative fuel)" : "Standard",
      rateType: "post-2017",
      details: `Post-April 2017 vehicles pay a flat rate of £${rate}/year.${supplementNote}`,
      disclaimer,
    };
  }

  // ── Pre-March 2001: engine-size based ──
  if (preMarch2001) {
    if (engineCapacity !== undefined && engineCapacity !== null && engineCapacity > 0) {
      const rate = engineCapacity <= 1549 ? PRE_2001_SMALL_ENGINE : PRE_2001_LARGE_ENGINE;
      const sizeLabel = engineCapacity <= 1549 ? "up to 1,549cc" : "over 1,549cc";
      return {
        estimatedAnnualRate: rate,
        band: sizeLabel,
        rateType: "pre-2017",
        details: `Pre-March 2001 vehicles are taxed by engine size. ${engineCapacity}cc (${sizeLabel}) = £${rate}/year.`,
        disclaimer,
      };
    }

    return {
      estimatedAnnualRate: null,
      band: null,
      rateType: null,
      details: "Pre-March 2001 vehicles are taxed by engine size. Engine capacity data not available.",
      disclaimer,
    };
  }

  // ── March 2001 to March 2017: CO2 emission bands ──

  // Pure electric pre-2017: £20/year flat rate
  if (isElectric(fuelType)) {
    return {
      estimatedAnnualRate: PRE_2017_ELECTRIC,
      band: "Band A (zero emission)",
      rateType: "pre-2017",
      details: `Pre-April 2017 zero-emission vehicles pay £${PRE_2017_ELECTRIC}/year.`,
      disclaimer,
    };
  }

  if (co2Emissions !== undefined && co2Emissions !== null) {
    const band = PRE_2017_BANDS.find(b => co2Emissions >= b.co2Min && co2Emissions <= b.co2Max);
    if (band) {
      let rate: number;
      if (isAltFuel(fuelType)) {
        rate = band.altFuel;
      } else if (isDiesel(fuelType)) {
        rate = band.diesel;
      } else {
        rate = band.petrol;
      }

      return {
        estimatedAnnualRate: rate,
        band: `Band ${band.band} (${band.co2Min}–${band.co2Max} g/km)`,
        rateType: "pre-2017",
        details: `Band ${band.band} — £${rate}/year based on ${co2Emissions}g/km CO2 emissions.`,
        disclaimer,
      };
    }
  }

  // Not enough data
  if (!regDate && co2Emissions === undefined) {
    return {
      estimatedAnnualRate: null,
      band: null,
      rateType: null,
      details: "Not enough data to estimate road tax. Registration date and CO2 emissions are needed.",
      disclaimer,
    };
  }

  // Pre-2017 without CO2 data
  return {
    estimatedAnnualRate: null,
    band: null,
    rateType: null,
    details: "CO2 emissions data not available — cannot estimate pre-April 2017 road tax band.",
    disclaimer,
  };
}
