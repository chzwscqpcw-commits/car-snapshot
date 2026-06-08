import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags, getPostTags } from "@/lib/blog";
import { MODEL_REGISTRY, getUniqueMakes } from "@/lib/model-guides";
import { CAZ_ZONES } from "@/data/caz-zones";
import { MOT_TOWNS } from "@/data/mot-locations";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  // Skip noindex'd posts. If they're not indexable, they shouldn't be
  // discoverable via the sitemap either — keeps the sitemap clean and
  // signals to Google that these aren't part of our intended surface.
  const indexablePosts = posts.filter((post) => !post.noindex);

  const blogPosts = indexablePosts.map((post) => ({
    url: `https://www.freeplatecheck.co.uk/blog/${post.slug}`,
    lastModified: new Date(post.lastModified || post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Build a map of tag -> latest post date (using lastModified or date)
  const tagLatestDate = new Map<string, string>();
  for (const post of posts) {
    const postDate = post.lastModified || post.date;
    for (const tag of getPostTags(post.keywords)) {
      const current = tagLatestDate.get(tag);
      if (!current || postDate > current) {
        tagLatestDate.set(tag, postDate);
      }
    }
  }

  const tagPages = getAllTags().map((t) => ({
    url: `https://www.freeplatecheck.co.uk/blog/tag/${t.tag}`,
    lastModified: new Date(tagLatestDate.get(t.tag) || "2026-02-14"),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const carMakePages = getUniqueMakes().map((m) => ({
    url: `https://www.freeplatecheck.co.uk/cars/${m.makeSlug}`,
    lastModified: new Date("2026-02-20"),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const carModelPages = MODEL_REGISTRY.map((m) => ({
    url: `https://www.freeplatecheck.co.uk/cars/${m.makeSlug}/${m.modelSlug}`,
    lastModified: new Date("2026-02-20"),
    changeFrequency: "monthly" as const,
    priority: 0.7,
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
      url: "https://www.freeplatecheck.co.uk/value-my-car",
      lastModified: new Date("2026-05-28"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/how-much-is-my-car-worth",
      lastModified: new Date("2026-05-28"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/car-valuation-no-signup",
      lastModified: new Date("2026-05-28"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/booking",
      lastModified: new Date("2026-05-29"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/cheap-mot",
      lastModified: new Date("2026-06-01"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/mot-prices",
      lastModified: new Date("2026-06-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...MOT_TOWNS.map((t) => ({
      url: `https://www.freeplatecheck.co.uk/mot-prices/${t.slug}`,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: "https://www.freeplatecheck.co.uk/running-costs",
      lastModified: new Date("2026-03-13"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/mot-reminder",
      lastModified: new Date("2026-03-02"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/compare",
      lastModified: new Date("2026-03-13"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/embed",
      lastModified: new Date("2026-03-13"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.freeplatecheck.co.uk/about",
      lastModified: new Date("2026-03-13"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.freeplatecheck.co.uk/contact",
      lastModified: new Date("2026-03-13"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: "https://www.freeplatecheck.co.uk/tools",
      lastModified: new Date("2026-05-29"),
      changeFrequency: "weekly",
      priority: 0.95,
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
    {
      url: "https://www.freeplatecheck.co.uk/cars",
      lastModified: new Date("2026-02-20"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/fuel-prices",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/most-reliable-cars",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/used-car-prices",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/mot-pass-rates",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/cost-of-motoring",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/car-theft",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/car-colours",
      lastModified: new Date("2026-06-08"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/fuel-type-comparison",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/ev-adoption",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/car-registrations",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/road-tax-history",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/uk-mileage",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/road-safety",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/stats/popular-cars",
      lastModified: new Date("2026-03-07"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.freeplatecheck.co.uk/servicing",
      lastModified: new Date("2026-05-29"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/repair-costs",
      lastModified: new Date("2026-05-12"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://www.freeplatecheck.co.uk/repair-costs/aircon-regas",
      lastModified: new Date("2026-05-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/repair-costs/cambelt-replacement",
      lastModified: new Date("2026-05-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/repair-costs/dpf-cleaning",
      lastModified: new Date("2026-05-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/repair-costs/brake-pads-replacement",
      lastModified: new Date("2026-05-29"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/repair-costs/car-battery-replacement",
      lastModified: new Date("2026-05-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/repair-costs/clutch-replacement",
      lastModified: new Date("2026-05-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.freeplatecheck.co.uk/clean-air-zones",
      lastModified: new Date("2026-03-13"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...CAZ_ZONES.map((z) => ({
      url: `https://www.freeplatecheck.co.uk/clean-air-zones/${z.slug}`,
      lastModified: new Date("2026-03-13"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...carMakePages,
    ...carModelPages,
    ...blogPosts,
    ...tagPages,
  ];
}
