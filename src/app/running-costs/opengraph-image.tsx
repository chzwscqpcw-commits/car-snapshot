import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Car Running Costs Calculator";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Car Running Costs Calculator",
    "Enter a reg for a free breakdown of fuel, tax, depreciation, MOT and servicing costs."
  );
}
