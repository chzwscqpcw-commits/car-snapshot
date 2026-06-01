/**
 * Ping Google and IndexNow about new pages.
 * Run AFTER the new pages are deployed and live: npx tsx scripts/ping-new-pages.ts
 *
 * - Submits each new URL to Google via the site's own /api/ping-google route,
 *   which uses the Google Indexing API when GOOGLE_INDEXING_KEY is configured
 *   in production (and silently falls back to a sitemap ping otherwise).
 * - Submits the same URLs via IndexNow (Bing, Yandex, Seznam, Naver).
 *
 * Note: Google retired the old google.com/ping?sitemap endpoint in 2023, so
 * we no longer call it directly — the /api/ping-google route is the only
 * mechanism that can actually nudge Google (via the Indexing API). The most
 * reliable Google path remains submitting the sitemap in Search Console.
 */

const HOST = "www.freeplatecheck.co.uk";
const INDEXNOW_KEY = "708b35d8306c4b2db2c61ad5a418dc62";

// New page paths to notify search engines about. Keep this list to the most
// recent additions — older pages are already in the sitemap and indexed.
const NEW_PATHS = [
  "/cheap-mot",
  "/blog/how-to-get-a-cheaper-mot",
  "/blog/are-cheap-mot-deals-worth-it",
  "/blog/cheapest-place-to-get-mot",
  "/blog/free-mot-how-to-get-one",
];

const NEW_PAGES = NEW_PATHS.map((p) => `https://${HOST}${p}`);

async function pingGoogle() {
  console.log(`Submitting ${NEW_PATHS.length} URLs to Google via /api/ping-google...\n`);

  for (const path of NEW_PATHS) {
    const endpoint = `https://${HOST}/api/ping-google?path=${encodeURIComponent(path)}`;
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`  OK ${path} — method: ${data.method ?? "unknown"}`);
      } else {
        console.log(`  FAIL ${path} — ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
      }
    } catch (err) {
      console.log(`  FAIL ${path} — ${(err as Error).message}`);
    }
  }
}

async function submitIndexNow() {
  console.log(`\nSubmitting ${NEW_PAGES.length} new URLs via IndexNow...\n`);

  const body = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: NEW_PAGES,
  };

  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (res.ok || res.status === 202) {
      console.log(`  OK IndexNow accepted — ${res.status}`);
    } else {
      const text = await res.text();
      console.log(`  FAIL IndexNow rejected — ${res.status}: ${text}`);
    }
  } catch (err) {
    console.log(`  FAIL IndexNow error — ${(err as Error).message}`);
  }
}

async function main() {
  console.log("=== Ping New Pages ===\n");
  console.log("Pages:");
  NEW_PAGES.forEach((u) => console.log(`  ${u}`));
  console.log();

  await pingGoogle();
  await submitIndexNow();

  console.log("\nDone.");
}

main();
