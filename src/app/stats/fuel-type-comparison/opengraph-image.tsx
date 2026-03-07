import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Fuel Type Comparison UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Petrol vs Diesel vs Electric Costs",
    "Compare running costs by fuel type at any annual mileage."
  );
}
