import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Cost of Motoring UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Cost of Motoring UK 2025",
    "Full annual breakdown of fuel, insurance, depreciation, tax and servicing costs."
  );
}
