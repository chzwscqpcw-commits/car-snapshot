import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free Car Check";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Free Car Check — UK Vehicle Lookup",
    "Look up any UK vehicle by reg. See make, model, colour, engine size, fuel type and more from official DVLA data."
  );
}
