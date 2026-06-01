import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free MOT Reminders by Email — 28 & 7 Days Before Expiry";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Free MOT Reminders by Email",
    "Sent 28 and 7 days before your MOT expires. No signup, no spam. Add up to 5 vehicles."
  );
}
