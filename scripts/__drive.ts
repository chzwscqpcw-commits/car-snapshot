import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const URL = "https://car-snapshot-lbpsueq82-stephen-gaisfords-projects.vercel.app/stats/how-many-left";

async function main() {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await b.newPage();
  await page.setViewport({ width: 820, height: 1200, deviceScaleFactor: 2 });

  const events: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/event")) {
      try { events.push(JSON.parse(r.postData() || "{}").event_type ?? "?"); } catch { events.push("(unparsed)"); }
    }
  });

  await page.goto(URL, { waitUntil: "networkidle2", timeout: 90_000 });
  await new Promise(r => setTimeout(r, 2500));

  // model mode is the default; type a classic
  await page.type('input[placeholder]', "Rover 800", { delay: 60 });
  await new Promise(r => setTimeout(r, 1800));
  const picked = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find(x => /rover/i.test(x.textContent || ""));
    if (b) { (b as HTMLButtonElement).click(); return b.textContent?.trim(); }
    return null;
  });
  console.log("picked suggestion:", picked);
  await new Promise(r => setTimeout(r, 3000));

  const found = await page.evaluate(() => {
    const h = Array.from(document.querySelectorAll("h3")).find(e => /Still running one of the survivors/i.test(e.textContent || ""));
    if (!h) return null;
    const card = h.closest("div.rounded-2xl") as HTMLElement | null;
    card?.scrollIntoView({ block: "center" });
    card?.setAttribute("data-shot", "1");
    const a = card?.querySelector("a[href]") as HTMLAnchorElement | null;
    return { href: a?.href ?? null };
  });
  console.log("warranty CTA in result:", found ? "YES" : "NO");
  if (found) console.log("href:", found.href);
  console.log("events fired:", events.join(", ") || "(none)");
  if (found) {
    await new Promise(r => setTimeout(r, 500));
    const el = await page.$('[data-shot="1"]');
    await el!.screenshot({ path: process.env.OUT! });
  }
  await b.close();
}
main();
