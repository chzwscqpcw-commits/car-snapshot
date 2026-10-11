import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Most Stolen Cars in the UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Most Stolen Cars in the UK",
    "54,830 vehicles stolen in 2025 — and how to protect yours"
  );
}
