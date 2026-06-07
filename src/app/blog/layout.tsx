import AdSenseScript from "@/components/ads/AdSenseScript";

/**
 * Layout for all /blog routes. Its only job is to load the AdSense library here
 * (and nowhere else), so display ads are physically scoped to blog/guide pages
 * — never the tool or results pages. Renders null script until ads are
 * configured (see config/ads.ts).
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AdSenseScript />
    </>
  );
}
