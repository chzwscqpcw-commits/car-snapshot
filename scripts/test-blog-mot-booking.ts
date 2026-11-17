/**
 * The MOT prompts in blog articles lead into our own booking tool, and
 * articles stay free of straight-out links to the garage-booking partner.
 *
 *   npx tsx scripts/test-blog-mot-booking.ts
 *
 * Checks, with an invented registration:
 *   - the box's address: MOT chosen, its own source, the plate in the
 *     fragment only, and `noreg=1` when there is no plate;
 *   - the two sources leave the wizard's hand-off clickref as it was;
 *   - no post's text links to the partner, except the sentences left on
 *     purpose (listed below with the reason);
 *   - a link to /booking in an article's text says where it came from.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BLOG_MOT_SOURCE, blogMotBookingHref, cleanReg, looksLikeReg } from "../src/lib/blog-mot-booking";
import { bmgClickref } from "../src/lib/booking";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok || detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
}

const PLATE = "AB12 CDE";

console.log("Blog MOT box: where it sends the reader");
for (const placement of ["inline", "foot"] as const) {
  const source = BLOG_MOT_SOURCE[placement];
  const href = blogMotBookingHref(placement, PLATE);
  const [beforeHash, hash] = href.split("#");
  const url = new URL(beforeHash, "https://example.test");
  check(`${placement}: opens /booking with MOT chosen`, url.pathname === "/booking" && url.searchParams.get("type") === "mot", href);
  check(`${placement}: carries its own source`, url.searchParams.get("source") === source, href);
  check(`${placement}: plate is in the fragment`, hash === "vrm=AB12CDE", href);
  check(`${placement}: plate is nowhere in the query string`, !/AB12/i.test(beforeHash) && !url.searchParams.has("vrm"), beforeHash);
  check(`${placement}: a plate means no noreg flag`, !url.searchParams.has("noreg"), href);

  const bare = blogMotBookingHref(placement, "  ");
  const bareUrl = new URL(bare, "https://example.test");
  check(`${placement}: no plate -> noreg=1, same service and source, no fragment`,
    !bare.includes("#") && bareUrl.searchParams.get("noreg") === "1" && bareUrl.searchParams.get("type") === "mot" && bareUrl.searchParams.get("source") === source,
    bare);

  // The wizard's hand-off is out of this change's reach: a blog entry earns
  // the same clickref as any other organic booking.
  check(`${placement}: hand-off clickref unchanged`,
    bmgClickref("mot", "results", source) === "booking-flow-mot" && bmgClickref("mot", "search", source) === "booking-flow-mot-search");
}
check("the two placements have different sources", BLOG_MOT_SOURCE.inline !== BLOG_MOT_SOURCE.foot);
check("cleanReg strips spaces and case", cleanReg(" ab12 cde ") === "AB12CDE");
check("looksLikeReg: 2 to 8 characters", looksLikeReg("AB12CDE") && looksLikeReg("A1") && !looksLikeReg("A") && !looksLikeReg("AB12CDEFG"));

console.log("\nBlog articles: no straight-out partner links");
/**
 * Sentences left pointing at the partner on purpose, as slug -> how many.
 *
 * pothole-damage-claim-council-uk: the sentence is about getting written
 * quotes for tyre, wheel and suspension damage to put on a council claim.
 * Nothing on this site quotes for those repairs, so there is no page of ours
 * that keeps the sentence's promise.
 */
const LEFT_ON_PURPOSE: Record<string, number> = {
  "pothole-damage-claim-council-uk": 1,
};
const PARTNER_LINK = /\]\((?:https?:\/\/[^)]*bookmygarage\.com[^)]*|https?:\/\/[^)]*awin1\.com[^)]*awinmid=68338[^)]*)\)/gi;
const BOOKING_LINK = /\]\((\/booking[^)]*)\)/g;

const dir = join(process.cwd(), "content", "blog");
const unexpected: string[] = [];
const unsourced: string[] = [];
const seen: Record<string, number> = {};
for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "");
  const text = readFileSync(join(dir, file), "utf8");
  const partner = text.match(PARTNER_LINK)?.length ?? 0;
  if (partner) seen[slug] = partner;
  if (partner !== (LEFT_ON_PURPOSE[slug] ?? 0)) unexpected.push(`${slug} (${partner})`);
  for (const m of text.matchAll(BOOKING_LINK)) {
    const href = m[1];
    if (/[?&]vrm=/i.test(href)) unsourced.push(`${slug}: plate in a query string`);
    // Older links are bare /booking; the ones this change wrote name a source.
    if (href.includes("?") && !/[?&]source=[a-z0-9-]+/.test(href)) unsourced.push(`${slug}: ${href}`);
  }
}
check("only the listed sentences link to the partner", unexpected.length === 0, unexpected);
check("every listed sentence is still there", Object.entries(LEFT_ON_PURPOSE).every(([slug, n]) => seen[slug] === n), seen);
check("in-text /booking links with a query name their source, and none carries a plate", unsourced.length === 0, unsourced);

if (failed) {
  console.error(`\n${failed} blog MOT booking check(s) failed`);
  process.exit(1);
}
console.log("\nAll blog MOT booking checks passed");
