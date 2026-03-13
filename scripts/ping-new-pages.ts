/**
 * Ping Google and IndexNow about new pages.
 * Run after adding new pages: npx tsx scripts/ping-new-pages.ts
 *
 * - Submits sitemap to Google's ping endpoint
 * - Submits new page URLs via IndexNow (Bing, Yandex, Seznam, Naver)
 */

const HOST = "www.freeplatecheck.co.uk";
const INDEXNOW_KEY = "708b35d8306c4b2db2c61ad5a418dc62";
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;

// New pages to notify search engines about
const NEW_PAGES = [
  `https://${HOST}/compare`,
  `https://${HOST}/running-costs`,
  `https://${HOST}/clean-air-zones`,
];

async function pingGoogle() {
  console.log("Pinging Google sitemap endpoint...\n");

  const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      console.log(`  OK Google accepted sitemap ping — ${res.status}`);
    } else {
      const text = await res.text();
      console.log(`  FAIL Google rejected — ${res.status}: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.log(`  FAIL Google error — ${(err as Error).message}`);
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
