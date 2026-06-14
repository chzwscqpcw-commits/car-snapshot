import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free MOT Reminders by Email — Choose When You're Reminded";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Free MOT Reminders by Email",
    "You choose when — book early, keep your renewal date. No signup, no spam. Add up to 5 vehicles."
  );
}
