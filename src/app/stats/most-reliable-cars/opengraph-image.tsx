import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Most Reliable Cars UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Most Reliable Cars in the UK 2025",
    "MOT pass rate rankings based on millions of real test results."
  );
}
