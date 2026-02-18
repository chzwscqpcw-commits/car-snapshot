import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free Mileage Check";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Free Mileage Check — Spot Clocking",
    "Track odometer readings across MOT tests to spot mileage fraud. See if a car has been clocked before you buy."
  );
}
