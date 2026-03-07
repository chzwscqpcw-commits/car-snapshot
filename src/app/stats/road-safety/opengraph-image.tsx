import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Road Safety Statistics UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "UK Road Safety Statistics",
    "Fatalities and casualties since 1970 — key milestones and trends."
  );
}
