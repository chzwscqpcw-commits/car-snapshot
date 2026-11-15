/**
 * Assertions for valuation_wbac_top_v1 (src/lib/wbac-top-test.ts): the test
 * that moves the We Buy Any Car offer into the valuation card.
 *
 * Three things have to hold for its result to mean anything: the size of the
 * test is worked out, not guessed; an event is counted for the right arm and
 * only when it belongs to this test and this surface; and the Friday email
 * cannot name a winner before the planned length, however the first days
 * look. Plus the plumbing: both arms' links are on the /go allowlist, under
 * different placements, so the partner's order report splits by arm.
 */
import { EXPERIMENTS } from "../src/lib/tracking";
import { GO_CONTEXTS, PARTNER_LINKS, goLink, isGoContext } from "../src/config/partners";
import {
  WBAC_TOP_ARMS,
  WBAC_TOP_PLACEMENTS,
  WBAC_TOP_PLAN,
  WBAC_TOP_TEST_ID,
  daysToFill,
  proportionZ,
  renderWbacTopTestHtml,
  summariseWbacTopTest,
  valuersNeededPerArm,
  wbacTopGuardWarnings,
  wbacTopVerdict,
} from "../src/lib/wbac-top-test";

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  — ${detail}`}`);
}

console.log("\nRegistration and links:");
check("the test is in the running-experiments registry", EXPERIMENTS.WBAC_TOP === WBAC_TOP_TEST_ID && WBAC_TOP_TEST_ID === "valuation_wbac_top_v1");
check("two arms, control first", WBAC_TOP_ARMS.join() === "control,top");
check("each arm's placement is on the /go allowlist", WBAC_TOP_ARMS.every((a) => isGoContext(WBAC_TOP_PLACEMENTS[a])));
check("the arms have different placements", WBAC_TOP_PLACEMENTS.control !== WBAC_TOP_PLACEMENTS.top);
check("control keeps the placement it has always had", WBAC_TOP_PLACEMENTS.control === "valuation-result-wbac");
check("the allowlist has no duplicate", new Set(GO_CONTEXTS).size === GO_CONTEXTS.length);
const topLink = PARTNER_LINKS.weBuyAnyCar.buildLink!("", WBAC_TOP_PLACEMENTS.top);
check("the strip's placement reaches the partner as u1", new URL(topLink).searchParams.get("u1") === "valuation-result-wbac-top", topLink);
check("the strip's /go link carries its context and no plate", goLink("webuyanycar", "valuation-result-wbac-top") === "/go/webuyanycar?ctx=valuation-result-wbac-top");
// /go keeps a context to 48 characters; a longer one would be cut and rejected.
check("the strip's context fits /go's limit", WBAC_TOP_PLACEMENTS.top.length <= 48 && /^[a-z0-9-]+$/.test(WBAC_TOP_PLACEMENTS.top));

console.log("\nHow many valuers it needs:");
const n80 = valuersNeededPerArm(0.05, 0.08, 0.8);
const n90 = valuersNeededPerArm(0.05, 0.08, 0.9);
check("5% → 8% at 80% power is about 1,060 an arm", n80 >= 1050 && n80 <= 1070, String(n80));
check("…and about 1,420 an arm at 90%", n90 >= 1410 && n90 <= 1430, String(n90));
check("a smaller lift needs more valuers", valuersNeededPerArm(0.05, 0.065) > n80 * 3);
check("at 135 valuers a day that is 16 days", daysToFill(n80, 135) === 16, String(daysToFill(n80, 135)));
// Three weeks at that rate is 1,417 an arm: the larger size to within a valuer or two.
check("…and three weeks reaches the larger size, near enough", Math.abs((21 * 135) / 2 - n90) / n90 < 0.01, String(n90));
check("the plan is three whole weeks and the 80% size", WBAC_TOP_PLAN.minDays === 21 && WBAC_TOP_PLAN.perArm === n80);

console.log("\nAdding the events up:");
const T0 = Date.parse("2026-11-20T09:00:00Z");
const at = (days: number) => new Date(T0 + days * 864e5).toISOString();
const tag = `exp_${WBAC_TOP_TEST_ID}`;
const imp = (variant: string, day = 0, id: string = WBAC_TOP_TEST_ID) => ({ metadata: { experiment_id: id, variant }, created_at: at(day) });
const many = <T,>(n: number, make: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => make(i));

const small = summariseWbacTopTest(
  {
    impressions: [imp("control"), imp("control", 1), imp("top", 2), imp("trust", 0, "seller_trust_copy_v1"), imp("b"), { metadata: null, created_at: at(0) }],
    clicks: [imp("top", 2), imp("control", 1, "seller_trust_copy_v1")],
    saved: [
      { metadata: { [tag]: "top", surface: "valuation-result" }, created_at: at(2) },
      { metadata: { [tag]: "top", surface: "home-valuation" }, created_at: at(2) }, // the homepage's card
      { metadata: { surface: "valuation-result" }, created_at: at(2) }, // not from an exposed visit
    ],
    pdf: [{ metadata: { [tag]: "control" }, created_at: at(1) }],
    chip: [
      { metadata: { [tag]: "control", surface: "valuation-result", intent: "selling" }, created_at: at(1) },
      { metadata: { [tag]: "control", surface: "home-valuation", intent: "keeping" }, created_at: at(1) },
    ],
  },
  T0 + 3.5 * 864e5,
);
const [c, t] = small.arms;
check("impressions are counted per arm", c.seen === 2 && t.seen === 1, `${c.seen}/${t.seen}`);
check("another test's rows and unknown arms are skipped", c.seen + t.seen === 3);
check("clicks are counted per arm, this test's only", c.clicked === 0 && t.clicked === 1);
check("a saved car counts from the valuation result only, and only when tagged", t.saved === 1 && c.saved === 0);
check("a PDF download counts wherever it happened", c.pdf === 1 && t.pdf === 0);
check("a chip answer counts from the valuation result only", c.chip === 1);
check("the test starts at its first counted valuer", small.startedAt === at(0) && small.days === 3, `${small.startedAt} ${small.days}`);
check("no z-score under 100 valuers an arm", small.z === null && !small.ready);

const empty = summariseWbacTopTest({ impressions: [], clicks: [], saved: [], pdf: [], chip: [] }, T0);
check("before anyone is counted it says so", empty.startedAt === null && /Not started/.test(wbacTopVerdict(empty)));

// A big early lead: 1 in 20 against 1 in 8, on day 6.
const lead = (days: number, perArm: number) =>
  summariseWbacTopTest(
    {
      impressions: [...many(perArm, (i) => imp("control", (i % 5) * 0.1)), ...many(perArm, (i) => imp("top", (i % 5) * 0.1))],
      clicks: [...many(Math.round(perArm * 0.05), () => imp("control")), ...many(Math.round(perArm * 0.125), () => imp("top"))],
      saved: [
        ...many(Math.round(perArm * 0.1), () => ({ metadata: { [tag]: "control", surface: "valuation-result" }, created_at: at(0) })),
        ...many(Math.round(perArm * 0.03), () => ({ metadata: { [tag]: "top", surface: "valuation-result" }, created_at: at(0) })),
      ],
      pdf: [],
      chip: [],
    },
    T0 + days * 864e5 + 3600e3,
  );
const early = lead(5, 400);
check("an early lead has a z-score", early.z !== null && early.z > 1.96, String(early.z));
check("…but is not ready and is not called", !early.ready && /Too early to read/.test(wbacTopVerdict(early)) && !/<strong>/.test(wbacTopVerdict(early)), wbacTopVerdict(early));
check("…and says how far along it is", /Day 6 of 21/.test(wbacTopVerdict(early)) && /400 of the 1,0\d\d/.test(wbacTopVerdict(early)), wbacTopVerdict(early));
const longButThin = lead(30, 400);
check("enough days but too few valuers is still not ready", !longButThin.ready);
const bigButShort = lead(10, 1500);
check("enough valuers but too few days is still not ready", !bigButShort.ready);
const done = lead(21, 1500);
check("at the planned length and size it is read", done.ready && /strip inside the valuation card gets more valuers to click/.test(wbacTopVerdict(done)), wbacTopVerdict(done));
check("a guard that fell in the strip arm is named", wbacTopGuardWarnings(done).join() === "cars saved", wbacTopGuardWarnings(done).join());

const flat = summariseWbacTopTest(
  {
    impressions: [...many(1200, () => imp("control")), ...many(1200, () => imp("top"))],
    clicks: [...many(60, () => imp("control")), ...many(63, () => imp("top"))],
    saved: [],
    pdf: [],
    chip: [],
  },
  T0 + 22 * 864e5,
);
check("no real gap at the planned length is reported as no proven lift", flat.ready && /no proven lift/.test(wbacTopVerdict(flat)), wbacTopVerdict(flat));
check("…with no guard warning", wbacTopGuardWarnings(flat).length === 0);
check("z is top against control", proportionZ({ n: 1000, x: 50 }, { n: 1000, x: 80 })! > 0 && proportionZ({ n: 1000, x: 80 }, { n: 1000, x: 50 })! < 0);

console.log("\nThe email block:");
const html = renderWbacTopTestHtml(done);
check("names both arms and both placements", /Card under the chip/.test(html) && /Strip inside the valuation card/.test(html) && html.includes("valuation-result-wbac-top") && html.includes(">valuation-result-wbac<"));
check("shows the guard warning", /Guard:/.test(html) && /cars saved/.test(html));
check("points at Partner orders for what the clicks became", /Partner orders/.test(html));
check("carries no money", !/[£$€]/.test(html) && !/[£$€]/.test(renderWbacTopTestHtml(empty)));
check("renders before the test has started", /not started/.test(renderWbacTopTestHtml(empty)));

console.log(failures ? `\n${failures} failure(s)` : "\nAll We Buy Any Car position test checks passed");
process.exit(failures ? 1 : 0);
