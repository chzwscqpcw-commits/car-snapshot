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

Usage:
  python3 -m venv .venv && .venv/bin/pip install duckdb openpyxl
  .venv/bin/python scripts/process-theft-foi.py <FOIR13058.xlsx> <df_VEH0120_UK.csv>

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
        if w in UPPER_WORDS or len(w) <= 2 or any(c.isdigit() for c in w):
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
        rows.append((desc, *[int(v or 0) for v in row[3:3 + len(YEARS)]]))
    if not rows:
        sys.exit("No data rows found under a 'Make/Model Description' header")
    return rows


def main():
    foi_path, veh_path = sys.argv[1], sys.argv[2]
    con = duckdb.connect()
    con.execute(f"""create table v as select BodyType body, Make make, GenModel gen, Model model, LicenceStatus status,
        coalesce(try_cast("{STOCK_COL}" as bigint), 0) n
        from read_csv('{veh_path}', header=true, all_varchar=true)""")

    # description -> (body, make, gen), choosing the dominant one by stock when
    # a description appears under several body types or fuels.
    exact, loose = {}, {}
    prefix = defaultdict(Counter)
    best_exact, best_loose = {}, {}
    for body, make, gen, model, n in con.execute(
        "select body, make, gen, model, sum(n) from v group by all"
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

    foi = read_foi(foi_path)
    all_by_year = [sum(r[1 + i] for r in foi) for i in range(len(YEARS))]
    cars = defaultdict(lambda: [0] * len(YEARS))
    cars_by_year = [0] * len(YEARS)
    matched_latest, unmatched = 0, Counter()
    for desc, *counts in foi:
        key = resolve(desc)
        if key is None:
            unmatched[desc] += counts[-1]
            continue
        matched_latest += counts[-1]
        if key[0] != "Cars":
            continue
        k = model_key(key[1], key[2])
        for i, c in enumerate(counts):
            cars[k][i] += c
            cars_by_year[i] += c

    stock, names = Counter(), {}
    for make, gen, n in con.execute(
        "select make, gen, sum(n) from v where body='Cars' and status='Licensed' group by all order by 3"
    ).fetchall():
        k = model_key(make, gen)
        stock[k] += n
        model = gen[len(make) + 1:] if gen.startswith(make + " ") else gen
        names[k] = display(f"{MAKE_CANON.get(make, make)} {model}")  # biggest fleet's spelling wins
    orphans = sorted(((sum(v[-1:]), k) for k, v in cars.items() if not stock.get(k)), reverse=True)
    total_stock = sum(stock.values())
    national = round(1000 * cars_by_year[-1] / total_stock, 2)

    models = []
    for k, n in stock.items():
        # No cars left at Q4, or DfT's catch-all for an unrecorded model.
        if n == 0 or "MODEL MISSING" in k or k.startswith("OTHER "):
            continue
        thefts = cars.get(k, [0] * len(YEARS))
        models.append({
            "key": k,
            "name": names[k],
            "thefts": thefts[-1],
            "previous": thefts[-2],
            "licensed": n,
            "per1000": round(1000 * thefts[-1] / n, 2),
        })

    # Largest fleet first: lookupTheftRisk's fuzzy fallback walks this order.
    risk = {m["key"]: [m["thefts"], m["licensed"]] for m in sorted(
        (m for m in models if m["licensed"] >= MIN_RATED_STOCK), key=lambda m: -m["licensed"])}

    def row(m):
        return {k: m[k] for k in ("name", "thefts", "previous", "licensed", "per1000")}

    stats = {
        "source": "DVLA FOI FOIR13058 (vehicles recorded as stolen, by make/model and year) ÷ DfT VEH0120 licensed cars",
        "year": LATEST,
        "stockQuarter": STOCK_COL,
        "nationalPer1000": national,
        "allVehiclesByYear": dict(zip(map(str, YEARS), all_by_year)),
        "carsByYear": dict(zip(map(str, YEARS), cars_by_year)),
        "matchedShare": round(matched_latest / all_by_year[-1], 3),
        "licensedCars": total_stock,
        "topByCount": [row(m) for m in sorted(models, key=lambda m: -m["thefts"])[:10]],
        "topByRate": [row(m) for m in sorted(
            (m for m in models if m["licensed"] >= MIN_TABLE_STOCK), key=lambda m: -m["per1000"])[:10]],
    }

    lines = [f"  {json.dumps(k)}: {json.dumps(v)}" for k, v in risk.items()]
    (DATA / "theft-risk.json").write_text("{\n" + ",\n".join(lines) + "\n}\n")
    (DATA / "theft-stats.json").write_text(json.dumps(stats, indent=2, ensure_ascii=False) + "\n")
    print("thefts on models with no licensed stock:", orphans[:10])
    print("largest unmatched descriptions:", unmatched.most_common(15))
    print(f"{len(risk)} rated models; national {national}/1,000; "
          f"{cars_by_year[-1]:,} cars of {all_by_year[-1]:,} thefts ({stats['matchedShare']:.1%} matched)")


if __name__ == "__main__":
    main()
