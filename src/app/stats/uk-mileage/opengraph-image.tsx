import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "UK Mileage Trends";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "UK Average Car Mileage Trends",
    "Annual mileage data from 1990 to 2024, plus mileage by vehicle age."
  );
}
