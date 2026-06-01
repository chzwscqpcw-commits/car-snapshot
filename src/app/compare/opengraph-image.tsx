import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Compare Two Cars Side by Side";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Compare Two Cars Side by Side",
    "Specs, running costs, MOT history and valuations for two vehicles — free, no signup."
  );
}
