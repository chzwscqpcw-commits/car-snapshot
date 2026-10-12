#!/usr/bin/env python3
"""
Build theft-risk.json and theft-stats.json from DVLA's stolen-vehicle release
(FOI FOIR13058: vehicles recorded as stolen by make/model description, year of
manufacture and calendar year, 2014-2025) divided by DfT VEH0120 licensed
stock. Replaces the Feb 2026 theft-risk.json, which was round estimates with
no source (its 84 models summed to more thefts than DVLA records for all cars).

Inputs:
  - The FOI spreadsheet. DVLA doesn't publish FOI responses; request
    FOIR13058 from foi@dvla.gov.uk (asked 11 Oct 2026, answered next day).
  - df_VEH0120_UK.csv from
    https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-files

  - Optional: df_VEH0124_AM.csv + df_VEH0124_NZ.csv (same page; licensed
    cars by year of manufacture), for the theft RATE by car age. Without
    them byAge has counts only, which mostly reflect how many cars of each
    age there are.

Usage:
  python3 -m venv .venv && .venv/bin/pip install duckdb openpyxl
  .venv/bin/python scripts/process-theft-foi.py <FOIR13058.xlsx> <df_VEH0120_UK.csv> [<VEH0124_AM.csv> <VEH0124_NZ.csv>]

Method:
  - DVLA's description is "MAKE MODEL-TRIM" ("FORD FIESTA ZETEC"), the same
    text as VEH0120's Make + Model, so each description is joined to its
    VEH0120 body type and generic model (FORD FIESTA). Three passes: exact,
    then ignoring spaces/punctuation, then the longest word prefix whose
    VEH0120 stock is >=90% one generic model ("MERCEDES-BENZ E 220 D AMG LINE
    AUTO" -> E CLASS). ~97% of 2025 thefts match; the rest are make-only rows
    ("HONDA") and plant. Unmatched thefts are left out of every rate, so rates
    are a slight undercount, the same way for every model.
  - Rate = cars stolen in the latest year / cars licensed at that year's Q4,
    per 1,000. Cars only (VEH0120 body type "Cars"): vans and bikes are in the
    release but not rated.
  - DVLA counts a vehicle once per theft, so one car stolen twice counts twice.
"""

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import duckdb
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"

YEARS = list(range(2014, 2026))
LATEST = YEARS[-1]
STOCK_COL = f"{LATEST} Q4"
# Smallest licensed fleet that gets a rating. Below this a handful of thefts
# swings the rate across categories.
MIN_RATED_STOCK = 10_000
# Smallest fleet for the "highest theft rate" league table on /stats/car-theft.
MIN_TABLE_STOCK = 20_000

# Classes with a page of their own. Vans and bikes have smaller fleets, so the
# rating threshold is lower; the league tables keep their own floors.
CLASSES = {
    # key: (VEH0120 BodyType, min stock to rate, min stock for rate table)
    "cars": ("Cars", MIN_RATED_STOCK, MIN_TABLE_STOCK),
    "vans": ("Light goods vehicles", 5_000, 10_000),
    "motorcycles": ("Motorcycles", 5_000, 10_000),
}
# Least-stolen table: only common cars, so "zero thefts" from a tiny fleet
# can't top it.
MIN_LEAST_STOCK = 100_000

FUEL_GROUPS = {
    "PETROL": "Petrol",
    "DIESEL": "Diesel",
    "BATTERY ELECTRIC": "Electric",
    "HYBRID ELECTRIC (PETROL)": "Hybrid",
    "HYBRID ELECTRIC (DIESEL)": "Hybrid",
    "PLUG-IN HYBRID ELECTRIC (PETROL)": "Plug-in hybrid",
    "PLUG-IN HYBRID ELECTRIC (DIESEL)": "Plug-in hybrid",
    "RANGE EXTENDED ELECTRIC": "Plug-in hybrid",
}

# Age of the car when stolen, from DVLA's year of manufacture.
AGE_BANDS = [(0, 3, "0–3 years"), (4, 7, "4–7 years"), (8, 12, "8–12 years"),
             (13, 20, "13–20 years"), (21, 999, "21+ years")]

# DfT's generic model for a scooter is its type-approval code; readers know the
# marketing name.
NAME_OVERRIDES = {
    "HONDA|WW125": "Honda PCX125",
    "YAMAHA|GPD": "Yamaha NMAX",
    "HONDA|NSC": "Honda Vision",
    "HONDA|NSS": "Honda Forza",
    "VOLKSWAGEN|UP": "Volkswagen Up",
    # Generic models that are whole families
    "YAMAHA|MT": "Yamaha MT range",
    "YAMAHA|YZF": "Yamaha YZF-R range",
    "HONDA|CBR": "Honda CBR range",
    "HONDA|CB": "Honda CB range",
}

# VEH0120 files most Mercedes under "MERCEDES" (342k C Class) and a few hundred
# recent cars under "MERCEDES-BENZ", which is how DVLA spells every one.
# Without folding them together, DVLA's GLC thefts land on a 1-car fleet.
MAKE_CANON = {"MERCEDES": "MERCEDES-BENZ"}

UPPER_WORDS = {"BMW", "MG", "DS", "BYD", "GLA", "GLC", "GLE", "CLA", "SUV", "GTI", "AMG"}


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.upper().replace("-", " ").replace("_", " ")).strip()


def squash(s: str) -> str:
    return re.sub(r"[^A-Z0-9+]", "", s.upper())


def model_key(make: str, gen: str) -> str:
    """Site lookup key, e.g. ("MERCEDES", "MERCEDES C CLASS") -> "MERCEDES BENZ|C CLASS"."""
    model = gen[len(make) + 1:] if gen.startswith(make + " ") else gen
    return f"{norm(MAKE_CANON.get(make, make))}|{norm(model)}"


def display(name: str) -> str:
    def word(w: str) -> str:
        if "-" in w:
            return "-".join(word(p) for p in w.split("-"))
        if re.fullmatch(r"I\d+", w):  # Hyundai i10, i30
            return w.lower()
        # Model codes: digits, two letters, or no vowels (CBF, YZF, GS)
        if w in UPPER_WORDS or len(w) <= 2 or any(c.isdigit() for c in w) or not re.search(r"[AEIOU]", w):
            return w
        return w.capitalize()
    return " ".join(word(w) for w in name.split())


def read_foi(path: str):
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0]
    rows, header_seen = [], False
    for row in ws.iter_rows(values_only=True):
        if not header_seen:
            header_seen = row[1] == "Make/Model Description"
            if header_seen:
                assert [str(c) for c in row[3:3 + len(YEARS)]] == [str(y) for y in YEARS], row
            continue
        desc = (row[1] or "").strip().upper()
        made = int(row[2]) if str(row[2] or "").isdigit() and int(row[2]) > 1900 else None
        rows.append((desc, made, *[int(v or 0) for v in row[3:3 + len(YEARS)]]))
    if not rows:
        sys.exit("No data rows found under a 'Make/Model Description' header")
    return rows


def main():
    foi_path, veh_path = sys.argv[1], sys.argv[2]
    con = duckdb.connect()
    con.execute(f"""create table v as select BodyType body, Make make, GenModel gen, Model model, Fuel fuel, LicenceStatus status,
        coalesce(try_cast("{STOCK_COL}" as bigint), 0) n
        from read_csv('{veh_path}', header=true, all_varchar=true)""")

    # description -> (body, make, gen), choosing the dominant one by stock when
    # a description appears under several body types or fuels.
    exact, loose = {}, {}
    prefix = defaultdict(Counter)
    best_exact, best_loose = {}, {}
    # Fuel isn't part of the match (a model's trims span fuels); it's the
    # dominant fuel of whatever DfT text the description matched.
    fuel_of = defaultdict(Counter)
    for fuel, make, model, n in con.execute(
        "select upper(fuel), make, model, sum(n) from v group by all"
    ).fetchall():
        dm = MAKE_CANON.get(make, make)
        group = FUEL_GROUPS.get(fuel, "Other")
        fuel_of[f"{dm} {model}".upper().strip()][group] += n
        fuel_of[squash(dm + model)][group] += n
    for body, make, gen, model, n in con.execute(
        "select body, make, gen, model, sum(n) from v group by all order by all"  # stable tie-breaks
    ).fetchall():
        key = (body, make, gen)
        dvla_make = MAKE_CANON.get(make, make)  # DVLA spells the make its own way
        d = f"{dvla_make} {model}".upper().strip()
        for table, best, k in ((exact, best_exact, d), (loose, best_loose, squash(dvla_make + model))):
            if n >= best.get(k, -1):
                table[k], best[k] = key, n
        words = d.split()
        for i in range(len(dvla_make.split()) + 1, len(words) + 1):
            prefix[" ".join(words[:i])][key] += n + 1

    def resolve(desc: str):
        if desc in exact:
            return exact[desc]
        if squash(desc) in loose:
            return loose[squash(desc)]
        words = desc.split()
        for i in range(len(words), 1, -1):
            c = prefix.get(" ".join(words[:i]))
            if c:
                key, n = c.most_common(1)[0]
                return key if n / sum(c.values()) >= 0.9 else None
        return None

    def fuel(desc: str) -> str:
        c = fuel_of.get(desc) or fuel_of.get(squash(desc))
        return c.most_common(1)[0][0] if c else "Unknown"

    foi = read_foi(foi_path)
    all_by_year = [sum(r[2 + i] for r in foi) for i in range(len(YEARS))]
    thefts = {c: defaultdict(lambda: [0] * len(YEARS)) for c in CLASSES}
    by_year = {c: [0] * len(YEARS) for c in CLASSES}
    car_fuel_thefts, car_age = Counter(), Counter()
    body_to_class = {body: c for c, (body, _, _) in CLASSES.items()}
    matched_latest, unmatched = 0, Counter()
    for desc, made, *counts in foi:
        key = resolve(desc)
        if key is None:
            unmatched[desc] += counts[-1]
            continue
        matched_latest += counts[-1]
        cls = body_to_class.get(key[0])
        if cls is None:
            continue
        k = model_key(key[1], key[2])
        for i, c in enumerate(counts):
            thefts[cls][k][i] += c
            by_year[cls][i] += c
        if cls == "cars":
            car_fuel_thefts[fuel(desc)] += counts[-1]
            if made is not None:
                age = LATEST - made
                band = next((label for lo, hi, label in AGE_BANDS if lo <= age <= hi), None)
                if band:
                    car_age[band] += counts[-1]

    def row(m):
        return {k: m[k] for k in ("name", "thefts", "previous", "licensed", "per1000")}

    stats = {
        "source": "DVLA FOI FOIR13058 (vehicles recorded as stolen, by make/model and year) ÷ DfT VEH0120 licensed vehicles",
        "year": LATEST,
        "stockQuarter": STOCK_COL,
        "allVehiclesByYear": dict(zip(map(str, YEARS), all_by_year)),
        "matchedShare": round(matched_latest / all_by_year[-1], 3),
    }
    risk_files = {}
    for cls, (body, min_rated, min_table) in CLASSES.items():
        stock, names = Counter(), {}
        for make, gen, n in con.execute(
            f"select make, gen, sum(n) from v where body='{body}' and status='Licensed' group by all order by 3"
        ).fetchall():
            k = model_key(make, gen)
            stock[k] += n
            model = gen[len(make) + 1:] if gen.startswith(make + " ") else gen
            # biggest fleet's spelling wins
            names[k] = NAME_OVERRIDES.get(k) or display(f"{MAKE_CANON.get(make, make)} {model}")
        orphans = sorted(((v[-1], k) for k, v in thefts[cls].items() if not stock.get(k)), reverse=True)
        total_stock = sum(stock.values())
        national = round(1000 * by_year[cls][-1] / total_stock, 2)

        models = []
        for k, n in stock.items():
            # Nothing licensed at Q4, or DfT's catch-all for an unrecorded model.
            if n == 0 or "MODEL MISSING" in k or k.startswith("OTHER "):
                continue
            t = thefts[cls].get(k, [0] * len(YEARS))
            models.append({"key": k, "name": names[k], "thefts": t[-1], "previous": t[-2],
                           "licensed": n, "per1000": round(1000 * t[-1] / n, 2)})

        # Largest fleet first: lookupTheftRisk's fuzzy fallback walks this order.
        risk_files[cls] = {m["key"]: [m["thefts"], m["licensed"]] for m in sorted(
            (m for m in models if m["licensed"] >= min_rated), key=lambda m: -m["licensed"])}

        section = {
            "nationalPer1000": national,
            "byYear": dict(zip(map(str, YEARS), by_year[cls])),
            "licensed": total_stock,
            "ratedModels": len(risk_files[cls]),
            "topByCount": [row(m) for m in sorted(models, key=lambda m: -m["thefts"])[:10]],
            "topByRate": [row(m) for m in sorted(
                (m for m in models if m["licensed"] >= min_table), key=lambda m: -m["per1000"])[:10]],
        }
        if cls == "cars":
            section["leastByRate"] = [row(m) for m in sorted(
                (m for m in models if m["licensed"] >= MIN_LEAST_STOCK), key=lambda m: m["per1000"])[:10]]
            section["risers"] = [row(m) for m in sorted(
                (m for m in models if m["thefts"] >= 150), key=lambda m: m["previous"] - m["thefts"])[:10]]
            fuel_stock = Counter()
            for f, n in con.execute(
                "select upper(fuel), sum(n) from v where body='Cars' and status='Licensed' group by all"
            ).fetchall():
                fuel_stock[FUEL_GROUPS.get(f, "Other")] += n
            section["byFuel"] = sorted(
                ({"fuel": f, "thefts": car_fuel_thefts[f], "licensed": fuel_stock[f],
                  "per1000": round(1000 * car_fuel_thefts[f] / fuel_stock[f], 2)}
                 for f in fuel_stock if f != "Other" and fuel_stock[f] >= 100_000),
                key=lambda r: -r["per1000"])
            section["byAge"] = [{"band": label, "thefts": car_age[label]} for _, _, label in AGE_BANDS]
            if len(sys.argv) > 4:
                files = ", ".join(f"'{f}'" for f in sys.argv[3:5])
                age_stock = Counter()
                for made, n in con.execute(f"""select try_cast(YearManufacture as int), sum(try_cast("{LATEST}" as bigint))
                    from read_csv([{files}], header=true, all_varchar=true, union_by_name=true)
                    where BodyType='Cars' and LicenceStatus='Licensed' group by 1""").fetchall():
                    band = next((label for lo, hi, label in AGE_BANDS if made and lo <= LATEST - made <= hi), None)
                    if band:
                        age_stock[band] += n or 0
                for r in section["byAge"]:
                    r["licensed"] = age_stock[r["band"]]
                    r["per1000"] = round(1000 * r["thefts"] / age_stock[r["band"]], 2)
        stats[cls] = section
        print(f"{cls}: {len(risk_files[cls])} rated; national {national}/1,000; "
              f"{by_year[cls][-1]:,} stolen; orphans {orphans[:5]}")

    for cls, fname in (("cars", "theft-risk.json"), ("vans", "theft-risk-vans.json")):
        lines = [f"  {json.dumps(k)}: {json.dumps(v)}" for k, v in risk_files[cls].items()]
        (DATA / fname).write_text("{\n" + ",\n".join(lines) + "\n}\n")
    (DATA / "theft-stats.json").write_text(json.dumps(stats, indent=2, ensure_ascii=False) + "\n")
    print("largest unmatched descriptions:", unmatched.most_common(15))
    print(f"{matched_latest:,} of {all_by_year[-1]:,} thefts matched ({stats['matchedShare']:.1%})")


if __name__ == "__main__":
    main()
