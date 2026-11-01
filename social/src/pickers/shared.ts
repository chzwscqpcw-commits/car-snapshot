import { SAMPLE_CARS } from "@/components/home/sample-cars";
import { DOMAIN } from "../brand/theme";

/** The sample plate shown on the closing card: a made-up one, rotated by week. */
export function samplePlate(index: number): string {
  return SAMPLE_CARS[index % SAMPLE_CARS.length].plate;
}

export const CTA = {
  brand: "Check any car's MOT history, tax, mileage and theft risk",
  sellers: `Free valuation at ${DOMAIN}`,
  mot: "See what your car failed on before, and when it's due",
} as const;

export const EYEBROW = {
  brand: "Free Plate Check",
  sellers: "Free car valuation",
  mot: "MOT check",
} as const;

/** Pick one item from a list by occurrence, wrapping. */
export function nth<T>(list: readonly T[], occurrence: number): T {
  return list[((occurrence % list.length) + list.length) % list.length];
}
