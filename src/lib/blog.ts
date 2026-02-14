import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface HowToStep {
  name: string;
  text: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  lastModified?: string;
  keywords: string[];
  author: string;
  content: string;
  readingTime: number;
  wordCount: number;
  howToSteps?: HowToStep[];
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  lastModified?: string;
  keywords: string[];
  author: string;
  readingTime: number;
  wordCount: number;
}

function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getAllPosts(): BlogPostMeta[] {
  const slugs = getAllPostSlugs();
  return slugs
    .map((slug) => getPostMeta(slug))
    .filter((post): post is BlogPostMeta => post !== null)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostMeta(slug: string): BlogPostMeta | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const words = content.trim().split(/\s+/).length;

  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    date: data.date || "",
    lastModified: data.lastModified || undefined,
    keywords: data.keywords || [],
    author: data.author || "Free Plate Check",
    readingTime: calculateReadingTime(content),
    wordCount: words,
  };
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const result = await remark().use(html).process(content);
  const words = content.trim().split(/\s+/).length;

  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    date: data.date || "",
    lastModified: data.lastModified || undefined,
    keywords: data.keywords || [],
    author: data.author || "Free Plate Check",
    content: result.toString(),
    readingTime: calculateReadingTime(content),
    wordCount: words,
    howToSteps: data.howToSteps || undefined,
  };
}
