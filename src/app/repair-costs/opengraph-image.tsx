import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Car Repair Cost Guides & Local Quotes";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Car Repair Cost Guides & Local Quotes",
    "Typical UK prices for cambelt, DPF, aircon, brakes, battery and clutch — plus local quotes."
  );
}
