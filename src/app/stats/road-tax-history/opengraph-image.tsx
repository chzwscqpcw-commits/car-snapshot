import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Road Tax VED History UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Road Tax (VED) Rates 2001–2026",
    "How UK vehicle excise duty rates have changed by emission band."
  );
}
