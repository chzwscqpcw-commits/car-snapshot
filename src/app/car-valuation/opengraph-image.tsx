import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free Car Valuation";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Free Car Valuation — How Much Is My Car Worth?",
    "Get a free instant car valuation with no signup. Enter any UK registration number to see an estimated value."
  );
}
