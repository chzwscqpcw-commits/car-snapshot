import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";
import { fmt, stolen, THEFT_YEAR } from "@/lib/theft-stats";

export const alt = "Most Stolen Motorbikes in the UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage("Most Stolen Motorbikes in the UK", `${fmt(stolen("motorcycles"))} motorbikes stolen in ${THEFT_YEAR} — led by 125cc scooters`);
}
