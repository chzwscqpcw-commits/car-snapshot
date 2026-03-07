import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Road Tax VED History UK";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Road Tax (VED) History 2001\u20132025",
    "How UK vehicle excise duty rates have changed by emission band."
  );
}
