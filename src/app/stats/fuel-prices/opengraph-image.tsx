import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "UK Fuel Prices Statistics";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "UK Fuel Prices 1988–2025",
    "Petrol & diesel price trends, fill-cost calculator and key event timeline."
  );
}
