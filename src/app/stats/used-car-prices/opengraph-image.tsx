import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Used Car Prices UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Used Car Prices UK 2025",
    "Quarterly price index, depreciation calculator and market trend analysis."
  );
}
