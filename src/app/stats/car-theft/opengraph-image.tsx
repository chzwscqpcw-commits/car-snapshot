import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";
import theftStats from "@/data/theft-stats.json";

const cars = theftStats.cars.byYear[String(theftStats.year) as keyof typeof theftStats.cars.byYear];

export const alt = "Most Stolen Cars in the UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Most Stolen Cars in the UK",
    `${cars.toLocaleString("en-GB")} cars stolen in ${theftStats.year} — and how to protect yours`
  );
}
