import type { Metadata } from "next";
import { getAllTags, getPostsByTag, getTagLabel, getPostTags } from "@/lib/blog";

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
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/blog"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; All guides
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            {label} Guides
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {posts.length} {posts.length === 1 ? "guide" : "guides"} about {label.toLowerCase()} for UK car owners.
          </p>
        </div>
      </div>

      {/* Tag pills */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <a
              key={t.tag}
              href={`/blog/tag/${t.tag}`}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                t.tag === tag
                  ? "border-blue-500 text-blue-400 bg-blue-950/30"
                  : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
              }`}
            >
              {t.label} <span className={t.tag === tag ? "text-blue-500" : "text-slate-600"}>({t.count})</span>
            </a>
          ))}
        </div>
      </div>

      {/* Post listing */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {posts.map((post) => {
            const postTags = getPostTags(post.keywords);
            return (
              <article
                key={post.slug}
                className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <a href={`/blog/${post.slug}`} className="block group">
                  <h2 className="text-xl font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-400 text-sm mt-2">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                    <span>&middot;</span>
                    <span>{post.readingTime} min read</span>
                    {postTags.length > 0 && (
                      <>
                        <span>&middot;</span>
                        {postTags.map((t) => (
                          <span key={t} className="text-slate-600">{getTagLabel(t)}</span>
                        ))}
                      </>
                    )}
                  </div>
                  <span className="inline-block mt-4 text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
                    Read more &rarr;
                  </span>
                </a>
              </article>
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
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Look up a vehicle
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>Free Plate Check &copy; 2026. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="/" className="hover:text-slate-300">
              Home
            </a>
            <span>&bull;</span>
            <a href="/blog" className="hover:text-slate-300">
              Guides
            </a>
            <span>&bull;</span>
            <a href="/privacy" className="hover:text-slate-300">
              Privacy Policy
            </a>
            <span>&bull;</span>
            <a href="/terms" className="hover:text-slate-300">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
