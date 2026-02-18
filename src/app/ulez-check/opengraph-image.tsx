import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free ULEZ Check";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Free ULEZ Check — Is My Car Compliant?",
    "Check if your car is ULEZ compliant for free. See Euro status, Clean Air Zone charges and exemptions."
  );
}
