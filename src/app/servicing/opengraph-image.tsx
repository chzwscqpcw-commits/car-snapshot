import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Compare Car Service Prices Near You";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Compare Car Service Prices Near You",
    "Interim and full service quotes from local garages in seconds. No booking fees, no obligation."
  );
}
