import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "EV Adoption UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "UK Electric Vehicle Adoption 2025",
    "EV fleet growth, new sales share and regional density data."
  );
}
