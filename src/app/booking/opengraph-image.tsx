import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Book MOT or Service Near You — Compare Prices Free";
export const size = ogSize;
export const contentType = ogContentType;

export default function OGImage() {
  return generateOGImage(
    "Book MOT or Service Near You",
    "Compare MOT and service prices from local garages in seconds. Free, no signup, no email."
  );
}
