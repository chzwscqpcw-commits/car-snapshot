import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getAllTags, getAllPosts, getPostsByTag, getTagLabel, getPostTags } from "@/lib/blog";
import BlogTagPill from "@/components/BlogTagPill";
import Button from "@/components/Button";

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t.tag }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const label = getTagLabel(tag);

  return {
    title: `${label} Guides | Free Plate Check`,
    description: `Free guides about ${label.toLowerCase()} for UK car owners — practical advice from Free Plate Check.`,
    alternates: {
      canonical: `https://www.freeplatecheck.co.uk/blog/tag/${tag}`,
    },
    openGraph: {
      title: `${label} Guides | Free Plate Check`,
      description: `Free guides about ${label.toLowerCase()} for UK car owners.`,
      url: `https://www.freeplatecheck.co.uk/blog/tag/${tag}`,
      siteName: "Free Plate Check",
      locale: "en_GB",
      type: "website",
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const label = getTagLabel(tag);
  const posts = getPostsByTag(tag);
  const allTags = getAllTags();
  const totalGuides = getAllPosts().length;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.freeplatecheck.co.uk",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: "https://www.freeplatecheck.co.uk/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: label,
        item: `https://www.freeplatecheck.co.uk/blog/tag/${tag}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-100">
            {label} Guides
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {posts.length} {posts.length === 1 ? "guide" : "guides"} about {label.toLowerCase()} for UK car owners.
          </p>
        </div>
      </div>

      {/* Topic browse */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Browse by topic
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
          >
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/60 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200">
              <ArrowLeft className="h-3 w-3" />
              All guides
            </span>
            <span className="text-xs text-slate-600 group-hover:text-slate-500 transition-colors">
              {totalGuides}
            </span>
          </Link>
          {allTags.map((t) => (
            <Link
              key={t.tag}
              href={`/blog/tag/${t.tag}`}
              className={`group inline-flex items-center gap-1.5 transition-opacity ${t.tag === tag ? "" : "opacity-70 hover:opacity-100"}`}
            >
              <BlogTagPill tag={t.tag} label={t.label} />
              <span className={`text-xs ${t.tag === tag ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-500"} transition-colors`}>
                {t.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Post listing */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          {label} guides
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => {
            const postTags = getPostTags(post.keywords);
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-lg border border-slate-800 bg-slate-900/40 p-5 transition-all hover:border-slate-600 hover:bg-slate-900/70"
              >
                {postTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {postTags.slice(0, 2).map((t) => (
                      <BlogTagPill key={t} tag={t} label={getTagLabel(t)} size="xs" />
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
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </time>
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
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Check any UK vehicle free
          </p>
          <p className="text-sm text-slate-400 mb-4">
            Enter a registration to see MOT history, tax status, mileage and
            more — no signup required.
          </p>
          <Button href="/">
            Look up a vehicle
          </Button>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}
