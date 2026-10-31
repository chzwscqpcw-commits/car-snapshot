#!/usr/bin/env python3
"""
Build src/data/mot-areas.json — MOT testing by POSTCODE AREA — from the DVSA
anonymised MOT bulk data (data.gov.uk). This is what makes each
/mot-prices/[town] page genuinely different: the tests done in that area
last year, its first-time pass rate against the national figure, what fails
there most, how old and how far-driven the cars tested there are, and its
busiest month.

Why postcode area: the GOV.UK "MOT testing data" statistical set
(dvsa-mot-06-mot-test-stations-and-testers.csv) only gives NATIONAL station
and tester counts by financial year — nothing by local authority or
postcode (checked 31 Oct 2026). The anonymised bulk results carry the test
station's `postcode_area` (B, M, LS, …), so that is the finest public grain
for "MOT activity near here". No per-centre data exists in either set, so
these pages never claim a centre count for a town.

Inputs (download + unzip from
https://www.data.gov.uk/dataset/e3939ef8-30c7-4ca8-9c7c-ad9475cc9b2f):
  MOT testing data results (YYYY).zip      -> test_result_YYYYMM.csv ×12
  MOT testing data failure item (YYYY).zip -> test_item_YYYYMM.csv ×12
  lookup.zip                               -> item_detail.csv, item_group.csv
(2024 and later are comma-delimited with a header; 2023 was pipe-delimited —
process-mot-bulk.py reads that layout.) The 2024 files repeat ~60% of their
rows verbatim (checked 31 Oct 2026: January has 4.88M class-4 rows for
2.99M distinct test ids), so every read de-duplicates on test id.

Usage:
  python3 -m venv .venv && .venv/bin/pip install duckdb
  .venv/bin/python scripts/process-mot-areas.py <results-dir> <items-dir> <lookup-dir> <year>

~12 GB of CSV; takes a few minutes and a few GB of temp space. This is an
ANNUAL drop (each year is published the following May), far too large for
the weekly GitHub refresh job (20-minute step caps), so it is run by hand
once a year like process-mot-bulk.py. check-freshness.ts flags the output
when it goes stale.

Definitions (match process-mot-bulk.py):
  - Class 4, normal tests (NT) only; retests and appeals excluded.
  - First-time pass = result P. PRS counts as a fail.
  - Failure areas = DVSA top-level manual sections of F and PRS defects,
    ranked by the share of the area's initial tests that hit each.
  - "Dangerous" = an initial test with at least one F item carrying the
    dangerous mark (the column holds 'D').
"""

import importlib.util
import json
import sys
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"

# Reuse the section labels process-mot-bulk.py already uses so the per-model
# and per-area failure areas read the same.
_spec = importlib.util.spec_from_file_location("pmb", ROOT / "scripts" / "process-mot-bulk.py")
_pmb = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_pmb)
SECTION_LABELS = _pmb.SECTION_LABELS

TOP_MAKES = 5
TOP_SECTIONS = 5
MIN_TESTS = 20_000  # an area with fewer initial tests than this is left out


def main():
    if len(sys.argv) != 5:
        sys.exit("usage: process-mot-areas.py <results-dir> <items-dir> <lookup-dir> <year>")
    results, items, lookup = (Path(a) for a in sys.argv[1:4])
    year = int(sys.argv[4])

    con = duckdb.connect()
    con.execute("set preserve_insertion_order = false")
    csv = "header=true, all_varchar=true, ignore_errors=true"
    pipe = "delim='|', header=true, all_varchar=true, quote='', ignore_errors=true"

    con.execute(f"""
      create table r as
      select test_id, upper(trim(postcode_area)) area, test_result,
             try_cast(test_mileage as double) mileage,
             try_cast(test_date as date) test_date,
             try_cast(first_use_date as date) first_use,
             upper(trim(make)) make, upper(trim(fuel_type)) fuel
      from read_csv('{results}/test_result_*.csv', {csv})
      where test_class_id = '4' and test_type = 'NT'
        and test_result in ('P', 'F', 'PRS')
        and postcode_area is not null and trim(postcode_area) <> ''
      qualify row_number() over (partition by test_id order by test_date) = 1""")

    n = con.execute("select count(*) from r").fetchone()[0]
    print(f"{year}: {n:,} initial class-4 tests with a postcode area", file=sys.stderr)

    # Per-area headline figures.
    rows = con.execute("""
      select area, count(*) tests,
             sum(case when test_result = 'P' then 1 else 0 end) passes,
             quantile_cont(mileage, 0.5) mileage_median,
             quantile_cont(datediff('day', first_use, test_date) / 365.25, 0.5) age_median,
             sum(case when fuel = 'EL' then 1 else 0 end) ev,
             sum(case when fuel = 'HY' then 1 else 0 end) hybrid,
             sum(case when fuel = 'DI' then 1 else 0 end) diesel
      from r group by area""").fetchall()
    areas = {}
    for area, tests, passes, mileage, age, ev, hybrid, diesel in rows:
        areas[area] = {
            "tests": tests,
            "passes": passes,
            "mileageMedian": round(mileage) if mileage is not None else None,
            "ageMedian": round(age, 1) if age is not None else None,
            "fuel": {"ev": ev, "hybrid": hybrid, "diesel": diesel},
            "months": [0] * 12,
            "makes": [],
            "sections": [],
            "dangerous": 0,
        }

    for area, month, cnt in con.execute(
        "select area, month(test_date), count(*) from r where test_date is not null group by all"
    ).fetchall():
        if area in areas and month:
            areas[area]["months"][int(month) - 1] = cnt

    for area, make, cnt, rank in con.execute(f"""
      select area, make, cnt, rnk from (
        select area, make, count(*) cnt,
               row_number() over (partition by area order by count(*) desc) rnk
        from r where make is not null and make <> '' group by area, make)
      where rnk <= {TOP_MAKES}""").fetchall():
        if area in areas:
            areas[area]["makes"].append([make, cnt])

    # Failure sections per area, by distinct test.
    con.execute(f"""
      create table it as select distinct test_id, rfr_id::int rfr_id, dangerous_mark
      from read_csv('{items}/test_item_*.csv', {csv}) where rfr_type_code in ('F', 'P')""")
    con.execute(f"""
      create table d as select rfr_id::int rfr_id, test_item_set_section_id::int sec
      from read_csv('{lookup}/item_detail.csv', {pipe}) where test_class_id = '4'""")
    con.execute(f"""
      create table g as select test_item_id::int id, item_name
      from read_csv('{lookup}/item_group.csv', {pipe})
      where test_class_id = '4' and parent_id = '0'""")
    for area, name, cnt in con.execute("""
      select r.area, g.item_name, count(distinct r.test_id)
      from it join r using (test_id) join d using (rfr_id) join g on g.id = d.sec
      group by all""").fetchall():
        label = SECTION_LABELS.get(name)
        if label and area in areas:
            areas[area]["sections"].append([label, cnt])
    for area, cnt in con.execute("""
      select r.area, count(distinct r.test_id) from it join r using (test_id)
      where it.dangerous_mark = 'D' group by all""").fetchall():
        if area in areas:
            areas[area]["dangerous"] = cnt

    for a in areas.values():
        merged = {}
        for label, cnt in a["sections"]:
            merged[label] = merged.get(label, 0) + cnt
        a["sections"] = sorted(merged.items(), key=lambda x: -x[1])[:TOP_SECTIONS]

    kept = {k: v for k, v in sorted(areas.items()) if v["tests"] >= MIN_TESTS}
    dropped = sorted(k for k in areas if k not in kept)

    # National totals, same definitions, for the comparisons on the page.
    total_tests = sum(a["tests"] for a in areas.values())
    total_pass = sum(a["passes"] for a in areas.values())
    nat_mileage, nat_age = con.execute("""
      select quantile_cont(mileage, 0.5),
             quantile_cont(datediff('day', first_use, test_date) / 365.25, 0.5) from r""").fetchone()
    nat_dangerous = con.execute(
        "select count(distinct test_id) from it where dangerous_mark = 'D'").fetchone()[0]
    nat_months = [0] * 12
    for a in areas.values():
        for i, c in enumerate(a["months"]):
            nat_months[i] += c
    nat_sections = {}
    for a in areas.values():
        for label, cnt in a["sections"]:
            nat_sections[label] = nat_sections.get(label, 0) + cnt

    out = {
        "year": year,
        "source": "DVSA anonymised MOT tests and results, data.gov.uk; Class 4 normal tests, first-time result",
        "national": {
            "tests": total_tests,
            "passes": total_pass,
            "mileageMedian": round(nat_mileage),
            "ageMedian": round(nat_age, 1),
            "dangerous": nat_dangerous,
            "months": nat_months,
            "sections": sorted(nat_sections.items(), key=lambda x: -x[1])[:TOP_SECTIONS],
        },
        "areas": kept,
    }
    (DATA / "mot-areas.json").write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"areas kept: {len(kept)}; dropped under {MIN_TESTS:,} tests: {dropped}", file=sys.stderr)
    print(f"national first-time pass {100 * total_pass / total_tests:.2f}% of {total_tests:,}", file=sys.stderr)


if __name__ == "__main__":
    main()
