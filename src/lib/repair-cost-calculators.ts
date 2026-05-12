// Personalised repair cost estimates by vehicle.
//
// Each calculator returns a structured result the PersonalisedCostLookup
// component renders into the page after a successful /api/lookup call.
//
// Calculators are kept narrow: we use only fields the API actually returns
// and we never invent precision we don't have. If a vehicle's data is
// missing or ambiguous, fall back to a sensible "could be either" message.

export interface VehicleSummary {
  registrationNumber: string;
  make?: string;
  model?: string;
  yearOfManufacture?: number;
  fuelType?: string;
  motTests?: Array<{
    completedDate: string;
    odometer?: { value: number; unit: string };
  }>;
}

export interface CostEstimate {
  /** e.g. "£130 – £200" */
  range: string;
  /** Short headline, e.g. "Your car uses R1234YF refrigerant" */
  headline: string;
  /** One- or two-sentence explanation tailored to the vehicle */
  body: string;
  /** Optional recommendation / next-step nudge */
  recommendation?: string;
  /** If we can't usefully personalise, set true so the UI shows a softer header */
  generic?: boolean;
}

export type RepairCostSlug =
  | "aircon-regas"
  | "cambelt-replacement"
  | "dpf-cleaning"
  | "brake-pads-replacement"
  | "car-battery-replacement"
  | "clutch-replacement";

function describeVehicle(v: VehicleSummary): string {
  const parts = [
    v.yearOfManufacture ? String(v.yearOfManufacture) : null,
    v.make ? toTitleCase(v.make) : null,
    v.model ? toTitleCase(v.model) : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "your vehicle";
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => (part.match(/\s+|-/) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

function isDiesel(fuelType?: string): boolean {
  return /diesel/i.test(fuelType || "");
}

function isPetrol(fuelType?: string): boolean {
  return /petrol/i.test(fuelType || "");
}

function isElectric(fuelType?: string): boolean {
  return /electricity|electric/i.test(fuelType || "");
}

function vehicleAge(v: VehicleSummary): number | null {
  if (!v.yearOfManufacture) return null;
  return new Date().getFullYear() - v.yearOfManufacture;
}

function latestMileage(v: VehicleSummary): number | null {
  if (!v.motTests || v.motTests.length === 0) return null;
  for (const t of v.motTests) {
    if (t.odometer?.value && t.odometer.unit === "MI") return t.odometer.value;
  }
  return null;
}

// ── Calculators ───────────────────────────────────────────────

export function calculateAirconRegas(v: VehicleSummary): CostEstimate {
  const vehicle = describeVehicle(v);
  const year = v.yearOfManufacture;

  if (isElectric(v.fuelType)) {
    return {
      range: "£70 – £200",
      headline: `${vehicle} — heat-pump system`,
      body: "Many EVs use a heat-pump for cabin climate rather than a traditional A/C compressor, but they still use refrigerant and still need periodic servicing. Always confirm with an EV-experienced garage.",
      generic: false,
    };
  }

  if (!year) {
    return {
      range: "£60 – £200",
      headline: `Aircon regas for ${vehicle}`,
      body: "We don't have a registration year for this car, so we can't pin down the refrigerant type. A garage will check the label under the bonnet before quoting.",
      generic: true,
    };
  }

  if (year >= 2017) {
    return {
      range: "£130 – £200",
      headline: `${vehicle} uses R1234YF refrigerant`,
      body: "All cars first registered from 2017 must use R1234YF refrigerant. The gas itself costs garages around £100/kg and the equipment to handle it is more expensive — that's why the regas is pricier than older cars.",
      recommendation: "Expect quotes near the top of the £130–£200 range. If a garage offers significantly less, double-check they're using the correct R1234YF refrigerant for your car.",
    };
  }

  if (year < 2014) {
    return {
      range: "£60 – £95",
      headline: `${vehicle} uses R134A refrigerant`,
      body: "Cars registered before 2014 use R134A, which is much cheaper for garages to handle. A standard regas is usually done in 30–45 minutes at this price point.",
      recommendation: "Anything over £100 for a basic regas on this car is on the high side — get a second quote.",
    };
  }

  return {
    range: "£90 – £180",
    headline: `${vehicle} could use either refrigerant`,
    body: "Cars registered 2014–2016 are a transition era — some use the older R134A, some the newer R1234YF. The label under your bonnet will say which one applies. Get the garage to confirm before quoting a final price.",
  };
}

export function calculateCambelt(v: VehicleSummary): CostEstimate {
  const vehicle = describeVehicle(v);
  const age = vehicleAge(v);
  const mileage = latestMileage(v);

  if (!v.yearOfManufacture) {
    return {
      range: "£300 – £950",
      headline: `Cambelt replacement for ${vehicle}`,
      body: "Without a registration year we can't estimate cambelt urgency. Check your service book or owner's manual for the recommended change interval.",
      generic: true,
    };
  }

  const mileageStr = mileage ? ` and around ${mileage.toLocaleString()} miles` : "";
  const dieselSurcharge = isDiesel(v.fuelType);

  // Generic interval guidance
  let urgency = "";
  if (age !== null && age >= 5) {
    urgency = `At ${age} years old${mileageStr}, this car is at or past the typical 5-year / 60,000-mile cambelt interval. If there's no record of a previous replacement, treat it as overdue.`;
  } else if (age !== null && age >= 3) {
    urgency = `At ${age} years old${mileageStr}, your car is approaching the typical 5-year / 60,000-mile interval. Worth checking your service history for the last replacement date.`;
  } else {
    urgency = `At ${age} years old${mileageStr}, your car should be well inside the original cambelt's lifespan — most need replacing every 5 years / 60,000 miles.`;
  }

  const baseRange = dieselSurcharge ? "£500 – £950" : "£400 – £800";
  return {
    range: baseRange,
    headline: `${vehicle} cambelt replacement`,
    body: urgency,
    recommendation: dieselSurcharge
      ? "Diesel cambelt jobs almost always include a dual-mass flywheel check, which can push the cost higher. Make sure the quote spells out whether the DMF is included."
      : "Always include the water pump in the quote — replacing it later costs another £300 in labour because the timing cover has to come off again.",
  };
}

export function calculateDpf(v: VehicleSummary): CostEstimate {
  const vehicle = describeVehicle(v);

  if (isElectric(v.fuelType)) {
    return {
      range: "n/a",
      headline: `${vehicle} doesn't have a DPF`,
      body: "Electric vehicles don't have exhaust systems, so there's no diesel particulate filter to clean. If you're getting warning lights, it's a different system — try our dashboard warning lights guide.",
      generic: true,
    };
  }

  if (isPetrol(v.fuelType)) {
    return {
      range: "n/a",
      headline: `${vehicle} doesn't have a DPF`,
      body: "DPFs are fitted to diesel cars only. If your petrol car has an exhaust-related warning light, the most likely culprit is the catalytic converter, lambda sensor, or oxygen sensor — not a DPF.",
      generic: true,
    };
  }

  if (!isDiesel(v.fuelType)) {
    return {
      range: "£150 – £500",
      headline: `DPF cleaning for ${vehicle}`,
      body: "We can't confirm this car is diesel from the data we have. DPFs are only fitted to diesel cars — if yours isn't a diesel, the warning light is from a different system.",
      generic: true,
    };
  }

  const age = vehicleAge(v);
  const ageNote =
    age !== null && age >= 8
      ? `At ${age} years old, your diesel is in the age band where DPF blockages become more frequent — particularly if it's been used mostly for short trips.`
      : age !== null && age >= 4
      ? `At ${age} years old, soot buildup is normal and a clean can extend the DPF's life significantly.`
      : "Your DPF is relatively new — a forced regen at a garage is usually all that's needed at this age.";

  return {
    range: "£150 – £500",
    headline: `${vehicle} DPF cleaning`,
    body: ageNote,
    recommendation:
      "Before booking a clean, try a 20-minute drive at sustained 50+ mph in 4th/5th gear. That triggers an automatic regeneration and clears around half of light blockages — for free.",
  };
}

export function calculateBrakePads(v: VehicleSummary): CostEstimate {
  const vehicle = describeVehicle(v);
  const age = vehicleAge(v);
  const mileage = latestMileage(v);

  if (isElectric(v.fuelType)) {
    return {
      range: "£90 – £350",
      headline: `${vehicle} — EV brake pads`,
      body: "Electric cars use regenerative braking, so the physical brake pads typically last twice as long as a petrol or diesel — 80,000–100,000 miles is common. The downside is that the discs can rust because they're used so little.",
      recommendation:
        "Ask the garage to check disc rust as well as pad wear. EV discs sometimes need replacing before the pads do.",
    };
  }

  if (!v.yearOfManufacture) {
    return {
      range: "£90 – £350",
      headline: `Brake pads for ${vehicle}`,
      body: "We don't have enough vehicle data to give a more specific estimate. The range below covers most UK cars.",
      generic: true,
    };
  }

  const context: string[] = [];
  if (age !== null) context.push(`${age} years old`);
  if (mileage !== null) context.push(`around ${mileage.toLocaleString()} miles`);
  const contextStr = context.length ? ` (${context.join(", ")})` : "";

  return {
    range: "£90 – £350",
    headline: `${vehicle} brake pads${contextStr}`,
    body: "Front pads typically need replacing every 30,000–50,000 miles. If your discs have a noticeable lip or are below minimum thickness, plan to replace them at the same time — that's where the price jumps up.",
    recommendation:
      "Ask the garage to measure remaining disc thickness against the manufacturer minimum before quoting. That single measurement tells you whether you're looking at pads only or pads + discs.",
  };
}

export function calculateBattery(v: VehicleSummary): CostEstimate {
  const vehicle = describeVehicle(v);
  const age = vehicleAge(v);

  if (isElectric(v.fuelType)) {
    return {
      range: "£80 – £250",
      headline: `${vehicle} 12V battery`,
      body: "Even electric cars have a 12V auxiliary battery — it powers door locks, infotainment standby, and the contactor that connects the main traction battery. They last 4–5 years like any other car battery and fail the same way.",
      generic: true,
    };
  }

  if (!v.yearOfManufacture) {
    return {
      range: "£80 – £250",
      headline: `Car battery for ${vehicle}`,
      body: "Most car batteries last 4–5 years. Without a registration year we can't say where you are in that lifecycle, but if you're getting slow cranks or stop-start failures, it's time to test.",
      generic: true,
    };
  }

  const needsAgm = v.yearOfManufacture >= 2014;
  const ageHint =
    age !== null && age >= 4
      ? `Your ${age}-year-old ${vehicle.split(" ").slice(1).join(" ") || "car"} is in the typical battery-failure window. Most batteries last 4–5 years.`
      : age !== null
      ? `At ${age} years old, your battery should still have life left — unless you've had stop-start failures or slow cranks recently.`
      : "Your battery age is hard to estimate without service records, but slow cranks and stop-start failures are the tell-tale signs.";

  return {
    range: needsAgm ? "£160 – £250" : "£80 – £170",
    headline: `${vehicle} battery replacement`,
    body: ageHint,
    recommendation: needsAgm
      ? "Cars from 2014 onwards typically need an AGM or EFB battery for stop-start. Fitting a cheaper standard battery will shorten its life — make sure the garage specifies AGM or EFB on the quote."
      : "A standard lead-acid battery is fine for your car — most independent garages and parts shops can fit one in under an hour.",
  };
}

export function calculateClutch(v: VehicleSummary): CostEstimate {
  const vehicle = describeVehicle(v);

  if (isElectric(v.fuelType)) {
    return {
      range: "n/a",
      headline: `${vehicle} doesn't have a clutch`,
      body: "Electric cars use a single-speed transmission with no clutch pedal or friction clutch. If you're noticing drivetrain issues, it's usually the reduction gearbox or motor itself — both rare but expensive.",
      generic: true,
    };
  }

  if (!v.yearOfManufacture) {
    return {
      range: "£400 – £1,200",
      headline: `Clutch replacement for ${vehicle}`,
      body: "Without a registration year we can't narrow the estimate further. Most clutch jobs land between £450 and £950 — the variance is mostly down to whether a dual-mass flywheel needs replacing.",
      generic: true,
    };
  }

  const dieselSurcharge = isDiesel(v.fuelType);
  const range = dieselSurcharge ? "£700 – £1,200" : "£450 – £900";
  const dmfNote = dieselSurcharge
    ? "Most modern diesels use a dual-mass flywheel (DMF). It's not strictly part of the clutch but it's almost always replaced at the same time — the labour is already done and the DMF usually wears in step with the clutch."
    : "Petrol cars usually have a simpler single-mass flywheel, which keeps the total cost down. Your clutch quote should be at the lower end of the range.";

  return {
    range,
    headline: `${vehicle} clutch replacement`,
    body: dmfNote,
    recommendation:
      "Watch for a high biting point and slipping under acceleration — those are the early signs. Driving on a slipping clutch overheats the flywheel and can double the bill.",
  };
}

// Single dispatcher for the component
export function calculateRepairCost(
  slug: RepairCostSlug,
  vehicle: VehicleSummary
): CostEstimate {
  switch (slug) {
    case "aircon-regas":
      return calculateAirconRegas(vehicle);
    case "cambelt-replacement":
      return calculateCambelt(vehicle);
    case "dpf-cleaning":
      return calculateDpf(vehicle);
    case "brake-pads-replacement":
      return calculateBrakePads(vehicle);
    case "car-battery-replacement":
      return calculateBattery(vehicle);
    case "clutch-replacement":
      return calculateClutch(vehicle);
  }
}
