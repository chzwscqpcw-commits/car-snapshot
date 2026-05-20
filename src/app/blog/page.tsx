import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Sparkles } from "lucide-react";
import { getAllPosts, getAllTags, getPostTags, getTagLabel } from "@/lib/blog";
import BlogTagPill from "@/components/BlogTagPill";
import StatCallouts from "@/components/StatCallouts";

export const metadata: Metadata = {
  title: "Car Guides & MOT Tips | Free Plate Check",
  description:
    "Free car buying guides, MOT tips, ULEZ advice and vehicle ownership help from Free Plate Check.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/blog",
  },
  openGraph: {
    title: "Car Guides & MOT Tips | Free Plate Check",
    description:
      "Free car buying guides, MOT tips, ULEZ advice and vehicle ownership help from Free Plate Check.",
    url: "https://www.freeplatecheck.co.uk/blog",
    siteName: "Free Plate Check",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://www.freeplatecheck.co.uk/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free Plate Check — Car Guides & MOT Tips",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Guides & MOT Tips | Free Plate Check",
    description:
      "Free car buying guides, MOT tips, ULEZ advice and vehicle ownership help from Free Plate Check.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

function formatGbDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  // Featured = most recent published post. The rest stream below.
  const [featured, ...rest] = posts;

  // Stats for the callout strip.
  const avgReadingTime = posts.length
    ? Math.round(posts.reduce((sum, p) => sum + p.readingTime, 0) / posts.length)
    : 0;
  const latestDate = posts.length ? new Date(posts[0].date) : null;
  const latestAgeDays = latestDate
    ? Math.max(0, Math.floor((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const updatedLabel =
    latestAgeDays === null
      ? "—"
      : latestAgeDays === 0
        ? "Today"
        : latestAgeDays === 1
          ? "Yesterday"
          : latestAgeDays < 7
            ? `${latestAgeDays}d ago`
            : latestAgeDays < 30
              ? `${Math.floor(latestAgeDays / 7)}w ago`
              : `${Math.floor(latestAgeDays / 30)}mo ago`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.freeplatecheck.co.uk" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://www.freeplatecheck.co.uk/blog" },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Free Plate Check Guides",
    description:
      "Free car buying guides, MOT tips, ULEZ advice and vehicle ownership help from Free Plate Check.",
    url: "https://www.freeplatecheck.co.uk/blog",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.10),_transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4 pt-8 pb-6 sm:pt-10 sm:pb-8">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to Free Plate Check
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 mb-3">
            <BookOpen className="h-3 w-3 text-cyan-400" />
            Guides
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">
            Car Guides &amp; MOT Tips
          </h1>
          <p className="mt-2 text-slate-400 max-w-xl">
            Practical advice for UK car owners, buyers and sellers — short, jargon-free, written from the data.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* At-a-glance stats */}
        <StatCallouts
          stats={[
            { value: String(posts.length), label: "Free guides" },
            { value: `${avgReadingTime} min`, label: "Avg read time" },
            { value: updatedLabel, label: "Last updated", tone: latestAgeDays !== null && latestAgeDays < 14 ? "good" : "default" },
          ]}
        />

        {/* Tag filter row */}
        {tags.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Browse by topic</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Link
                  key={t.tag}
                  href={`/blog/tag/${t.tag}`}
                  className="group inline-flex items-center gap-1.5"
                >
                  <BlogTagPill tag={t.tag} label={t.label} />
                  <span className="text-xs text-slate-600 group-hover:text-slate-500 transition-colors">
                    {t.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block mb-10 relative overflow-hidden rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 transition-all hover:border-cyan-700/60 hover:shadow-[0_0_30px_-12px_rgba(34,211,238,0.3)]"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-700/60 bg-cyan-900/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
                  <Sparkles className="h-3 w-3" />
                  Latest
                </span>
                {getPostTags(featured.keywords)
                  .slice(0, 2)
                  .map((tag) => (
                    <BlogTagPill key={tag} tag={tag} label={getTagLabel(tag)} size="xs" />
                  ))}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 group-hover:text-cyan-100 transition-colors leading-tight">
                {featured.title}
              </h2>
              <p className="mt-2 text-slate-400 leading-relaxed">{featured.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <time dateTime={featured.date}>{formatGbDate(featured.date)}</time>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {featured.readingTime} min read
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300 group-hover:text-cyan-200 transition-colors">
                Read this guide
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        )}

        {/* Rest of the posts */}
        {rest.length > 0 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              More guides
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((post) => {
                const postTags = getPostTags(post.keywords);
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col rounded-lg border border-slate-800 bg-slate-900/40 p-5 transition-all hover:border-slate-600 hover:bg-slate-900/70"
                  >
                    {postTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {postTags.slice(0, 2).map((tag) => (
                          <BlogTagPill key={tag} tag={tag} label={getTagLabel(tag)} size="xs" />
                        ))}
                      </div>
                    )}
                    <h2 className="text-base font-semibold text-slate-100 group-hover:text-blue-300 transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-3 flex-1">
                      {post.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <time dateTime={post.date}>{formatGbDate(post.date)}</time>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readingTime} min
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {posts.length === 0 && (
          <p className="text-slate-400">No posts yet. Check back soon.</p>
        )}
      </div>
    </div>
  );
}
