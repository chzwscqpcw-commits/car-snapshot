import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-static";

/**
 * Lightweight index of every published blog post for the command palette.
 * Generated at build time, cached by the CDN — opening ⌘K is one quick fetch.
 */
export async function GET() {
  const posts = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    keywords: p.keywords ?? [],
  }));
  return NextResponse.json(posts, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
