import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-static";

export async function GET() {
  const posts = getAllPosts().slice(0, 3);
  return NextResponse.json(posts);
}
