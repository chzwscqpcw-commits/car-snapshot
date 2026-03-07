/**
 * Notify search engines of updated content via IndexNow.
 * Run after deployment: npx tsx scripts/ping-sitemap.ts
 *
 * IndexNow notifies Bing, Yandex, Seznam, and Naver simultaneously.
 * Google does NOT support IndexNow — submit your sitemap via Google Search Console instead.
 */

const HOST = "www.freeplatecheck.co.uk";
const INDEXNOW_KEY = "708b35d8306c4b2db2c61ad5a418dc62";

// Key URLs to notify search engines about after each deploy.
// Add new blog post URLs here or automate via the sitemap.
const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/blog`,
  `https://${HOST}/mot-check`,
  `https://${HOST}/car-check`,
  `https://${HOST}/tax-check`,
  `https://${HOST}/mileage-check`,
  `https://${HOST}/ulez-check`,
  `https://${HOST}/recall-check`,
  `https://${HOST}/car-valuation`,
  `https://${HOST}/mot-reminder`,
  `https://${HOST}/cars`,
  `https://${HOST}/stats`,
  `https://${HOST}/stats/fuel-prices`,
  `https://${HOST}/stats/cost-of-motoring`,
  `https://${HOST}/stats/road-tax-history`,
  `https://${HOST}/stats/used-car-prices`,
  `https://${HOST}/stats/fuel-type-comparison`,
  `https://${HOST}/stats/mot-pass-rates`,
  `https://${HOST}/stats/most-reliable-cars`,
  `https://${HOST}/stats/uk-mileage`,
  `https://${HOST}/stats/popular-cars`,
  `https://${HOST}/stats/ev-adoption`,
  `https://${HOST}/stats/car-registrations`,
  `https://${HOST}/stats/car-theft`,
  `https://${HOST}/stats/road-safety`,
  `https://${HOST}/sitemap.xml`,
];

async function submitIndexNow() {
  console.log(`Submitting ${URLS.length} URLs via IndexNow...\n`);

  const body = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: URLS,
  };

  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (res.ok || res.status === 202) {
      console.log(`  ✓ IndexNow accepted — ${res.status}`);
    } else {
      const text = await res.text();
      console.log(`  ✗ IndexNow rejected — ${res.status}: ${text}`);
    }
  } catch (err) {
    console.log(`  ✗ IndexNow error — ${(err as Error).message}`);
  }

  console.log("\nNote: Google does not support IndexNow.");
  console.log("Submit your sitemap at https://search.google.com/search-console");
  console.log("\nDone.");
}

submitIndexNow();
