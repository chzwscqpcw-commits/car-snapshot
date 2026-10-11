#!/usr/bin/env python3
"""
Build mot-pass-rates.json and mot-failure-reasons.json from the DVSA anonymised
MOT bulk data (data.gov.uk). Replaces scripts/process-mot-stats.ts, which split
on commas — the files are pipe-delimited, so it could never have produced the
February 2026 numbers it was credited with. Those turned out to be estimates
(Fiesta 78.2% against a real 66.0%); this is the real-data replacement.

Inputs (download + unzip from
https://www.data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f):
  dft_test_result_YYYY.zip -> test_result.csv
  dft_test_item_YYYY.zip   -> test_item.csv
  lookup.zip               -> item_detail.csv, item_group.csv

Usage:
  python3 -m venv .venv && .venv/bin/pip install duckdb
  .venv/bin/python scripts/process-mot-bulk.py <dir-with-unzipped-csvs> <year>

Definitions:
  - Class 4 (cars, light vans), normal tests (NT) only; retests and appeals
    excluded. Abandoned/aborted tests excluded from the denominator.
  - First-time pass = result P. PRS (fixed during the test) counts as a fail,
    matching the page's "without requiring any repair" wording.
  - Failure areas = DVSA top-level manual sections of F and PRS defects, ranked
    by the share of the model's initial tests that hit each section.

The KEY SET is kept from the existing JSON files on purpose: the site's model
names are curated, and /stats/how-many-left builds its car list from these
keys. DVSA's model naming is fragmented (MERCEDES-BENZ "C"; "CORSA SE
PREMIUM"; "PUMA ST-LINE X MHEV"), so each DVSA model is folded into the
LONGEST site key it extends — trims count, distinct sub-models do not.
"""

import json
import re
import sys
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"

# DVSA make spelling where it differs from the site key.
MAKE_TO_DVSA = {"MERCEDES BENZ": "MERCEDES-BENZ"}

# A DVSA model that extends a site key with one of these next tokens is a
# DIFFERENT model, not a trim (Transit Connect is not a Transit).
DISTINCT_NEXT = {
    "CONNECT", "CUSTOM", "COURIER", "TOURNEO", "AIRCROSS", "PICASSO", "GRAND",
    "CACTUS", "SPORTSVAN", "SV", "PLUS", "C-MAX", "(R60)",
}
# Per-key extras where a single letter means a different car.
DISTINCT_NEXT_BY_KEY = {"FIAT|500": {"L", "X"}}

SECTION_LABELS = {
    "Lamps, reflectors and electrical equipment": "Lighting & electrics",
    "Suspension": "Suspension",
    "Brakes": "Brakes",
    "Tyres": "Tyres",
    "Visibility": "Windscreen & wipers",
    "Body, chassis, structure": "Body & structure",
    "Noise, emissions and leaks": "Emissions & leaks",
    "Steering": "Steering",
    "Seat belts and supplementary restraint systems": "Seat belts & airbags",
    "Road Wheels": "Wheels",
    "Identification of the vehicle": "Number plates & VIN",
}

TOP_REASONS = 5
# Below this a model's rate is noise (Tesla Model Y had 277 tests in 2023).
MIN_TESTS = 1000


def belongs(dvsa_model: str, key_model: str, key: str) -> bool:
    d = dvsa_model
    # Mercedes "A CLASS" keys: DVSA uses "A", "A-CLASS", "A 180 AMG LINE" and
    # "A180".
    m = re.fullmatch(r"([A-Z]+) CLASS", key_model)
    if m:
        base = m.group(1)
        return d in (base, f"{base}-CLASS", f"{base} CLASS") or bool(
            re.match(rf"{base}(-CLASS)? ?\d", d)
        )
    # BMW "3 SERIES" keys: DVSA also records the engine code — "320D", "318I SE".
    m = re.fullmatch(r"(\d) SERIES", key_model)
    if m and key.startswith("BMW|") and re.match(rf"{m.group(1)}\d\d([A-Z]|\s|$)", d):
        return True
    for form in (key_model, key_model.replace("-", " ")):
        cand = d if form == key_model else d.replace("-", " ")
        if cand == form:
            return True
        if cand.startswith(form + " "):
            nxt = d[len(form):].strip().split(" ")[0]
            if nxt in DISTINCT_NEXT or nxt in DISTINCT_NEXT_BY_KEY.get(key, set()):
                return False
            return True
    return False


def build_mapping(con, keys):
    """DVSA (make, model) -> site key, longest matching key wins."""
    by_make = {}
    for k in keys:
        mk, md = k.split("|")
        by_make.setdefault(MAKE_TO_DVSA.get(mk, mk), []).append((k, md))
    rows = con.execute(
        "select distinct make, model from r where cls = 4 and test_type = 'NT'"
    ).fetchall()
    mapping = []
    for make, model in rows:
        if make not in by_make or model is None:
            continue
        hits = [(k, md) for k, md in by_make[make] if belongs(model, md, k)]
        if hits:
            k, _ = max(hits, key=lambda h: len(h[1]))
            mapping.append((make, model, k))
    con.execute("create or replace table keymap (make varchar, model varchar, key varchar)")
    con.executemany("insert into keymap values (?, ?, ?)", mapping)


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: process-mot-bulk.py <csv-dir> <year>")
    src, year = Path(sys.argv[1]), sys.argv[2]
    con = duckdb.connect()
    csv = "delim='|', header=true, all_varchar=true, quote='', ignore_errors=true"

    con.execute(f"""
      create table r as select test_id, test_class_id::int cls, test_type,
        test_result, upper(trim(make)) make, upper(trim(model)) model
      from read_csv('{src / "test_result.csv"}', {csv})""")

    pass_keys = list(json.loads((DATA / "mot-pass-rates.json").read_text()))
    fail_keys = list(json.loads((DATA / "mot-failure-reasons.json").read_text()))
    build_mapping(con, sorted(set(pass_keys) | set(fail_keys)))

    con.execute("""
      create table t as select r.test_id, km.key, r.test_result = 'P' as passed
      from r join keymap km using (make, model)
      where r.cls = 4 and r.test_type = 'NT' and r.test_result in ('P', 'F', 'PRS')""")

    national = con.execute("""
      select count(*), 100.0 * sum(case when test_result = 'P' then 1 else 0 end) / count(*)
      from r where cls = 4 and test_type = 'NT' and test_result in ('P', 'F', 'PRS')""").fetchone()

    rates = {
        k: [n, round(rate, 1)]
        for k, n, rate in con.execute(
            "select key, count(*), 100.0 * avg(passed::int) from t group by key").fetchall()
    }
    out_pass = {k: rates[k] for k in pass_keys if k in rates and rates[k][0] >= MIN_TESTS}

    con.execute(f"""
      create table it as select test_id, rfr_id::int rfr_id
      from read_csv('{src / "test_item.csv"}', {csv}) where rfr_type_code in ('F', 'P')""")
    con.execute(f"""
      create table d as select rfr_id::int rfr_id, test_item_set_section_id::int sec
      from read_csv('{src / "item_detail.csv"}', {csv}) where test_class_id = '4'""")
    con.execute(f"""
      create table g as select test_item_id::int id, item_name
      from read_csv('{src / "item_group.csv"}', {csv})
      where test_class_id = '4' and parent_id = '0'""")
    sec_rows = con.execute("""
      select t.key, g.item_name, count(distinct t.test_id) n
      from it join t using (test_id) join d using (rfr_id) join g on g.id = d.sec
      group by all""").fetchall()
    per_key = {}
    for k, name, n in sec_rows:
        label = SECTION_LABELS.get(name)
        if label:
            per_key.setdefault(k, {})[label] = per_key.get(k, {}).get(label, 0) + n
    out_fail = {
        k: [lab for lab, _ in sorted(per_key[k].items(), key=lambda x: -x[1])[:TOP_REASONS]]
        for k in fail_keys
        if k in per_key and rates.get(k, [0])[0] >= MIN_TESTS
    }

    (DATA / "mot-pass-rates.json").write_text(json.dumps(out_pass, indent=2) + "\n")
    (DATA / "mot-failure-reasons.json").write_text(json.dumps(out_fail, indent=2) + "\n")

    print(f"{year}: {national[0]:,} initial class-4 tests, national first-time pass {national[1]:.2f}%")
    print(f"pass rates: {len(out_pass)}/{len(pass_keys)} keys; failure areas: {len(out_fail)}/{len(fail_keys)} keys")
    for label, keys in (("pass", pass_keys), ("failure", fail_keys)):
        missing = [k for k in keys if k not in (out_pass if label == "pass" else out_fail)]
        if missing:
            print(f"  no {label} data: {missing}")
    folded = con.execute("""
      select key, count(*) variants, string_agg(model, ', ' order by model) from keymap
      group by key having count(*) > 1 order by variants desc""").fetchall()
    print(f"keys with folded DVSA variants: {len(folded)}")


if __name__ == "__main__":
    main()
