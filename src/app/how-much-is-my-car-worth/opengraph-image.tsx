import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "How Much Is My Car Worth? Free UK Valuation, No Email";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "How Much Is My Car Worth?",
    "Find out in 30 seconds — free, no email. Live UK market data and real DVLA mileage."
  );
}
