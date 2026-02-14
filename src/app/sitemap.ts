import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts = getAllPosts().map((post) => ({
    url: `https://www.freeplatecheck.co.uk/blog/${post.slug}`,
    lastModified: new Date(post.lastModified || post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const tagPages = getAllTags().map((t) => ({
    url: `https://www.freeplatecheck.co.uk/blog/tag/${t.tag}`,
    lastModified: new Date("2026-02-14"),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: "https://www.freeplatecheck.co.uk",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.freeplatecheck.co.uk/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/mot-check",
      lastModified: new Date("2026-02-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/car-check",
      lastModified: new Date("2026-02-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/tax-check",
      lastModified: new Date("2026-02-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/mileage-check",
      lastModified: new Date("2026-02-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/ulez-check",
      lastModified: new Date("2026-02-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/recall-check",
      lastModified: new Date("2026-02-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/car-valuation",
      lastModified: new Date("2026-02-14"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/privacy",
      lastModified: new Date("2026-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.freeplatecheck.co.uk/terms",
      lastModified: new Date("2026-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...blogPosts,
    ...tagPages,
  ];
}
