import theftStats from "@/data/theft-stats.json";
import howManyLeft from "@/data/how-many-left.json";
import colourPopularity from "@/data/colour-popularity.json";
import { registrationData } from "@/lib/stats-data/car-registrations";
import { fmtInt, fmtPct, prettyName } from "../format";
import type { ColoursProps, HowManyLeftProps, Picked, RegistrationsProps, TheftProps, WrongTurnProps } from "../props";
import { CTA, EYEBROW, nth, samplePlate } from "./shared";

type TheftRow = { name: string; thefts: number; previous: number; licensed: number; per1000: number };
type Stats = typeof theftStats;

const THEFT_SOURCE = "DVLA FOI FOIR13058 ÷ DfT VEH0120 licensed vehicles";

const THEFT_VARIANTS: TheftProps["variant"][] = ["most-stolen", "least-stolen", "vans", "risers", "by-age"];

export function pickTheft(occurrence: number, weekIndex: number, music: boolean): Picked<TheftProps> {
  const variant = nth(THEFT_VARIANTS, occurrence);
  const s: Stats = theftStats;
  const year = s.year;
  const common = {
    eyebrow: EYEBROW.brand,
    source: `Source: ${THEFT_SOURCE} · ${year}`,
    cta: CTA.brand,
    plate: samplePlate(weekIndex),
    music,
  };
  const per = (r: TheftRow) => ({ label: r.name, value: r.per1000, display: `${r.per1000.toFixed(1)}`, sub: `${fmtInt(r.thefts)} stolen` });

  if (variant === "least-stolen") {
    const rows = (s.cars.leastByRate as TheftRow[]).slice(0, 6).map(per);
    return {
      composition: "Theft",
      title: "The cars thieves leave alone",
      caption: `The least-stolen cars in the UK in ${year}, per 1,000 on the road: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. The average car is ${s.cars.nationalPer1000} per 1,000. Theft risk for any car is in the free check.`,
      tags: ["cartheft", "carsecurity", "tesla"],
      source: THEFT_SOURCE,
      sourceDate: String(year),
      props: {
        ...common,
        variant,
        hook: ["The cars thieves ", { em: "leave alone" }],
        rows,
        national: s.cars.nationalPer1000,
        nationalLabel: `UK average ${s.cars.nationalPer1000}`,
        unit: "stolen per 1,000 on the road",
        intro: `Thefts per 1,000 on the road, ${year}. The UK average is ${s.cars.nationalPer1000}.`,
        outro: "Theft risk for any car is in the free check.",
      },
    };
  }
  if (variant === "vans") {
    const rows = (s.vans.topByRate as TheftRow[]).slice(0, 6).map(per);
    return {
      composition: "Theft",
      title: "The most stolen vans",
      caption: `The most-stolen vans in the UK in ${year}, per 1,000 on the road: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. The average van is ${s.vans.nationalPer1000} per 1,000, about twice the rate for cars. Theft risk for any vehicle is in the free check.`,
      tags: ["vanlife", "vantheft", "tradesman"],
      source: THEFT_SOURCE,
      sourceDate: String(year),
      props: {
        ...common,
        variant,
        hook: ["The most stolen ", { em: "vans" }, " in the UK"],
        rows,
        national: s.vans.nationalPer1000,
        nationalLabel: `Van average ${s.vans.nationalPer1000}`,
        unit: "stolen per 1,000 on the road",
        intro: `Thefts per 1,000 on the road, ${year}. Vans go at about twice the rate of cars.`,
        outro: "Theft risk for any vehicle is in the free check.",
      },
    };
  }
  if (variant === "risers") {
    const rows = (s.cars.risers as TheftRow[])
      .filter((r) => r.previous > 0)
      .slice(0, 6)
      .map((r) => ({
        label: r.name,
        value: Math.round(((r.thefts - r.previous) / r.previous) * 100),
        display: `+${Math.round(((r.thefts - r.previous) / r.previous) * 100)}%`,
        sub: `${fmtInt(r.previous)} → ${fmtInt(r.thefts)}`,
      }));
    return {
      composition: "Theft",
      title: "Thefts rising fastest",
      caption: `Car thefts rising fastest in the UK, ${year - 1} to ${year}: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. Theft risk for any car is in the free check.`,
      tags: ["cartheft", "carsecurity", "lexus"],
      source: THEFT_SOURCE,
      sourceDate: String(year),
      props: {
        ...common,
        variant,
        hook: ["Car thefts ", { em: "rising fastest" }],
        rows,
        national: 0,
        nationalLabel: "",
        unit: `change in thefts, ${year - 1} to ${year}`,
        intro: `Change in recorded thefts, ${year - 1} to ${year}, among the ten most-stolen models.`,
        outro: "Theft risk for any car is in the free check.",
      },
    };
  }
  if (variant === "by-age") {
    const rows = (s.cars.byAge as Array<{ band: string; thefts: number; licensed: number; per1000: number }>).map((r) => ({
      label: `${r.band} old`,
      value: r.per1000,
      display: r.per1000.toFixed(2),
      sub: `${fmtInt(r.thefts)} stolen`,
    }));
    const top = [...rows].sort((a, b) => b.value - a.value)[0];
    return {
      composition: "Theft",
      title: "The age of car thieves prefer",
      caption: `Which cars get stolen, by age (${year}, per 1,000 on the road): ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. Cars ${top.label} are the ones to watch. Theft risk for any car is in the free check.`,
      tags: ["cartheft", "carsecurity"],
      source: THEFT_SOURCE,
      sourceDate: String(year),
      props: {
        ...common,
        variant,
        hook: ["The age of car thieves ", { em: "prefer" }],
        rows,
        national: s.cars.nationalPer1000,
        nationalLabel: `UK average ${s.cars.nationalPer1000}`,
        unit: "stolen per 1,000 on the road",
        intro: `Thefts per 1,000 on the road by age of car, ${year}.`,
        outro: "Theft risk for any car is in the free check.",
      },
    };
  }
  const rows = (s.cars.topByRate as TheftRow[]).slice(0, 6).map(per);
  return {
    composition: "Theft",
    title: "The most stolen cars per 1,000",
    caption: `The most-stolen cars in the UK in ${year}, per 1,000 on the road: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. The average car is ${s.cars.nationalPer1000} per 1,000. Theft risk for any car is in the free check.`,
    tags: ["cartheft", "carsecurity", "lexus", "toyota"],
    source: THEFT_SOURCE,
    sourceDate: String(year),
    props: {
      ...common,
      variant,
      hook: ["The most ", { em: "stolen" }, " cars in the UK"],
      rows,
      national: s.cars.nationalPer1000,
      nationalLabel: `UK average ${s.cars.nationalPer1000}`,
      unit: "stolen per 1,000 on the road",
      intro: `Thefts per 1,000 on the road, ${year}. The UK average is ${s.cars.nationalPer1000}.`,
      outro: "Theft risk for any car is in the free check.",
    },
  };
}

/**
 * Well-known cars whose "how many left" count tells a story: a model most
 * people remember, with a licensed-vs-SORN split worth a clip. Each key must
 * exist in how-many-left.json (the test checks).
 */
export const HOW_MANY_LEFT_MODELS: readonly string[] = [
  "FORD|ESCORT", "VAUXHALL|CAVALIER", "FORD|SIERRA", "ROVER|200 SERIES", "PEUGEOT|206", "FORD|KA",
  "VAUXHALL|NOVA", "FORD|CAPRI", "AUSTIN|METRO", "ROVER|75", "CITROEN|SAXO", "FORD|CORTINA",
  "SAAB|9 3", "FIAT|PUNTO", "ROVER|25", "MG|ZR", "VOLKSWAGEN|BEETLE", "NISSAN|MICRA", "FORD|PUMA",
  "RENAULT|MEGANE", "VAUXHALL|ZAFIRA", "HONDA|CIVIC", "TOYOTA|COROLLA", "FORD|MONDEO", "PEUGEOT|306",
  "VAUXHALL|VECTRA", "VOLKSWAGEN|GOLF", "FORD|FIESTA", "MINI|COOPER", "MAZDA|MX 5", "AUSTIN|MINI",
  "MORRIS|MINOR", "JAGUAR|X TYPE", "ROVER|MINI", "FORD|ORION", "VAUXHALL|ASTRA", "TOYOTA|YARIS",
  "RENAULT|CLIO", "CITROEN|C3", "PEUGEOT|107", "SMART|FORTWO", "HYUNDAI|I10", "KIA|PICANTO",
  "SUZUKI|SWIFT", "LAND ROVER|DEFENDER", "FORD|TRANSIT", "VOLKSWAGEN|TRANSPORTER", "SUBARU|IMPREZA",
  "MITSUBISHI|LANCER", "HONDA|JAZZ", "SKODA|FABIA", "SEAT|IBIZA",
];

const RARITY = (total: number) =>
  total < 1000 ? "very rare" : total < 5000 ? "rare" : total < 25000 ? "uncommon" : total < 100000 ? "common" : "very common";

export function pickHowManyLeft(occurrence: number, weekIndex: number, music: boolean): Picked<HowManyLeftProps> {
  const data = howManyLeft as unknown as Record<string, [number, number]>;
  const key = nth(HOW_MANY_LEFT_MODELS, occurrence);
  const entry = data[key];
  if (!entry) throw new Error(`how-many-left: ${key} is not in src/data/how-many-left.json`);
  const [licensed, sorn] = entry;
  const name = prettyName(key);
  const total = licensed + sorn;
  const category = RARITY(total);
  const sornShare = total > 0 ? Math.round((sorn / total) * 100) : 0;
  const outro =
    sornShare >= 40
      ? `${sornShare}% of the survivors are off the road on SORN.`
      : `${fmtInt(total)} in all, ${fmtInt(sorn)} of them tucked away on SORN.`;
  return {
    composition: "HowManyLeft",
    title: `How many ${name}s are left?`,
    caption: `How many ${name}s are left in the UK? ${fmtInt(licensed)} still licensed and ${fmtInt(sorn)} on SORN, so ${fmtInt(total)} survive. That makes it ${category}. Look up any model's survivors with the free check.`,
    tags: ["howmanyleft", "classiccars", name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")],
    source: "DfT VEH0120 / VEH0124 (DVLA licensing data)",
    sourceDate: "latest quarter",
    props: {
      hook: ["How many ", { em: `${name}s` }, " are left?"],
      eyebrow: EYEBROW.brand,
      source: "Source: DfT vehicle licensing statistics (VEH0120 / VEH0124)",
      cta: CTA.brand,
      plate: samplePlate(weekIndex),
      music,
      name,
      licensed,
      sorn,
      category,
      outro,
    },
  };
}

const SWATCH: Record<string, string> = {
  GREY: "#9AA3AF", BLACK: "#1F2328", BLUE: "#2F6FDB", WHITE: "#F3F4F6", SILVER: "#C8CDD3", RED: "#D23B3B",
  GREEN: "#2E8B57", YELLOW: "#F5C518", ORANGE: "#F07F2A", BRONZE: "#A87B4F", PURPLE: "#7C4DFF", BROWN: "#6B4A2B",
  BEIGE: "#D9C7A7", MAROON: "#7A1F2B", GOLD: "#D4AF37",
};

export function pickColours(occurrence: number, weekIndex: number, music: boolean): Picked<ColoursProps> {
  const data = colourPopularity as Record<string, { rank: number; share: number; label: string }>;
  const all = Object.entries(data)
    .map(([colour, v]) => ({ colour, ...v }))
    .sort((a, b) => a.rank - b.rank);
  const variant: ColoursProps["variant"] = occurrence % 2 === 0 ? "top" : "rare";
  const chosen = variant === "top" ? all.slice(0, 7) : all.slice(-7).reverse();
  const rows = chosen.map((c) => ({
    label: prettyName(c.colour),
    value: c.share,
    display: fmtPct(c.share, 1),
    swatch: SWATCH[c.colour] ?? "#888",
  }));
  const topThree = all.slice(0, 3).map((c) => prettyName(c.colour).toLowerCase());
  const monochrome = all.filter((c) => ["GREY", "BLACK", "WHITE", "SILVER"].includes(c.colour)).reduce((n, c) => n + c.share, 0);
  if (variant === "rare") {
    return {
      composition: "Colours",
      title: "The rarest car colours in the UK",
      caption: `The rarest colours on new UK cars: ${rows.map((r) => `${r.label} ${r.display}`).join(", ")}. ${Math.round(monochrome)}% of new cars are grey, black, white or silver. Colour and how common it is show up in the free check.`,
      tags: ["carcolours", "newcars"],
      source: "SMMT new car registrations by colour",
      sourceDate: "2025",
      props: {
        hook: ["The ", { em: "rarest" }, " car colours in the UK"],
        eyebrow: EYEBROW.brand,
        source: "Source: SMMT new car registrations by colour · 2025",
        cta: CTA.brand,
        plate: samplePlate(weekIndex),
        music,
        variant,
        rows,
        intro: "Share of new cars registered, by colour.",
        outro: `${Math.round(monochrome)}% of new cars are grey, black, white or silver.`,
      },
    };
  }
  return {
    composition: "Colours",
    title: "Britain's favourite car colours",
    caption: `Britain's favourite car colours: ${rows
      .slice(0, 5)
      .map((r) => `${r.label} ${r.display}`)
      .join(", ")}. ${topThree.join(", ")} take ${Math.round(all.slice(0, 3).reduce((n, c) => n + c.share, 0))}% between them. Your car's colour, and how rare it is, is in the free check.`,
    tags: ["carcolours", "newcars", "grey"],
    source: "SMMT new car registrations by colour",
    sourceDate: "2025",
    props: {
      hook: ["Britain's ", { em: "favourite" }, " car colours"],
      eyebrow: EYEBROW.brand,
      source: "Source: SMMT new car registrations by colour · 2025",
      cta: CTA.brand,
      plate: samplePlate(weekIndex),
      music,
      variant,
      rows,
      intro: "Share of new cars registered, by colour.",
      outro: `${Math.round(monochrome)}% of new cars are grey, black, white or silver.`,
    },
  };
}

const REG_VARIANTS: RegistrationsProps["variant"][] = ["bev", "total", "diesel"];

export function pickRegistrations(occurrence: number, weekIndex: number, music: boolean): Picked<RegistrationsProps> {
  const variant = nth(REG_VARIANTS, occurrence);
  const years = registrationData.filter((r) => r.year >= 2015 && r.bev != null);
  const last = years[years.length - 1];
  const first = years[0];
  const base = {
    eyebrow: EYEBROW.brand,
    source: "Source: SMMT / DfT VEH0160 new car registrations",
    cta: CTA.brand,
    plate: samplePlate(weekIndex),
    music,
  };
  if (variant === "bev") {
    const line = years.map((r) => ({ x: String(r.year).slice(2), y: r.bev ?? 0 }));
    return {
      composition: "Registrations",
      title: "Electric share of new cars",
      caption: `Electric cars were ${first.bev}% of new UK registrations in ${first.year}. In ${last.year} they were ${last.bev}%, with hybrids on another ${last.hybrid}%. Fuel type, tax and ULEZ status for any car are in the free check.`,
      tags: ["electriccars", "ev", "newcars"],
      source: "SMMT / DfT VEH0160",
      sourceDate: String(last.year),
      props: {
        ...base,
        variant,
        hook: ["Electric: from ", { em: `${first.bev}%` }, " to ", { em: `${last.bev}%` }, " of new cars"],
        columns: [],
        line,
        intro: `Battery-electric share of new car registrations, ${first.year} to ${last.year}.`,
        outro: `Hybrids took another ${last.hybrid}% in ${last.year}. Diesel: ${last.diesel}%.`,
      },
    };
  }
  if (variant === "diesel") {
    const line = years.map((r) => ({ x: String(r.year).slice(2), y: r.diesel ?? 0 }));
    return {
      composition: "Registrations",
      title: "The fall of diesel",
      caption: `Diesel was ${first.diesel}% of new UK cars in ${first.year}. In ${last.year} it was ${last.diesel}%. Petrol: ${last.petrol}%. Electric: ${last.bev}%. Fuel type, tax and ULEZ status for any car are in the free check.`,
      tags: ["diesel", "newcars", "ulez"],
      source: "SMMT / DfT VEH0160",
      sourceDate: String(last.year),
      props: {
        ...base,
        variant,
        hook: ["Diesel: ", { em: `${first.diesel}%` }, " of new cars to ", { em: `${last.diesel}%` }],
        columns: [],
        line,
        intro: `Diesel share of new car registrations, ${first.year} to ${last.year}.`,
        outro: `Petrol ${last.petrol}%, hybrid ${last.hybrid}%, electric ${last.bev}% in ${last.year}.`,
      },
    };
  }
  const span = registrationData.filter((r) => r.year >= 2010);
  const peak = [...span].sort((a, b) => b.total - a.total)[0];
  const columns = span.map((r) => ({ label: String(r.year).slice(2), value: r.total, highlight: r.year === peak.year || r.year === 2020 }));
  const lastTotal = span[span.length - 1];
  return {
    composition: "Registrations",
    title: "New car registrations by year",
    caption: `New car registrations in the UK peaked at ${(peak.total / 1000).toFixed(2)} million in ${peak.year}. ${lastTotal.year}: ${(lastTotal.total / 1000).toFixed(2)} million. The first registration date and age of any car are in the free check.`,
    tags: ["newcars", "ukcars"],
    source: "SMMT / DfT VEH0160",
    sourceDate: String(lastTotal.year),
    props: {
      ...base,
      variant,
      hook: ["New cars: ", { em: `${(peak.total / 1000).toFixed(1)}m` }, " a year at the peak"],
      columns,
      line: [],
      intro: `New car registrations a year (thousands), ${span[0].year} to ${lastTotal.year}.`,
      outro: `${peak.year} was the peak. 2020: ${(span.find((r) => r.year === 2020)?.total ?? 0) / 1000}m, the lowest in decades.`,
    },
  };
}

export function pickWrongTurn(_occurrence: number, weekIndex: number, music: boolean): Picked<WrongTurnProps> {
  return {
    composition: "WrongTurn",
    title: "Our 404 page is a racing game",
    caption: "Type a wrong address on freeplatecheck.co.uk and you get a night drive up the motorway instead of an error page. Weekly league, fastest run wins bragging rights. Then check your car while you're there.",
    tags: ["404", "browsergame", "racinggame"],
    source: "Free Plate Check's own 404 page",
    sourceDate: "2026",
    props: {
      hook: ["Our 404 page is a ", { em: "racing game" }],
      eyebrow: EYEBROW.brand,
      source: "Wrong Turn: the 404 page at freeplatecheck.co.uk",
      cta: "Type any wrong address at freeplatecheck.co.uk",
      plate: samplePlate(weekIndex),
      music,
      lines: ["A night drive up the motorway", "Steer with the arrows, or your thumbs", "Weekly league. Fastest run wins", "Then check your car while you're there"],
    },
  };
}
