import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";
import { fmt, stolen, THEFT_YEAR } from "@/lib/theft-stats";

export const alt = "Most Stolen Vans in the UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage("Most Stolen Vans in the UK", `${fmt(stolen("vans"))} vans and pickups stolen in ${THEFT_YEAR} — and how to protect yours`);
}
