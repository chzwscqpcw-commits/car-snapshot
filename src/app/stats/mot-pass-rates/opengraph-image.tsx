import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "MOT Pass Rates UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "MOT Pass Rates by Make & Model",
    "National pass rates and top failure reasons — interactive UK MOT statistics."
  );
}
