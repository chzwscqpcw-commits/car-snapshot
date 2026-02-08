import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Free Plate Check`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `https://www.freeplatecheck.co.uk/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `https://www.freeplatecheck.co.uk/blog/${slug}`,
      siteName: "Free Plate Check",
      images: [
        {
          url: "https://www.freeplatecheck.co.uk/og-image.png",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["https://www.freeplatecheck.co.uk/og-image.png"],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "Free Plate Check",
    },
    publisher: {
      "@type": "Organization",
      name: "Free Plate Check",
      url: "https://www.freeplatecheck.co.uk",
    },
    mainEntityOfPage: `https://www.freeplatecheck.co.uk/blog/${slug}`,
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
            href="/blog"
            className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
          >
            &larr; Back to all guides
          </a>
          <h1 className="text-3xl font-bold text-slate-100">{post.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
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
        </div>
      </div>

      {/* Post content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <article
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="max-w-[700px] mx-auto mt-16 p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center">
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
