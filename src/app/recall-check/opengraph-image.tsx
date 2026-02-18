import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free Car Recall Check";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Free Car Recall Check — Safety Recalls UK",
    "Check if your car has any outstanding safety recalls for free. See recall details, defects and remedies."
  );
}
