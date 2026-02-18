import { getPostMeta, getAllPostSlugs } from "@/lib/blog";
import { generateOGImage, ogSize, ogContentType } from "@/lib/og-image";

export const alt = "Free Plate Check";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getPostMeta(slug);

  return generateOGImage(
    meta?.title ?? "Free Plate Check",
    meta?.description ?? ""
  );
}
