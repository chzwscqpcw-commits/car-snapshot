import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Car Valuation — No Signup, No Email, No Marketing";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Car Valuation — No Signup, No Email",
    "Value your car with just a registration number. The minimum data possible, never sold to lead brokers."
  );
}
