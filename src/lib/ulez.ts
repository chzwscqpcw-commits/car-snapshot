// ULEZ / Clean Air Zone compliance calculator
// Uses DVLA data to determine likely compliance status

export type UlezStatus = "exempt" | "compliant" | "non-compliant" | "unknown";
export type UlezConfidence = "confirmed" | "estimated" | "unknown";

export type CleanAirZone = {
  name: string;
  dailyCharge: string;
  url: string;
};

export type UlezResult = {
  status: UlezStatus;
  confidence: UlezConfidence;
  reason: string;
  details: string;
  cleanAirZones?: CleanAirZone[];
};

const CLEAN_AIR_ZONES: CleanAirZone[] = [
  { name: "London ULEZ", dailyCharge: "£12.50", url: "https://tfl.gov.uk/modes/driving/ultra-low-emission-zone" },
  { name: "Birmingham CAZ", dailyCharge: "£8", url: "https://www.brumbreathes.co.uk" },
  { name: "Bath CAZ", dailyCharge: "£9", url: "https://www.bathnes.gov.uk/bath-clean-air-zone" },
  { name: "Bradford CAZ", dailyCharge: "£12.50", url: "https://www.bradford.gov.uk/clean-air-zone" },
  { name: "Bristol CAZ", dailyCharge: "£9", url: "https://www.bristol.gov.uk/clean-air-zone" },
  { name: "Oxford ZEZ", dailyCharge: "£2–£10", url: "https://www.oxford.gov.uk/zez" },
];

function extractEuroNumber(euroStatus?: string): number | null {
  if (!euroStatus) return null;
  const m = /EURO\s*([0-9]+)/i.exec(euroStatus);
  return m ? Number(m[1]) : null;
}

export function calculateUlezCompliance(vehicle: {
  fuelType?: string;
  euroStatus?: string;
  monthOfFirstRegistration?: string;
  co2Emissions?: number;
  yearOfManufacture?: number;
}): UlezResult {
  const { fuelType, euroStatus, monthOfFirstRegistration, yearOfManufacture } = vehicle;
  const fuelLower = (fuelType ?? "").toLowerCase();

  // 1. Electric / hydrogen → exempt
  if (fuelLower.includes("electric") || fuelLower.includes("hydrogen")) {
    return {
      status: "exempt",
      confidence: "confirmed",
      reason: "Zero-emission vehicle",
      details: `${fuelType} vehicles are exempt from ULEZ and all UK Clean Air Zone charges.`,
    };
  }

  // 2. Historic vehicles (manufactured before 1973) → exempt
  if (yearOfManufacture && yearOfManufacture < 1973) {
    return {
      status: "exempt",
      confidence: "confirmed",
      reason: "Historic vehicle (pre-1973)",
      details: "Vehicles manufactured before 1 January 1973 are exempt from ULEZ charges.",
    };
  }

  // 3. Euro standard available
  const euroNum = extractEuroNumber(euroStatus);
  if (euroNum !== null) {
    const isPetrol = fuelLower.includes("petrol") || fuelLower.includes("gas");
    const isDiesel = fuelLower.includes("diesel");

    if (isPetrol) {
      if (euroNum >= 4) {
        return {
          status: "compliant",
          confidence: "confirmed",
          reason: `Euro ${euroNum} petrol — meets ULEZ standard`,
          details: `Petrol vehicles need Euro 4 or above. This vehicle is Euro ${euroNum}.`,
        };
      } else {
        return {
          status: "non-compliant",
          confidence: "confirmed",
          reason: `Euro ${euroNum} petrol — below ULEZ standard`,
          details: `Petrol vehicles need Euro 4 or above. This vehicle is Euro ${euroNum}. A daily charge applies in ULEZ and Clean Air Zones.`,
          cleanAirZones: CLEAN_AIR_ZONES,
        };
      }
    }

    if (isDiesel) {
      if (euroNum >= 6) {
        return {
          status: "compliant",
          confidence: "confirmed",
          reason: `Euro ${euroNum} diesel — meets ULEZ standard`,
          details: `Diesel vehicles need Euro 6 or above. This vehicle is Euro ${euroNum}.`,
        };
      } else {
        return {
          status: "non-compliant",
          confidence: "confirmed",
          reason: `Euro ${euroNum} diesel — below ULEZ standard`,
          details: `Diesel vehicles need Euro 6 or above. This vehicle is Euro ${euroNum}. A daily charge applies in ULEZ and Clean Air Zones.`,
          cleanAirZones: CLEAN_AIR_ZONES,
        };
      }
    }

    // Hybrid or other fuel with euro standard
    if (euroNum >= 6) {
      return {
        status: "compliant",
        confidence: "confirmed",
        reason: `Euro ${euroNum} — meets ULEZ standard`,
        details: `This vehicle meets the Euro 6 emissions standard required for ULEZ compliance.`,
      };
    }
  }

  // 4. Fallback by registration date
  if (monthOfFirstRegistration) {
    const [regYear, regMonth] = monthOfFirstRegistration.split("-").map(Number);
    if (regYear && regMonth) {
      const regDate = new Date(regYear, regMonth - 1);
      const isPetrol = fuelLower.includes("petrol") || fuelLower.includes("gas");
      const isDiesel = fuelLower.includes("diesel");

      // Petrol registered after Jan 2006 → likely Euro 4+
      if (isPetrol && regDate >= new Date(2006, 0)) {
        return {
          status: "compliant",
          confidence: "estimated",
          reason: "Petrol registered after Jan 2006 — likely Euro 4+",
          details: "Most petrol cars registered from January 2006 meet Euro 4 or above. Verify on the TfL ULEZ checker for confirmation.",
        };
      }

      // Diesel registered after Sep 2015 → likely Euro 6
      if (isDiesel && regDate >= new Date(2015, 8)) {
        return {
          status: "compliant",
          confidence: "estimated",
          reason: "Diesel registered after Sep 2015 — likely Euro 6",
          details: "Most diesel cars registered from September 2015 meet Euro 6. Verify on the TfL ULEZ checker for confirmation.",
        };
      }

      // Petrol before 2006
      if (isPetrol && regDate < new Date(2006, 0)) {
        return {
          status: "non-compliant",
          confidence: "estimated",
          reason: "Petrol registered before Jan 2006 — likely below Euro 4",
          details: "Most petrol cars registered before January 2006 do not meet Euro 4. A daily charge likely applies in ULEZ and Clean Air Zones.",
          cleanAirZones: CLEAN_AIR_ZONES,
        };
      }

      // Diesel before Sep 2015
      if (isDiesel && regDate < new Date(2015, 8)) {
        return {
          status: "non-compliant",
          confidence: "estimated",
          reason: "Diesel registered before Sep 2015 — likely below Euro 6",
          details: "Most diesel cars registered before September 2015 do not meet Euro 6. A daily charge likely applies in ULEZ and Clean Air Zones.",
          cleanAirZones: CLEAN_AIR_ZONES,
        };
      }
    }
  }

  // 5. No data → unknown
  return {
    status: "unknown",
    confidence: "unknown",
    reason: "Not enough data to determine ULEZ compliance",
    details: "We couldn't determine the emission standard for this vehicle. Check the TfL ULEZ checker with your registration number.",
  };
}
