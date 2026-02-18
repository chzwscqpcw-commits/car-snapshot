import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free MOT History Check";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Free MOT History Check",
    "See every MOT result, advisory and failure since 2005. Check mileage history and spot problems before buying."
  );
}
