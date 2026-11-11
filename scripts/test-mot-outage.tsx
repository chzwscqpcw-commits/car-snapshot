/**
 * The MOT service failing must not take the valuation down with it.
 *
 * On 8–9 Nov 2026 every DVSA MOT history call failed for 21.5 hours. Results
 * pages still loaded from DVLA data, but a car's model comes from its MOT
 * record, so the valuation had no price to start from and vanished from both
 * valuation surfaces, with the selling offers still underneath. The failure
 * was logged as a bare "network_error" with nothing to say why.
 *
 * Three things are pinned here, with no network and no browser:
 *   1. the MOT fetch reports a failure as a failure, with the error's cause
 *      and never the plate;
 *   2. the valuation still renders from a lookup that has no MOT half, says
 *      so, and says the mileage is an estimate;
 *   3. the confidence is stated one step lower while the mileage is a guess.
 */
import React from "react";
import { renderToString } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import ValuationResult from "../src/components/tools/ValuationResult";
import { PREVIEW_VEHICLE } from "../src/lib/preview-data";
import {
  describeFetchError,
  fetchMotHistory,
  motFailureMetadata,
  resetMotTokenCache,
  scrubPlate,
  type MotFetchResult,
} from "../src/lib/mot-history";
import {
  ESTIMATED_MILEAGE_EXTRA_RANGE_PCT,
  getConditionAdjustment,
  withEstimatedMileage,
  type ValuationResult as Valuation,
} from "../src/lib/valuation";
import { cleanTypedModel, modelOptionsForMake } from "../src/lib/model-options";
import { simulatedMotOutage } from "../src/lib/deploy-env";

// The fetch module logs each failure it is handed; keep this output to the checks.
for (const level of ["log", "warn", "error"] as const) {
  const original = console[level].bind(console);
  console[level] = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("[MOT]")) return;
    original(...args);
  };
}

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  — ${detail}`}`);
}

// A plate in the fixture format the e2e suite uses. Not a real car.
const PLATE = "AB12CDE";
const ENV = { MOT_API_KEY: "k", MOT_TENANT_ID: "t", MOT_CLIENT_ID: "c", MOT_CLIENT_SECRET: "s" };

type Handler = (url: string) => Promise<Response> | Response;
/** A fetch that answers the token request and hands the history call to `history`. */
function stubFetch(history: Handler, token: Handler = () => Response.json({ access_token: "tok", expires_in: 3600 })) {
  const calls: string[] = [];
  const impl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    return url.includes("login.microsoftonline.com") ? token(url) : history(url);
  }) as typeof fetch;
  return { impl, calls, historyCalls: () => calls.filter((u) => u.includes("history.mot.api.gov.uk")).length };
}

async function run(history: Handler, token?: Handler): Promise<{ result: MotFetchResult; historyCalls: number }> {
  resetMotTokenCache();
  const f = stubFetch(history, token);
  const result = await fetchMotHistory(PLATE, { fetchImpl: f.impl, env: ENV, sleep: async () => {}, timeoutMs: 50 });
  return { result, historyCalls: f.historyCalls() };
}

/** What Node's fetch throws when the connection can't be made. */
function fetchFailed(code: string, message: string): TypeError {
  return new TypeError("fetch failed", { cause: Object.assign(new Error(message), { code }) });
}

async function main() {
  console.log("\nThe MOT fetch failing (what 8–9 Nov looked like):");
  {
    const { result, historyCalls } = await run(() => {
      throw fetchFailed("CERT_HAS_EXPIRED", "certificate has expired");
    });
    check("comes back as a failure, not as 'no MOT history'", result.state === "failed", result.state);
    if (result.state === "failed") {
      const meta = motFailureMetadata(result.failure);
      check("reason is network_error", meta.reason === "network_error", String(meta.reason));
      check("the cause's code is recorded", meta.cause_code === "CERT_HAS_EXPIRED", JSON.stringify(meta));
      check("the error's name is recorded", meta.err_name === "TypeError", JSON.stringify(meta));
      check("elapsed time and attempts are recorded", typeof meta.ms === "number" && meta.attempts === 2, JSON.stringify(meta));
      check("stage is mot", meta.stage === "mot");
    }
    check("a dropped connection is retried once", historyCalls === 2, `${historyCalls} calls`);
  }

  console.log("\nNever the plate:");
  {
    const { result } = await run(() => {
      throw fetchFailed("ECONNRESET", `socket hang up GET https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${PLATE} (AB12 CDE)`);
    });
    const stored = result.state === "failed" ? JSON.stringify(motFailureMetadata(result.failure)) : "";
    check("a cause message that quotes the URL is stored without the plate", stored !== "" && !/AB12\s?CDE/i.test(stored), stored);
    check("the rest of the message survives", /socket hang up/.test(stored), stored);
    check("scrubPlate handles a spaced plate", scrubPlate("no record for ab12 cde today", PLATE) === "no record for [reg] today");
    check("scrubPlate cuts a long message short", scrubPlate("x".repeat(400)).length <= 141);
    const d = describeFetchError(new Error(`bad thing ${PLATE}`), PLATE);
    check("an error with no cause keeps its (scrubbed) message", d.cause_msg === "bad thing [reg]", JSON.stringify(d));
  }

  console.log("\nEach kind of failure has its own name:");
  {
    const timeout = await run(
      (_url) => new Promise<Response>((_resolve, reject) => setTimeout(() => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), 80)),
    );
    check("a hung request is a timeout, and is not retried", timeout.result.state === "failed" && timeout.result.failure.reason === "timeout" && timeout.historyCalls === 1);

    const html = await run(() => new Response("<html>Service unavailable</html>", { status: 200, headers: { "content-type": "text/html" } }));
    check(
      "a 200 that isn't JSON is bad_response (it used to be counted as a network error)",
      html.result.state === "failed" && html.result.failure.reason === "bad_response" && html.result.failure.detail.content_type === "text/html",
      JSON.stringify(html.result),
    );

    const gateway = await run(() => new Response("", { status: 503 }));
    check("a 503 is api_error with its status, after one retry", gateway.result.state === "failed" && gateway.result.failure.reason === "api_error" && gateway.result.failure.status === 503 && gateway.historyCalls === 2);

    const auth = await run(() => new Response("", { status: 403 }));
    check("a 403 is auth_failed, not retried", auth.result.state === "failed" && auth.result.failure.reason === "auth_failed" && auth.historyCalls === 1);

    const token = await run(
      () => Response.json([]),
      () => new Response("", { status: 500 }),
    );
    check("a failed token request is token_failed (it used to record nothing)", token.result.state === "failed" && token.result.failure.reason === "token_failed" && token.historyCalls === 0, JSON.stringify(token.result));

    const tokenThrow = await run(
      () => Response.json([]),
      () => {
        throw fetchFailed("ENOTFOUND", "getaddrinfo ENOTFOUND login.microsoftonline.com");
      },
    );
    check("a token request that throws keeps its cause", tokenThrow.result.state === "failed" && tokenThrow.result.failure.detail.cause_code === "ENOTFOUND");
  }

  console.log("\nAn answer is not a failure:");
  {
    const notFound = await run(() => new Response("", { status: 404 }));
    check("404 is 'nothing held'", notFound.result.state === "none");
    const ok = await run(() =>
      Response.json([{ registration: PLATE, make: "VAUXHALL", model: "ASTRA", motTests: [{ completedDate: "2026-05-27", testResult: "PASSED", odometerValue: "43244", odometerUnit: "MI" }] }]),
    );
    check("a record comes back with its model", ok.result.state === "ok" && ok.result.data.model === "ASTRA");
    check("and its odometer reading as a number", ok.result.state === "ok" && ok.result.data.motTests?.[0]?.odometer?.value === 43244);
    resetMotTokenCache();
    const unconfigured = await fetchMotHistory(PLATE, { fetchImpl: stubFetch(() => Response.json([])).impl, env: {} });
    check("no credentials (local development) is not an outage", unconfigured.state === "unconfigured");
  }

  console.log("\nThe valuation still renders without the MOT half:");
  const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} } as never;
  const render = (vehicle: typeof PREVIEW_VEHICLE) =>
    renderToString(
      <AppRouterContext.Provider value={router}>
        <ValuationResult vrm={vehicle.registrationNumber} previewVehicle={vehicle} />
      </AppRouterContext.Provider>,
    ).replace(/<!-- -->/g, "");
  const heroValue = (html: string) => Number(/Estimated market value[\s\S]*?£([\d,]+)/.exec(html)?.[1]?.replace(/,/g, "") ?? NaN);
  const range = (html: string) => {
    const m = /Typical range:[\s\S]*?£([\d,]+)[\s\S]*?£([\d,]+)/.exec(html);
    return m ? [Number(m[1].replace(/,/g, "")), Number(m[2].replace(/,/g, ""))] : null;
  };

  // What /api/lookup returns when DVLA answered and the MOT call failed: no
  // tests, no MOT status, and motUnavailable. The model is there because we
  // had looked this car up before (the lookup reuses its saved copy).
  const { motTests: _tests, motStatus: _status, motExpiryDate: _expiry, ...dvlaOnly } = PREVIEW_VEHICLE;
  const known = render({ ...dvlaOnly, motUnavailable: true });
  check("says MOT history is temporarily unavailable", /MOT history is temporarily unavailable/.test(known));
  check("shows a valuation figure", heroValue(known) > 500, String(heroValue(known)));
  check("shows a range", range(known) !== null);
  check("says the mileage is estimated from the car's age", /data-mileage-estimated/.test(known) && /estimated from the car(&#x27;|')s age/.test(known));
  check("invites the visitor to set their own mileage", /Set your\s+actual mileage/.test(known));
  check("does not claim an MOT reading", !/Pre-filled from the last MOT/.test(known));
  check("explains before the figure, not after", known.indexOf("MOT history is temporarily unavailable") < known.indexOf("Estimated market value"));

  // The same car on a normal day, for comparison.
  const normal = render(PREVIEW_VEHICLE);
  check("no outage notice on a normal lookup", !/temporarily unavailable/.test(normal) && /Pre-filled from the last MOT/.test(normal));
  const widthOf = (html: string) => {
    const r = range(html);
    const v = heroValue(html);
    return r && v ? (r[1] - r[0]) / v : NaN;
  };
  check("the range is wider than on a normal day", widthOf(known) > widthOf(normal), `${widthOf(known).toFixed(2)} vs ${widthOf(normal).toFixed(2)}`);

  console.log("\nA car we have never looked up (no model without MOT data):");
  const { model: _model, ...noModel } = dvlaOnly;
  const asking = render({ ...noModel, motUnavailable: true });
  check("explains and asks which model it is", /MOT history is temporarily unavailable/.test(asking) && /Choose the model/.test(asking));
  check("offers this make's models", /<option value="FIESTA"/.test(asking) && /Not listed/.test(asking));
  check("shows no figure it can't stand behind", !/Estimated market value/.test(asking));
  check("shows no selling offer under an empty valuation", !/we buy any car/i.test(asking) && !/carvertical/i.test(asking));
  const bike = render({ ...noModel, motUnavailable: true, wheelplan: "2 WHEEL" });
  check("a motorbike is still told we don't value bikes", /We don(&#x27;|')t value motorbikes/.test(bike) && !/Choose the model/.test(bike));

  console.log("\nConfidence is stated one step lower while the mileage is a guess:");
  const base: Valuation = {
    rangeLow: 9000,
    rangeHigh: 11000,
    estimatedValue: 10000,
    confidence: "high",
    sources: ["depreciation model"],
    mileageAdjustmentPercent: 0,
    conditionAdjustmentPercent: 0,
    motAutoAdjustmentPercent: 0,
    colourAdjustmentPercent: 0,
    ebayTotalListings: null,
    ebayMinPrice: null,
    ebayMaxPrice: null,
    ebayDominantTransmission: null,
    ebayDominantBodyType: null,
    ebayYearWidened: false,
    ebayQ1Price: null,
    ebayQ3Price: null,
    marketSupply: null,
    disclaimer: "",
  };
  const lowered = withEstimatedMileage(base);
  check("high becomes medium", lowered.confidence === "medium");
  check("medium becomes low", withEstimatedMileage({ ...base, confidence: "medium" }).confidence === "low");
  check("low stays low", withEstimatedMileage({ ...base, confidence: "low" }).confidence === "low");
  check("the estimate does not move", lowered.estimatedValue === 10000);
  check(
    `the range widens by ${ESTIMATED_MILEAGE_EXTRA_RANGE_PCT} points either side`,
    lowered.rangeLow === 8000 && lowered.rangeHigh === 12000,
    `${lowered.rangeLow}–${lowered.rangeHigh}`,
  );
  check("the original is not mutated", base.confidence === "high" && base.rangeLow === 9000);
  check("a clean last MOT earns its bonus on a normal day", getConditionAdjustment(null, 0, false).total === 3);
  check("but 'no advisories' earns nothing when we couldn't look", getConditionAdjustment(null, 0, false, false).total === 0);

  console.log("\nThe model list:");
  const ford = modelOptionsForMake("FORD");
  check("Ford has its common models", ["FIESTA", "FOCUS", "KUGA"].every((m) => ford.includes(m)), ford.join(", "));
  check("DVLA's two spellings of Mercedes give one list", modelOptionsForMake("MERCEDES").join() === modelOptionsForMake("MERCEDES-BENZ").join() && modelOptionsForMake("MERCEDES").length > 5);
  const vauxhall = modelOptionsForMake("VAUXHALL");
  check("an electric namesake is not a second choice", vauxhall.includes("CORSA") && !vauxhall.includes("CORSA ELECTRIC") && !vauxhall.includes("CORSA E"), vauxhall.join(", "));
  check("no duplicate spellings", new Set(modelOptionsForMake("TOYOTA").map((m) => m.replace(/-/g, " "))).size === modelOptionsForMake("TOYOTA").length);
  check("an unknown make has no list (the visitor types it)", modelOptionsForMake("NOT A MAKE").length === 0);
  check("a typed model is tidied", cleanTypedModel("  focus  st-line! ") === "FOCUS ST-LINE");
  check("an empty one is refused", cleanTypedModel("  !! ") === null);

  console.log("\nThe simulated outage is preview-only:");
  const saved = { env: process.env.VERCEL_ENV, url: process.env.VERCEL_URL };
  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_URL = "example-git-branch.vercel.app";
  check("a preview deployment honours the cookie", simulatedMotOutage("a=1; fpc_sim_mot=new; b=2") === "new");
  check("and ignores any other value", simulatedMotOutage("fpc_sim_mot=yes") === null);
  process.env.VERCEL_ENV = "production";
  process.env.VERCEL_URL = "www.example.co.uk";
  check("live production ignores it", simulatedMotOutage("fpc_sim_mot=new") === null);
  process.env.VERCEL_URL = "";
  check("a local server (VERCEL_ENV pulled as production, no URL) honours it", simulatedMotOutage("fpc_sim_mot=known") === "known");
  process.env.VERCEL_ENV = saved.env;
  process.env.VERCEL_URL = saved.url;

  console.log(failures === 0 ? "\nAll MOT-outage checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
