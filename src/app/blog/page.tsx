import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Car Guides & MOT Tips | Free Plate Check",
  description:
    "Practical guides about MOT checks, car tax, vehicle history, and buying used cars in the UK.",
  alternates: {
    canonical: "https://www.freeplatecheck.co.uk/blog",
  },
  openGraph: {
    title: "Car Guides & MOT Tips | Free Plate Check",
    description:
      "Practical guides about MOT checks, car tax, vehicle history, and buying used cars in the UK.",
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
      "Practical guides about MOT checks, car tax, vehicle history, and buying used cars in the UK.",
    images: ["https://www.freeplatecheck.co.uk/og-image.png"],
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Free Plate Check Guides",
    description:
      "Practical guides about MOT checks, car tax, vehicle history, and buying used cars in the UK.",
    url: "https://www.freeplatecheck.co.uk/blog",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 sticky top-0 z-40">
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

      {/* Post listing */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <p className="text-slate-400">No posts yet. Check back soon.</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
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
                  </div>
                  <span className="inline-block mt-4 text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
                    Read more &rarr;
                  </span>
                </a>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16 bg-slate-900/50">
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
