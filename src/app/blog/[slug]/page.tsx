import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts, getPostTags, getTagLabel } from "@/lib/blog";
import { PARTNER_LINKS, getPartnerRel, hasMotKeywords, getTopicCta } from "@/config/partners";
import ShareButtons from "@/components/ShareButtons";

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
      publishedTime: post.date,
      modifiedTime: post.lastModified || post.date,
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

  const tags = getPostTags(post.keywords);
  const relatedPosts = getRelatedPosts(slug, post.keywords);

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
        name: post.title,
        item: `https://www.freeplatecheck.co.uk/blog/${slug}`,
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.lastModified || post.date,
    wordCount: post.wordCount,
    image: "https://www.freeplatecheck.co.uk/og-image.png",
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

  const howToJsonLd = post.howToSteps
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: post.title,
        description: post.description,
        step: post.howToSteps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      }
    : null;

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
      {howToJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      )}

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
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ShareButtons
              url={`https://www.freeplatecheck.co.uk/blog/${slug}`}
              title={post.title}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 ml-2">
                {tags.map((tag) => (
                  <a
                    key={tag}
                    href={`/blog/tag/${tag}`}
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    {getTagLabel(tag)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {post.toc.length >= 3 && (
          <nav className="mb-10 p-5 bg-slate-900/60 border border-slate-800 rounded-lg" aria-label="Table of contents">
            <p className="text-sm font-semibold text-slate-300 mb-3">In this guide</p>
            <ul className="space-y-1.5">
              {post.toc.map((entry) => (
                <li key={entry.id} className={entry.level === 3 ? "ml-4" : ""}>
                  <a
                    href={`#${entry.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {entry.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <article
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share buttons (bottom) */}
        <div className="max-w-[700px] mx-auto mt-10 pt-6 border-t border-slate-800">
          <ShareButtons
            url={`https://www.freeplatecheck.co.uk/blog/${slug}`}
            title={post.title}
          />
        </div>

        {/* MOT Booking CTA — only for MOT-related posts */}
        {hasMotKeywords(post.keywords) && (
          <div className="max-w-[700px] mx-auto mt-12 border-l-2 border-blue-500/50 bg-blue-950/30 rounded-r-lg px-4 py-3">
            <p className="text-sm text-slate-300">
              Need to book an MOT?{" "}
              <a
                href={PARTNER_LINKS.bookMyGarage.url}
                target="_blank"
                rel={getPartnerRel(PARTNER_LINKS.bookMyGarage)}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                Compare local garages on BookMyGarage
              </a>
              .
            </p>
          </div>
        )}

        {/* Topic-aware CTA */}
        {(() => {
          const topicCta = getTopicCta(post.keywords);
          if (topicCta) {
            return (
              <div className="max-w-[700px] mx-auto mt-16 p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-lg text-center">
                <p className="text-lg font-semibold text-slate-100 mb-2">
                  {topicCta.label}
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  {topicCta.description}
                </p>
                <a
                  href={topicCta.path}
                  className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Check a vehicle now
                </a>
              </div>
            );
          }
          return (
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
          );
        })()}
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 mt-16">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Related guides</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((rp) => (
              <a
                key={rp.slug}
                href={`/blog/${rp.slug}`}
                className="group block p-4 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {rp.title}
                </p>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {rp.description}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  {rp.readingTime} min read
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

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
