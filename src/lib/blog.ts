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

/* ── Tag helpers ──────────────────────────────────────────── */

const TAG_RULES: { tag: string; label: string; pattern: RegExp }[] = [
  { tag: "mot", label: "MOT", pattern: /\bmot\b/i },
  { tag: "tax", label: "Tax & VED", pattern: /\b(tax|ved|sorn)\b/i },
  { tag: "mileage", label: "Mileage", pattern: /\b(mileage|clocked|odometer)\b/i },
  { tag: "buying", label: "Buying a Car", pattern: /\b(buying|used car|checklist|first car)\b/i },
  { tag: "ulez", label: "ULEZ", pattern: /\bulez|clean air/i },
  { tag: "recalls", label: "Recalls", pattern: /\brecall/i },
  { tag: "valuation", label: "Valuation", pattern: /\b(valuation|car value|car worth)\b/i },
];

export interface TagInfo {
  tag: string;
  label: string;
  count: number;
}

export function getPostTags(keywords: string[]): string[] {
  const joined = keywords.join(" ");
  const tags = new Set<string>();
  for (const rule of TAG_RULES) {
    if (rule.pattern.test(joined)) tags.add(rule.tag);
  }
  return Array.from(tags);
}

export function getTagLabel(tag: string): string {
  return TAG_RULES.find((r) => r.tag === tag)?.label ?? tag;
}

export function getAllTags(): TagInfo[] {
  const posts = getAllPosts();
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of getPostTags(post.keywords)) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, label: getTagLabel(tag), count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByTag(tag: string): BlogPostMeta[] {
  return getAllPosts().filter((post) => getPostTags(post.keywords).includes(tag));
}

/* ── Related posts ───────────────────────────────────────── */

export function getRelatedPosts(
  slug: string,
  keywords: string[],
  limit = 3
): BlogPostMeta[] {
  const all = getAllPosts().filter((p) => p.slug !== slug);
  const currentTags = new Set(getPostTags(keywords));
  const currentKw = new Set(keywords.map((k) => k.toLowerCase()));

  const scored = all.map((post) => {
    let score = 0;
    // Tag overlap (broad match)
    for (const t of getPostTags(post.keywords)) {
      if (currentTags.has(t)) score += 2;
    }
    // Exact keyword overlap (precise match)
    for (const kw of post.keywords) {
      if (currentKw.has(kw.toLowerCase())) score += 3;
    }
    return { post, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || (a.post.date > b.post.date ? -1 : 1))
    .slice(0, limit)
    .map((s) => s.post);
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
