import Script from "next/script";
import { ADSENSE_CLIENT, adsEnabled } from "@/config/ads";

/**
 * Loads the AdSense library — lazily (after the page is idle, to protect Core
 * Web Vitals) and only when a publisher ID is configured. Mounted in the blog
 * layout, so it's scoped to /blog/* routes and never touches the tool pages.
 */
export default function AdSenseScript() {
  if (!adsEnabled()) return null;
  return (
    <Script
      id="adsbygoogle-lib"
      strategy="lazyOnload"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
