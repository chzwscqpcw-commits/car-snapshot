import type { Metadata } from "next";
import { getAllPosts, getAllTags, getPostTags, getTagLabel } from "@/lib/blog";

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

export default function BlogPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

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
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to Free Plate Check
          </a>
          <h1 className="text-3xl font-bold text-slate-100">
            Car Guides &amp; MOT Tips
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Practical advice for UK car owners, buyers and sellers.
          </p>
        </div>
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <a
                key={t.tag}
                href={`/blog/tag/${t.tag}`}
                className="text-xs px-3 py-1 rounded-full border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
              >
                {t.label} <span className="text-slate-600">({t.count})</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Post listing */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <p className="text-slate-400">No posts yet. Check back soon.</p>
        ) : (
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
                        {postTags.map((tag) => (
                          <span key={tag} className="text-slate-600">{getTagLabel(tag)}</span>
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
        )}
      </div>

      {/* Footer */}
    </div>
  );
}
