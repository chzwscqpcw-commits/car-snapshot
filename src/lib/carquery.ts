/**
 * CarQuery API Prototype — UK Vehicle Match Rate Assessment
 *
 * API: https://www.carqueryapi.com/api/0.3/
 * Data range: 1941-2022
 * Database: ~70K models globally
 *
 * ASSESSMENT RESULT: NOT VIABLE for UK vehicle data enrichment.
 *
 * Match rate for UK vehicles: ~40% of makes, <30% of actual UK registrations.
 *
 * Key findings:
 *
 * 1. MISSING UK-ONLY MAKES (0 results):
 *    - Vauxhall (UK's #2 brand) — not listed, Opel also missing
 *    - Peugeot, Renault, Citroen — major UK brands, zero coverage
 *    - Skoda, SEAT, Dacia — popular budget brands, zero coverage
 *    - DS, Alfa Romeo, Suzuki — zero coverage
 *
 * 2. US-BIASED TRIM DATA:
 *    - Ford Focus 2015: only 6 US trims (2.0L Flex-Fuel)
 *    - UK Focus has 1.0 EcoBoost, 1.5 TDCi, Zetec/Style trims — none present
 *    - Body types use US categories ("Compact Cars") not UK ones
 *
 * 3. GLOBAL MAKES PRESENT (but US-spec only):
 *    - Ford: 22 models, Toyota: 20, BMW: 25, Audi: 23
 *    - Mercedes: 13, Nissan: 16, Hyundai: 12, Kia: 11
 *    - Honda: 9, Volvo: 6, Jaguar: 5, Land Rover: 7
 *
 * 4. DATA STALENESS:
 *    - Max year is 2022, missing 2023-2026 vehicles
 *
 * CONCLUSION: Do not integrate. Our existing VCA + DVLA parser pipeline
 * provides better UK coverage than CarQuery could offer.
 *
 * This file is kept as documentation of the investigation.
 * It is NOT imported or used anywhere in the application.
 */

const CARQUERY_API = "https://www.carqueryapi.com/api/0.3/";

interface CarQueryTrim {
  model_id: string;
  model_make_id: string;
  model_name: string;
  model_trim: string;
  model_year: number;
  model_body: string;
  model_engine_cc: string;
  model_engine_fuel: string;
  model_drive: string;
  model_transmission_type: string;
}

/**
 * Fetch trims from CarQuery API (prototype — not used in production)
 */
export async function lookupCarQuery(
  make: string,
  model: string,
  year: number
): Promise<CarQueryTrim[]> {
  const url = `${CARQUERY_API}?callback=cb&cmd=getTrims&make=${encodeURIComponent(make.toLowerCase())}&model=${encodeURIComponent(model.toLowerCase())}&year=${year}&full_results=1`;

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const text = await response.text();
  const match = text.match(/^cb\(([\s\S]*)\);$/);
  if (!match) return [];

  const data = JSON.parse(match[1]);
  return data.Trims || [];
}
