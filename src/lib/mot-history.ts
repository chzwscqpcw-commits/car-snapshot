// The DVSA MOT history call behind /api/lookup: token, fetch, and — the part
// that was missing — an account of what went wrong when it fails.
//
// On 8–9 Nov 2026 every call failed for 21.5 hours. The only record was 738
// `lookup_error` rows reading {stage: "mot", reason: "network_error"} and a
// log line saying "fetch failed". Node's fetch puts the real reason (an
// expired certificate, a refused connection, a DNS miss) on `error.cause`,
// which nothing read, and the same catch also swallowed a 200 response whose
// body wasn't JSON. A failed token request recorded nothing at all. So the
// outage could be timed from analytics but not explained.
//
// Every failure now comes back as a MotFailure carrying the error's name,
// code and cause, how long the call took and how many attempts it had. The
// route stores that in the event; the plate is scrubbed from every string.

import { maskPlate } from "@/lib/redact";

const MOT_API_URL = "https://history.mot.api.gov.uk/v1/trade/vehicles/registration";
const MOT_SCOPE = "https://tapi.dvsa.gov.uk/.default";
const REQUEST_TIMEOUT_MS = 10_000;
/** One retry for a dropped connection or a gateway error; never for a timeout
 *  (that has already cost ten seconds) or an auth failure. */
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;
const RETRY_STATUSES = new Set([502, 503, 504]);

export type MOTTest = {
  completedDate: string;
  testResult: "PASSED" | "FAILED" | "NO DETAILS HELD";
  expiryDate?: string;
  odometer?: {
    value: number;
    unit: string;
  };
  motTestNumber?: string;
  rfrAndComments?: Array<{
    text: string;
    type: "COMMENT" | "DEFECT" | "ADVISORY";
  }>;
};

type RawMotTest = {
  completedDate?: string;
  testResult?: string;
  expiryDate?: string;
  motTestNumber?: string;
  odometerValue?: string;
  odometerUnit?: string;
  defects?: Array<{ type?: string; text?: string }>;
  advisories?: Array<{ advisoryText?: string; text?: string }>;
  comments?: Array<{ commentText?: string; text?: string }>;
};

export type MOTHistoryData = {
  registration: string;
  make?: string;
  model?: string;
  variant?: string;
  colour?: string;
  primaryColour?: string;
  firstUsedDate?: string;
  registrationDate?: string;
  manufactureDate?: string;
  engineSize?: string;
  fuelType?: string;
  motTests?: MOTTest[];
};

/**
 * Why the MOT call failed. `network_error` is fetch itself throwing (TLS,
 * DNS, a reset connection); `bad_response` is a 200 whose body wasn't JSON,
 * which used to be counted as a network error; `token_failed` is the OAuth
 * step, which used to be counted as nothing.
 */
export type MotFailureReason =
  | "timeout"
  | "network_error"
  | "bad_response"
  | "api_error"
  | "auth_failed"
  | "token_failed";

/** What the thrown error said about itself, safe to store. */
export type FetchErrorDetail = {
  err_name?: string;
  err_code?: string;
  cause_name?: string;
  cause_code?: string;
  cause_msg?: string;
  /** For a body that wouldn't parse: what the response claimed to be. */
  content_type?: string;
};

export type MotFailure = {
  reason: MotFailureReason;
  status?: number;
  detail: FetchErrorDetail;
  /** Wall time of the whole call, retries included. An instant failure and a
   *  ten-second one are different outages. */
  ms: number;
  attempts: number;
};

export type MotFetchResult =
  /** The service answered with a record. */
  | { state: "ok"; data: MOTHistoryData }
  /** The service answered: it holds nothing for this registration. */
  | { state: "none" }
  /** No credentials in this environment (local development). */
  | { state: "unconfigured" }
  /** The service did not answer usefully. The page should say so. */
  | { state: "failed"; failure: MotFailure };

export type MotDeps = {
  fetchImpl?: typeof fetch;
  env?: Record<string, string | undefined>;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
};

const MAX_DETAIL_CHARS = 140;

/**
 * A string with the plate taken out, and cut short. Error messages are
 * someone else's text: undici's own never include the URL, but a proxy or a
 * future runtime might, and the URL ends in the registration.
 */
export function scrubPlate(text: string, vrm?: string): string {
  let out = text.replace(/(\/registration\/)[^\s"'?#)]+/gi, "$1[reg]");
  const plate = (vrm ?? "").replace(/\s+/g, "");
  if (plate.length >= 2) {
    // Tolerate a space anywhere in the plate ("AB12 CDE").
    const pattern = plate
      .split("")
      .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s?");
    out = out.replace(new RegExp(pattern, "gi"), "[reg]");
  }
  return out.length > MAX_DETAIL_CHARS ? `${out.slice(0, MAX_DETAIL_CHARS)}…` : out;
}

function shortString(value: unknown, vrm?: string): string | undefined {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string" || !value) return undefined;
  return scrubPlate(value, vrm);
}

/**
 * The storable facts about a thrown fetch error: its name and code, and the
 * name, code and message of its `cause` (where Node keeps the real reason:
 * CERT_HAS_EXPIRED, ECONNREFUSED, ENOTFOUND, UND_ERR_SOCKET…). Never the
 * error's own message when it has a cause — "fetch failed" says nothing.
 */
export function describeFetchError(err: unknown, vrm?: string): FetchErrorDetail {
  const detail: FetchErrorDetail = {};
  if (!err || typeof err !== "object") {
    const text = shortString(typeof err === "string" ? err : String(err), vrm);
    if (text) detail.cause_msg = text;
    return detail;
  }
  const e = err as { name?: unknown; code?: unknown; message?: unknown; cause?: unknown };
  const name = shortString(e.name, vrm);
  const code = shortString(e.code, vrm);
  if (name) detail.err_name = name;
  if (code) detail.err_code = code;

  // AggregateError (several addresses tried) keeps the reasons one level down.
  let cause = e.cause as { name?: unknown; code?: unknown; message?: unknown; errors?: unknown } | undefined;
  if (cause && typeof cause === "object" && Array.isArray(cause.errors) && cause.errors.length > 0 && !cause.code) {
    cause = cause.errors[0] as typeof cause;
  }
  if (cause && typeof cause === "object") {
    const causeName = shortString(cause.name, vrm);
    const causeCode = shortString(cause.code, vrm);
    const causeMsg = shortString(cause.message, vrm);
    if (causeName) detail.cause_name = causeName;
    if (causeCode) detail.cause_code = causeCode;
    if (causeMsg) detail.cause_msg = causeMsg;
  } else {
    const message = shortString(typeof cause === "string" ? cause : e.message, vrm);
    if (message) detail.cause_msg = message;
  }
  return detail;
}

function isAbort(err: unknown): boolean {
  const name = (err as { name?: unknown } | null)?.name;
  return name === "AbortError" || name === "TimeoutError";
}

function transformMotTest(apiTest: RawMotTest): MOTTest {
  const transformed: MOTTest = {
    completedDate: apiTest.completedDate ?? "",
    testResult: (apiTest.testResult as MOTTest["testResult"]) || "NO DETAILS HELD",
    expiryDate: apiTest.expiryDate,
    motTestNumber: apiTest.motTestNumber,
  };

  if (apiTest.odometerValue) {
    transformed.odometer = {
      value: parseInt(apiTest.odometerValue, 10),
      unit: apiTest.odometerUnit || "MI",
    };
  }

  // Defects, advisories and comments all become rfrAndComments.
  const rfrAndComments: Array<{ text: string; type: "COMMENT" | "DEFECT" | "ADVISORY" }> = [];

  if (Array.isArray(apiTest.defects)) {
    apiTest.defects.forEach((defect) => {
      rfrAndComments.push({
        text: defect.text || "Unknown defect",
        type: defect.type === "ADVISORY" ? "ADVISORY" : "DEFECT",
      });
    });
  }

  if (Array.isArray(apiTest.advisories)) {
    apiTest.advisories.forEach((advisory) => {
      rfrAndComments.push({
        text: advisory.advisoryText || advisory.text || "Unknown advisory",
        type: "ADVISORY",
      });
    });
  }

  if (Array.isArray(apiTest.comments)) {
    apiTest.comments.forEach((comment) => {
      rfrAndComments.push({
        text: comment.commentText || comment.text || "Unknown comment",
        type: "COMMENT",
      });
    });
  }

  if (rfrAndComments.length > 0) {
    transformed.rfrAndComments = rfrAndComments;
  }

  return transformed;
}

function withTests(record: { motTests?: unknown }): MOTHistoryData {
  const out = record as MOTHistoryData & { motTests?: unknown };
  if (Array.isArray(out.motTests)) {
    out.motTests = (out.motTests as RawMotTest[]).map(transformMotTest);
  }
  return out as MOTHistoryData;
}

let cachedMotToken: { token: string; expiresAt: number } | null = null;

/** For tests: forget the module's cached token. */
export function resetMotTokenCache(): void {
  cachedMotToken = null;
}

type TokenResult = { token: string } | { failure: Omit<MotFailure, "ms" | "attempts"> } | { unconfigured: true };

async function getMotToken(deps: Required<Pick<MotDeps, "fetchImpl" | "now">> & { env: Record<string, string | undefined> }): Promise<TokenResult> {
  const { fetchImpl, env, now } = deps;
  if (cachedMotToken && cachedMotToken.expiresAt > now()) {
    return { token: cachedMotToken.token };
  }

  const tenant = env.MOT_TENANT_ID;
  const clientId = env.MOT_CLIENT_ID;
  const clientSecret = env.MOT_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    console.warn("[MOT] Missing OAuth2 credentials");
    return { unconfigured: true };
  }

  try {
    const response = await fetchImpl(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: MOT_SCOPE,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[MOT] Token request failed: ${response.status}`);
      return { failure: { reason: "token_failed", status: response.status, detail: {} } };
    }

    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      console.error("[MOT] Token response had no access_token");
      return { failure: { reason: "token_failed", status: response.status, detail: { cause_msg: "no access_token in response" } } };
    }
    const expiresIn = data.expires_in || 3600;
    cachedMotToken = { token: data.access_token, expiresAt: now() + (expiresIn - 300) * 1000 };
    return { token: data.access_token };
  } catch (error: unknown) {
    const detail = describeFetchError(error);
    console.error("[MOT] Token fetch error:", JSON.stringify(detail));
    return { failure: { reason: "token_failed", detail } };
  }
}

/**
 * MOT history for one registration. Never throws: the caller gets a record,
 * "nothing held", or a failure it can record and tell the visitor about.
 */
export async function fetchMotHistory(registrationNumber: string, deps: MotDeps = {}): Promise<MotFetchResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const env = deps.env ?? process.env;
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const timeoutMs = deps.timeoutMs ?? REQUEST_TIMEOUT_MS;

  const apiKey = env.MOT_API_KEY;
  if (!apiKey) {
    console.warn("[MOT] API key not configured");
    return { state: "unconfigured" };
  }

  const started = now();
  const failed = (failure: Omit<MotFailure, "ms" | "attempts">, attempts: number): MotFetchResult => ({
    state: "failed",
    failure: { ...failure, ms: Math.max(0, Math.round(now() - started)), attempts },
  });

  const auth = await getMotToken({ fetchImpl, env, now });
  if ("unconfigured" in auth) return { state: "unconfigured" };
  if ("failure" in auth) return failed(auth.failure, 1);

  let last: Omit<MotFailure, "ms" | "attempts"> = { reason: "network_error", detail: {} };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let retry = false;

    try {
      console.log(`[MOT] Fetching MOT history for ${maskPlate(registrationNumber)}`);
      const response = await fetchImpl(`${MOT_API_URL}/${registrationNumber}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "X-API-Key": apiKey,
          Accept: "application/json+v6",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[MOT] Vehicle not found: ${maskPlate(registrationNumber)}`);
          return { state: "none" };
        }
        if (response.status === 401 || response.status === 403) {
          // Credential rot is the quietest failure here. Drop the cached token
          // too, or a revoked one keeps being presented until it expires.
          console.error(`[MOT] Authentication failed (${response.status})`);
          cachedMotToken = null;
          return failed({ reason: "auth_failed", status: response.status, detail: {} }, attempt);
        }
        console.error(`[MOT] API error: ${response.status}`);
        last = { reason: "api_error", status: response.status, detail: {} };
        retry = RETRY_STATUSES.has(response.status);
      } else {
        let data: unknown;
        try {
          data = await response.json();
        } catch (error: unknown) {
          if (isAbort(error)) throw error;
          // A 200 that isn't JSON: a maintenance page, a WAF challenge.
          const detail = describeFetchError(error, registrationNumber);
          const contentType = response.headers?.get?.("content-type");
          if (contentType) detail.content_type = scrubPlate(contentType, registrationNumber);
          console.error("[MOT] Unreadable response:", JSON.stringify(detail));
          return failed({ reason: "bad_response", status: response.status, detail }, attempt);
        }

        const record = Array.isArray(data) ? data[0] : data;
        if (record && typeof record === "object") {
          const motData = withTests(record as { motTests?: unknown });
          console.log(`[MOT] Got data with ${motData.motTests?.length || 0} MOT tests`);
          return { state: "ok", data: motData };
        }
        return { state: "none" };
      }
    } catch (error: unknown) {
      if (isAbort(error)) {
        console.error("[MOT] Request timeout");
        return failed({ reason: "timeout", detail: {} }, attempt);
      }
      const detail = describeFetchError(error, registrationNumber);
      console.error("[MOT] Fetch error:", JSON.stringify(detail));
      last = { reason: "network_error", detail };
      retry = true;
    } finally {
      clearTimeout(timer);
    }

    if (!retry || attempt === MAX_ATTEMPTS) return failed(last, attempt);
    await sleep(RETRY_DELAY_MS);
  }

  return failed(last, MAX_ATTEMPTS);
}

/** A failure as flat event metadata: stage, reason, status and the detail. */
export function motFailureMetadata(failure: MotFailure): Record<string, string | number | null> {
  return {
    stage: "mot",
    reason: failure.reason,
    status: failure.status ?? null,
    ...failure.detail,
    ms: failure.ms,
    attempts: failure.attempts,
  };
}
