import motAreas from "@/data/mot-areas.json";
import motFailureReasons from "@/data/mot-failure-reasons.json";
import motPassRates from "@/data/mot-pass-rates.json";
import { MOT_TOWNS } from "@/data/mot-locations";
import { areaName } from "../data/postcode-areas";
import { fmtInt, fmtPct, MONTHS, prettyName } from "../format";
import type { FailReasonsProps, PassByAreaProps, PassByModelProps, Picked, SeasonDueProps } from "../props";
import { CTA, EYEBROW, nth, samplePlate } from "./shared";

type Area = {
  tests: number;
  passes: number;
  mileageMedian: number | null;
  ageMedian: number | null;
  months: number[];
  sections: [string, number][];
  dangerous: number;
};
type AreasFile = {
  year: number;
  national: { tests: number; passes: number; ageMedian: number; months: number[]; sections: [string, number][] };
  areas: Record<string, Area>;
};
const AREAS = motAreas as unknown as AreasFile;
const PASS = motPassRates as unknown as Record<string, [number, number]>;
const FAILS = motFailureReasons as Record<string, string[]>;

const YEAR = AREAS.year;
const NATIONAL_PASS = (AREAS.national.passes / AREAS.national.tests) * 100;
const SRC = "DVSA anonymised MOT results, class 4, first-time result";

/** The subjects of the fail-reasons clip: the national picture, then popular models. */
export const FAIL_SUBJECTS: readonly string[] = [
  // Not in the worth-after list's order, so a week rarely shows one model twice.
  "national", "FORD|FOCUS", "BMW|3 SERIES", "VAUXHALL|CORSA", "AUDI|A3", "FORD|FIESTA",
  "NISSAN|QASHQAI", "VOLKSWAGEN|GOLF", "VOLKSWAGEN|POLO", "BMW|1 SERIES", "FORD|TRANSIT", "VAUXHALL|ASTRA",
  "MERCEDES BENZ|C CLASS", "TOYOTA|YARIS", "FORD|KUGA", "HONDA|CIVIC", "KIA|SPORTAGE",
  "LAND ROVER|RANGE ROVER EVOQUE", "PEUGEOT|208", "VOLKSWAGEN|TRANSPORTER",
];

export function pickFailReasons(occurrence: number, weekIndex: number, music: boolean): Picked<FailReasonsProps> {
  const subject = nth(FAIL_SUBJECTS, occurrence);
  const base = {
    eyebrow: EYEBROW.mot,
    source: `Source: ${SRC} · ${YEAR}`,
    cta: CTA.mot,
    plate: samplePlate(weekIndex),
    music,
  };
  if (subject === "national") {
    const rows = AREAS.national.sections.slice(0, 5).map(([label, n]) => ({
      label,
      value: (n / AREAS.national.tests) * 100,
      display: fmtPct((n / AREAS.national.tests) * 100, 1),
      sub: `${(n / 1e6).toFixed(1)}m tests`,
    }));
    return {
      composition: "FailReasons",
      title: "What fails the MOT most",
      caption: `What fails an MOT? Share of ${(AREAS.national.tests / 1e6).toFixed(0)} million tests in ${YEAR} with at least one fail in each area: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. ${Math.round(NATIONAL_PASS)}% pass first time. A free check shows every advisory and fail on your car's record.`,
      tags: ["motfail", "mottest", "carmaintenance"],
      source: SRC,
      sourceDate: String(YEAR),
      props: {
        ...base,
        hook: ["What ", { em: "fails" }, " the MOT most"],
        subject: "Every car tested in the UK",
        rows,
        ranked: false,
        intro: `Share of tests with a fail in each area, ${YEAR}. ${Math.round(NATIONAL_PASS)}% of cars pass first time.`,
        outro: "Lights are the cheapest fix on the list. Check yours the night before.",
      },
    };
  }
  const reasons = FAILS[subject];
  if (!reasons) throw new Error(`fail-reasons: ${subject} is not in src/data/mot-failure-reasons.json`);
  const name = prettyName(subject);
  const pass = PASS[subject];
  const rows = reasons.slice(0, 5).map((label, i) => ({ label, value: 5 - i, display: String(i + 1) }));
  const passLine = pass ? `${pass[1].toFixed(0)}% of ${name}s pass first time (UK ${Math.round(NATIONAL_PASS)}%).` : "";
  return {
    composition: "FailReasons",
    title: `What a ${name} fails its MOT on`,
    caption: `What does a ${name} fail its MOT on? In order: ${reasons.slice(0, 5).join(", ")}. ${passLine} A free check shows every advisory and fail on your own car's record, and when the next test is due.`,
    tags: ["motfail", "mottest", name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")],
    source: SRC,
    sourceDate: String(YEAR),
    props: {
      ...base,
      hook: ["What a ", { em: name }, " fails its MOT on"],
      subject: name,
      rows,
      ranked: true,
      intro: pass ? `${fmtInt(pass[0])} tests. ${passLine}` : `The most common fail areas for the ${name}.`,
      outro: "A free check lists every advisory and fail on your own car's record.",
    },
  };
}

const MIN_AREA_TESTS = 80_000;

function areaRows(sortDesc: boolean) {
  return Object.entries(AREAS.areas)
    .filter(([, a]) => a.tests >= MIN_AREA_TESTS)
    .map(([code, a]) => ({ code, pass: (a.passes / a.tests) * 100, tests: a.tests }))
    .sort((x, y) => (sortDesc ? y.pass - x.pass : x.pass - y.pass))
    .slice(0, 6)
    .map((a) => ({ label: areaName(a.code), value: a.pass, display: fmtPct(a.pass, 1), sub: `${a.code} · ${(a.tests / 1e3).toFixed(0)}k tests` }));
}

/** Spotlight towns: the site's MOT town pages, one area set each. */
const SPOTLIGHTS = MOT_TOWNS.filter((t) => t.postcodeAreas.some((a) => AREAS.areas[a]));

export function pickPassByArea(occurrence: number, weekIndex: number, music: boolean): Picked<PassByAreaProps> {
  // best, worst, then one spotlight town per appearance through every town
  // page the site has, before the two league tables come round again.
  const cycle = occurrence % (SPOTLIGHTS.length + 2);
  const variant: PassByAreaProps["variant"] = cycle === 0 ? "best" : cycle === 1 ? "worst" : "spotlight";
  const base = {
    eyebrow: EYEBROW.mot,
    source: `Source: ${SRC} · ${YEAR}`,
    cta: CTA.mot,
    plate: samplePlate(weekIndex),
    music,
    national: NATIONAL_PASS,
  };
  if (variant === "spotlight") {
    const town = nth(SPOTLIGHTS, cycle - 2);
    const areas = town.postcodeAreas.map((c) => AREAS.areas[c]).filter(Boolean);
    const tests = areas.reduce((n, a) => n + a.tests, 0);
    const passes = areas.reduce((n, a) => n + a.passes, 0);
    const pass = (passes / tests) * 100;
    const sections = new Map<string, number>();
    for (const a of areas) for (const [s, n] of a.sections) sections.set(s, (sections.get(s) ?? 0) + n);
    const rows = [...sections.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 5)
      .map(([label, n]) => ({ label, value: (n / tests) * 100, display: fmtPct((n / tests) * 100, 1) }));
    const diff = pass - NATIONAL_PASS;
    const vs = Math.abs(diff) < 0.5 ? "right on the UK average" : `${Math.abs(diff).toFixed(1)} points ${diff > 0 ? "above" : "below"} the UK average`;
    return {
      composition: "PassByArea",
      title: `MOT pass rate in ${town.name}`,
      caption: `MOT results in ${town.name}: ${pass.toFixed(1)}% of ${fmtInt(tests)} cars passed first time in ${YEAR}, ${vs} of ${NATIONAL_PASS.toFixed(1)}%. What fails most there: ${rows
        .slice(0, 3)
        .map((r) => `${r.label} ${r.display}`)
        .join(", ")}. Check your own car's MOT history and due date, free.`,
      tags: ["mot", town.slug.replace(/-/g, ""), "motfail"],
      source: SRC,
      sourceDate: String(YEAR),
      props: {
        ...base,
        variant,
        hook: ["How ", { em: town.name }, " does at the MOT"],
        rows,
        spotlight: { name: town.name, passRate: pass, tests },
        intro: `${fmtInt(tests)} first-time tests in ${YEAR}, ${vs}.`,
        outro: "What fails most there, as a share of tests.",
      },
    };
  }
  const rows = areaRows(variant === "best");
  return {
    composition: "PassByArea",
    title: variant === "best" ? "Where cars pass the MOT most" : "Where cars fail the MOT most",
    caption:
      variant === "best"
        ? `Where do cars pass the MOT most? First-time pass rate by postcode area, ${YEAR}: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. UK average ${NATIONAL_PASS.toFixed(1)}%. Check your own car's MOT history and due date, free.`
        : `Where do cars fail the MOT most? Lowest first-time pass rates by postcode area, ${YEAR}: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. UK average ${NATIONAL_PASS.toFixed(1)}%. Older, higher-mileage cars and city driving take their toll. Check your own car's MOT history and due date, free.`,
    tags: ["mot", "motfail", "postcode"],
    source: SRC,
    sourceDate: String(YEAR),
    props: {
      ...base,
      variant,
      hook: variant === "best" ? ["Where cars ", { em: "pass" }, " the MOT most"] : ["Where cars ", { em: "fail" }, " the MOT most"],
      rows,
      intro: `First-time pass rate by postcode area, ${YEAR}. UK average ${NATIONAL_PASS.toFixed(1)}%.`,
      outro: variant === "best" ? "Newer cars, fewer miles: the areas at the top test younger cars." : "Older, higher-mileage cars and city driving take their toll.",
    },
  };
}

const MIN_MODEL_TESTS = 100_000;
const MODEL_VARIANTS: PassByModelProps["variant"][] = ["best", "worst", "makes"];

export function pickPassByModel(occurrence: number, weekIndex: number, music: boolean): Picked<PassByModelProps> {
  const variant = nth(MODEL_VARIANTS, occurrence);
  const base = {
    eyebrow: EYEBROW.mot,
    source: `Source: ${SRC} · ${YEAR}`,
    cta: CTA.mot,
    plate: samplePlate(weekIndex),
    music,
    national: NATIONAL_PASS,
  };
  if (variant === "makes") {
    const byMake = new Map<string, { tests: number; passes: number }>();
    for (const [key, [tests, rate]] of Object.entries(PASS)) {
      const make = key.split("|")[0];
      const m = byMake.get(make) ?? { tests: 0, passes: 0 };
      m.tests += tests;
      m.passes += (tests * rate) / 100;
      byMake.set(make, m);
    }
    const rows = [...byMake.entries()]
      .filter(([, m]) => m.tests >= 400_000)
      .map(([make, m]) => ({ label: prettyName(make), value: (m.passes / m.tests) * 100, display: fmtPct((m.passes / m.tests) * 100, 1), sub: `${(m.tests / 1e6).toFixed(1)}m tests` }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    return {
      composition: "PassByModel",
      title: "MOT pass rate by make",
      caption: `Which makes pass the MOT most? First-time pass rate across the big-volume models, ${YEAR}: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. UK average ${NATIONAL_PASS.toFixed(1)}%. Your car's own pass rate and fail history are in the free check.`,
      tags: ["mot", "reliability", "mottest"],
      source: SRC,
      sourceDate: String(YEAR),
      props: {
        ...base,
        variant,
        hook: ["MOT pass rate by ", { em: "make" }],
        rows,
        intro: `First-time pass rate, across each make's high-volume models, ${YEAR}.`,
        outro: "Age and mileage matter more than the badge. Both are in the free check.",
      },
    };
  }
  const models = Object.entries(PASS)
    .filter(([, [tests]]) => tests >= MIN_MODEL_TESTS)
    .map(([key, [tests, rate]]) => ({ key, tests, rate }))
    .sort((a, b) => (variant === "best" ? b.rate - a.rate : a.rate - b.rate))
    .slice(0, 6);
  const rows = models.map((m) => ({ label: prettyName(m.key), value: m.rate, display: fmtPct(m.rate, 1), sub: `${(m.tests / 1e3).toFixed(0)}k tests` }));
  return {
    composition: "PassByModel",
    title: variant === "best" ? "Cars most likely to pass the MOT" : "Cars most likely to fail the MOT",
    caption:
      variant === "best"
        ? `The cars most likely to pass their MOT first time, ${YEAR} (models with 100k+ tests): ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. UK average ${NATIONAL_PASS.toFixed(1)}%. Your car's own pass rate and history are in the free check.`
        : `The cars most likely to fail their MOT, ${YEAR} (models with 100k+ tests): ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. UK average ${NATIONAL_PASS.toFixed(1)}%. Older fleets, more miles. Your car's own pass rate and history are in the free check.`,
    tags: ["mot", "motfail", "reliability"],
    source: SRC,
    sourceDate: String(YEAR),
    props: {
      ...base,
      variant,
      hook: variant === "best" ? ["Cars most likely to ", { em: "pass" }, " the MOT"] : ["Cars most likely to ", { em: "fail" }, " the MOT"],
      rows,
      intro: `First-time pass rate, models with 100k+ tests, ${YEAR}. UK average ${NATIONAL_PASS.toFixed(1)}%.`,
      outro: variant === "best" ? "Newer models test younger. Age and mileage drive most of this." : "Older fleets, more miles: the bottom of the table is mostly age.",
    },
  };
}

export function pickSeasonDue(monthIndex: number, weekIndex: number, music: boolean): Picked<SeasonDueProps> {
  const months = AREAS.national.months;
  const total = months.reduce((a, b) => a + b, 0);
  const share = (months[monthIndex] / total) * 100;
  const name = MONTHS[monthIndex];
  const columns = months.map((n, i) => ({ label: i === monthIndex ? name.slice(0, 3) : MONTHS[i].slice(0, 1), value: n, highlight: i === monthIndex }));
  const plateTag = monthIndex === 2 ? "a March plate" : "a September plate";
  return {
    composition: "SeasonDue",
    title: `Your MOT may be due this ${name}`,
    caption: `Registered in ${name}? Your MOT is probably due about now. ${(months[monthIndex] / 1e6).toFixed(1)} million MOTs happen in ${name}, ${share.toFixed(0)}% of the year's tests, because new plates arrive in March and September and the tests follow three years on. A free check shows your exact due date and what the car failed on before.`,
    tags: ["motdue", "mot", monthIndex === 2 ? "marchplate" : "septemberplate"],
    source: SRC,
    sourceDate: String(YEAR),
    props: {
      hook: ["Got ", { em: plateTag }, "? Your MOT is probably due"],
      eyebrow: EYEBROW.mot,
      source: `Source: ${SRC} · ${YEAR}`,
      cta: "Find your exact MOT due date, free",
      plate: samplePlate(weekIndex),
      music,
      monthIndex,
      columns,
      intro: `MOT tests by month, ${YEAR}. ${name}: ${(months[monthIndex] / 1e6).toFixed(1)} million, ${share.toFixed(0)}% of the year.`,
      outro: "New plates land in March and September. Three years on, the tests follow.",
    },
  };
}
