import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Car Registrations UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "UK New Car Registrations 2025",
    "Annual sales trends and fuel type split since 1990."
  );
}
