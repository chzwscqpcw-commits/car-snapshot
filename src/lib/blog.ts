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

export interface TocEntry {
  id: string;
  text: string;
  level: number;
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
  toc: TocEntry[];
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function addHeadingIds(htmlContent: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const usedIds = new Set<string>();

  const updated = htmlContent.replace(
    /<(h[23])>(.*?)<\/\1>/gi,
    (_, tag: string, text: string) => {
      const level = parseInt(tag[1], 10);
      const plain = text.replace(/<[^>]+>/g, "");
      let id = slugify(plain);
      if (usedIds.has(id)) {
        let i = 2;
        while (usedIds.has(`${id}-${i}`)) i++;
        id = `${id}-${i}`;
      }
      usedIds.add(id);
      toc.push({ id, text: plain, level });
      return `<${tag} id="${id}">${text}</${tag}>`;
    }
  );

  return { html: updated, toc };
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
  const { html: contentWithIds, toc } = addHeadingIds(result.toString());

  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    date: data.date || "",
    lastModified: data.lastModified || undefined,
    keywords: data.keywords || [],
    author: data.author || "Free Plate Check",
    content: contentWithIds,
    toc,
    readingTime: calculateReadingTime(content),
    wordCount: words,
    howToSteps: data.howToSteps || undefined,
  };
}
