import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Most Popular Cars UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Most Popular Cars in the UK 2025",
    "Top makes, models and colours on UK roads today."
  );
}
