import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Value My Car — Free Instant UK Valuation, No Email";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Value My Car — Free Instant Valuation",
    "Value your car in 30 seconds with just your registration. Free, no email, no signup."
  );
}
