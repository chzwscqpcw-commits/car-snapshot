import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free Car Tax Check";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Free Car Tax Check — Is My Car Taxed?",
    "Check if any UK vehicle is taxed, SORN'd or untaxed. See the expiry date and VED band. Free instant results."
  );
}
