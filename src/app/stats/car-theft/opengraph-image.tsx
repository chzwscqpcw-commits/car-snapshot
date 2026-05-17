import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Most Stolen Cars in the UK 2026";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Most Stolen Cars in the UK 2026",
    "Ranked by theft rate per 1,000 vehicles — is your car at risk?"
  );
}
