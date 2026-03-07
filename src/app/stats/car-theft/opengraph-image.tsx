import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Car Theft Statistics UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Car Theft Statistics UK 2025",
    "Most stolen cars ranked by theft rate — is your car at risk?"
  );
}
