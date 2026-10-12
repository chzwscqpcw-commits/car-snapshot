import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";
import { THEFT_YEAR } from "@/lib/theft-stats";

export const alt = "Least Stolen Cars in the UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage("Least Stolen Cars in the UK", `The cars thieves leave alone — ${THEFT_YEAR} DVLA theft rates`);
}
