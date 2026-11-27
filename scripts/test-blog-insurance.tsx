/**
 * The insurance card inside the blog's insurance articles.
 *
 *   npx tsx scripts/test-blog-insurance.tsx
 *
 * Checks:
 *   1. which posts: exactly the two insurance guides the partner is asked to
 *      approve (a third, the penalties guide, is held back), and no MOT, history or
 *      warranty post (they keep their own prompt: a post never gets two), none
 *      of the ANPR posts;
 *   2. where: each has a heading to hang it on, and the card
 *      lands just before the next section; one card per post, no more;
 *   3. the card is the approved one: same text as on the homepage and
 *      /running-costs, no vehicle name, nothing of ours added around it;
 *   4. the click: its own /go context, `u1` carries it, the article's slug is
 *      recorded and never reaches the partner;
 *   5. no blog post names or links another insurance comparison site.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import matter from "gray-matter";
import { hasInsuranceIntent, hasMotKeywords, hasVehicleHistoryIntent, hasWarrantyIntent, isGoContext } from "../src/config/partners";
import { BLOG_INSURANCE_CONTEXT, INSURANCE_CARD_AFTER, INSURANCE_CARD_HELD, insuranceCardIndex, showsInsuranceCard } from "../src/lib/blog-insurance-card";
import { getPostBySlug, slugify } from "../src/lib/blog";
import InsuranceCTA from "../src/components/InsuranceCTA";

// /go must redirect without recording anything (analytics-writes.ts).
process.env.ANALYTICS_WRITES = "0";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}

/** The posts the partner is asked to approve this round. */
const GUIDES = ["car-insurance-groups-explained", "why-car-insurance-so-expensive-2026"];
/** An insurance guide held back from this round: no card until it is cleared. */
const HELD = "driving-without-insurance-penalties";
const REGULATORY = "Confused.com are authorised and regulated by the Financial Conduct Authority.";
const CAR_LINK = "https://click.linksynergy.com/fs-bin/click?id=%2aZ3mDbeym%2aI&offerid=1593696.967&type=3&subid=0";

const dir = join(process.cwd(), "content", "blog");
const posts = readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const raw = readFileSync(join(dir, f), "utf8");
    const { data, content } = matter(raw);
    return { slug: f.replace(/\.md$/, ""), raw, keywords: (data.keywords ?? []) as string[], content };
  });
/** The `<h2 id>` markup the blog pipeline writes, from the markdown (a post not live yet has no rendered copy). */
const h2Html = (content: string) =>
  [...content.matchAll(/^## (.+)$/gm)].map((m) => `<h2 id="${slugify(m[1])}">${m[1]}</h2><p>x</p>`).join("");

async function main(): Promise<void> {
  console.log("\nWhich posts:");
  const withCard = posts.filter((p) => showsInsuranceCard(p.keywords, p.slug) && insuranceCardIndex(h2Html(p.content), p.slug) !== null);
  check("exactly the two approved insurance guides show the card", withCard.map((p) => p.slug).sort(), GUIDES);
  const prompted = posts.filter((p) => hasMotKeywords(p.keywords) || hasVehicleHistoryIntent(p.keywords) || hasWarrantyIntent(p.keywords));
  check("no post with an MOT, history or warranty prompt gets the card too", prompted.filter((p) => showsInsuranceCard(p.keywords, p.slug)).length, 0);
  for (const p of posts) {
    if (/^anpr-/.test(p.slug)) check(`${p.slug}: untouched (no card)`, showsInsuranceCard(p.keywords), false);
  }
  const held = posts.find((p) => p.slug === HELD)!;
  check("the penalties guide is held back: an insurance post, but no card", [hasInsuranceIntent(held.keywords), INSURANCE_CARD_HELD.includes(HELD), showsInsuranceCard(held.keywords, HELD)], [true, true, false]);
  check("nothing else is held", INSURANCE_CARD_HELD, [HELD]);
  // Posts that mention insurance but are about something else.
  for (const slug of ["driving-without-an-mot-penalties", "what-does-cat-n-s-mean", "sorn-rules-and-penalties", "first-car-checklist-new-drivers"]) {
    const p = posts.find((x) => x.slug === slug);
    check(`${slug}: no card`, p ? showsInsuranceCard(p.keywords) : "missing", false);
  }
  check("a post that only mentions insurance is not an insurance post", hasInsuranceIntent(["sorn", "insurance", "tax"]), false);
  check("a post that is about it is", hasInsuranceIntent(["car insurance", "cheaper insurance", "insure a van"]), true);
  check("an MOT post with insurance keywords still keeps the MOT box", showsInsuranceCard(["mot test", "car insurance", "insurance cost", "insure"]), false);
  check("a history post likewise", showsInsuranceCard(["hpi check", "car insurance", "insurance cost", "insure"]), false);

  console.log("\nWhere it sits:");
  check("every anchor belongs to a post that shows the card", Object.keys(INSURANCE_CARD_AFTER).sort(), GUIDES);
  for (const slug of GUIDES) {
    const p = posts.find((x) => x.slug === slug)!;
    const html = h2Html(p.content);
    const live = await getPostBySlug(slug); // null for a post dated in the future
    const real = live?.content ?? html;
    const anchor = INSURANCE_CARD_AFTER[slug];
    check(`${slug}: the heading it follows exists`, real.includes(`id="${anchor}"`), true);
    const at = insuranceCardIndex(real, slug);
    check(`${slug}: the card goes before the next section`, at !== null && /^<h2\b/.test(real.slice(at)), true);
    // Between the anchor heading and the card there is only that section: no other <h2>.
    const section = real.slice(real.indexOf(`id="${anchor}"`), at ?? 0);
    check(`${slug}: it follows exactly that section`, section.length > 0 && !/<h2\b/.test(section), true);
  }
  // The article the reader is told to get quotes in: the card follows the sentence about quotes.
  const groups = posts.find((p) => p.slug === "car-insurance-groups-explained")!;
  const sectionStart = groups.content.indexOf("## How to check a car's insurance group before you buy");
  const sectionEnd = groups.content.indexOf("## Tips for cutting the premium");
  const lastItem = groups.content.slice(sectionStart, sectionEnd).trim().split("\n").pop() ?? "";
  check("groups guide: the section ends on the sentence about getting quotes", /^5\. \*\*Get a real quote\.\*\*.*to see how sensitive the price is\.$/.test(lastItem), true);

  console.log("\nThe card is the approved one:");
  const markup = (context: string, post?: string) =>
    renderToStaticMarkup(<InsuranceCTA context={context as typeof BLOG_INSURANCE_CONTEXT} kind="car" post={post} />);
  const text = (m: string) => m.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
  const blog = markup(BLOG_INSURANCE_CONTEXT, GUIDES[0]);
  check("same text as the homepage's card", text(blog), text(markup("money-insurance")));
  check("same text as the /running-costs card", text(blog), text(markup("running-costs-insurance")));
  check(
    "it reads the approved generic card",
    text(blog),
    "Compare car insurance quotes Insurance is the one running cost we can't work out from the car: it depends on you as much as the car. " +
      "Compare quotes in one go to see what yours would cost. Compare car insurance with Confused.com ↗ " +
      `Free Plate Check may earn a small commission from this link. ${REGULATORY}`,
  );
  check("the logo plate is there", blog.includes("data-partner-logo"), true);
  check("same markup apart from the link", blog.replace(/href="[^"]*"/, ""), markup("money-insurance").replace(/href="[^"]*"/, ""));
  const pageSource = readFileSync(join(process.cwd(), "src", "app", "blog", "[slug]", "page.tsx"), "utf8");
  check("the blog page draws one InsuranceCTA", (pageSource.match(/<InsuranceCTA\b/g) ?? []).length, 1);
  check("  … of kind car, with no vehicle name", /<InsuranceCTA[^>]*kind="car"/.test(pageSource) && !/<InsuranceCTA[^>]*vehicleName/.test(pageSource), true);

  console.log("\nThe click:");
  process.env.ANALYTICS_WRITES = "0";
  check("its own context is one /go records", isGoContext(BLOG_INSURANCE_CONTEXT), true);
  const href = /href="([^"]+)"/.exec(blog)?.[1].replace(/&amp;/g, "&") ?? "";
  check("the link: /go/rvu-car, its context, the article", href, `/go/rvu-car?ctx=blog-insurance-inline&from=${GUIDES[0]}`);
  const { GET } = await import("../src/app/go/[partner]/route");
  const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
  const go = (query: string) =>
    GET(new Request(`http://localhost/go/rvu-car?${query}`, { headers: { cookie: "fpc_v=1", "user-agent": ua } }), {
      params: Promise.resolve({ partner: "rvu-car" }),
    });
  const clicked = await go(`ctx=blog-insurance-inline&from=${GUIDES[0]}`);
  check("/go redirects to the car link with u1 = the placement", clicked.headers.get("location"), `${CAR_LINK}&u1=blog-insurance-inline`);
  check("the article's slug does not reach the partner", (await go(`ctx=blog-insurance-inline&from=${GUIDES[0]}`)).headers.get("location")?.includes(GUIDES[0]), false);
  check("junk in `from` changes nothing", (await go("ctx=blog-insurance-inline&from=../../x%3Cscript")).headers.get("location"), `${CAR_LINK}&u1=blog-insurance-inline`);

  console.log("\nNo other insurance comparison site in any post:");
  const OTHER_SITES = /gocompare|go compare|moneysupermarket|money supermarket|compare ?the ?market|comparethemarket|uswitch|quotezone|money\.co\.uk|seopa|compare\.com|insurancefactory|beat that quote/i;
  const named = posts.filter((p) => OTHER_SITES.test(p.raw)).map((p) => `${p.slug}: ${OTHER_SITES.exec(p.raw)?.[0]}`);
  check("none named or linked", named, []);
  check("the reworded line is there, naming no site", groups.content.includes("Thatcham's website lists groups by model, and most insurance quote screens display the group too."), true);

  if (failures) {
    console.error(`\n${failures} blog insurance check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll blog insurance checks passed");
}
main();
