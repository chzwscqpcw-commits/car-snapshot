import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "UK Motoring Statistics";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "UK Motoring Statistics 2025",
    "Interactive charts covering fuel prices, MOT pass rates, car theft, EV adoption and more."
  );
}
