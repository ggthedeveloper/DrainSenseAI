"""Extract 2025 IMERG Final half-hourly values for the study-area cells.

This uses the public NSF NCAR GDEX OPeNDAP mirror and requests only the
small IMERG pixel window intersecting the local study-area polygon. It does
not download the full global HDF5 granules.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import requests
from netCDF4 import Dataset


ROOT = Path(__file__).resolve().parents[1]
SAMPLE = ROOT / "data" / "raw" / "rainfall" / "_stage" / "2015" / "20150101_00.nc"
WEIGHTS_META = ROOT / "reports" / "imerg_study_area_series_partial.meta.json"
OUT = ROOT / "data" / "interim" / "phase2" / "imerg_2025_study_area_halfhourly.csv"
META = ROOT / "data" / "interim" / "phase2" / "imerg_2025_study_area_halfhourly.meta.json"
BASE_DATA = "https://data.gdex.ucar.edu/d731000/gpm_3imerghh_v07"
BASE_DAP = "https://tds.gdex.ucar.edu/thredds/dodsC/files/d731000/gpm_3imerghh_v07"
FILL_VALUE = -9999.9
START = datetime(2025, 1, 1, tzinfo=timezone.utc)
AVAILABLE_END = datetime(2025, 10, 1, tzinfo=timezone.utc)  # GDEX mirror last file: 2025-09-30 23:30 UTC
EXPECTED = int((AVAILABLE_END - START).total_seconds() // 1800)


def get_cells() -> list[dict]:
    meta = json.loads(WEIGHTS_META.read_text(encoding="utf-8"))
    with Dataset(SAMPLE) as ds:
        lons = np.asarray(ds.variables["lon"][:], dtype=float)
        lats = np.asarray(ds.variables["lat"][:], dtype=float)
    cells = []
    for local_lon_i, local_lat_i, weight in meta["cell_weights"]:
        lon = float(lons[int(local_lon_i)])
        lat = float(lats[int(local_lat_i)])
        # IMERG global grid centers begin at -179.95 longitude, -89.95 latitude.
        gi = int(round((lon + 179.95) / 0.1))
        gj = int(round((lat + 89.95) / 0.1))
        cells.append({"lon": lon, "lat": lat, "lon_i": gi, "lat_i": gj, "weight": float(weight)})
    return cells


def granule_url(t: datetime) -> tuple[str, str]:
    end = t + timedelta(minutes=29, seconds=59)
    day_dir = t.strftime("%Y/%m/%d")
    elapsed = t.hour * 60 + t.minute
    name = (
        f"3B-HHR.MS.MRG.3IMERG.{t:%Y%m%d}-S{t:%H%M%S}-E{end:%H%M%S}."
        f"{elapsed:04d}.V07B.HDF5"
    )
    return f"{BASE_DAP}/{day_dir}/{name}.ascii", f"{BASE_DATA}/{day_dir}/{name}"


def parse_values(body: str, cells: list[dict]) -> dict:
    after = body.split("---------------------------------------------", 1)
    if len(after) != 2:
        raise ValueError("OPeNDAP response has no data separator")
    rows: dict[int, list[float]] = {}
    for line in after[1].splitlines():
        m = re.match(r"\[(\d+)\]\[(\d+)\],\s*(.*)$", line.strip())
        if not m:
            continue
        row_i = int(m.group(2))
        vals = [float(x.strip()) for x in m.group(3).split(",") if x.strip()]
        rows[row_i] = vals
    if len(rows) < 2 or any(len(rows.get(i, [])) < 2 for i in (0, 1)):
        raise ValueError(f"Expected 2x2 cell window, got rows={rows}")
    result = {}
    for cell in cells:
        key = f"rate_{cell['lon']:.2f}_{cell['lat']:.2f}_mm_hr"
        result[key] = rows[cell["lon_i"] - min(c["lon_i"] for c in cells)][
            cell["lat_i"] - min(c["lat_i"] for c in cells)
        ]
    return result


def fetch(t: datetime, cells: list[dict], timeout: int) -> dict:
    lon0, lon1 = min(c["lon_i"] for c in cells), max(c["lon_i"] for c in cells)
    lat0, lat1 = min(c["lat_i"] for c in cells), max(c["lat_i"] for c in cells)
    dap_url, source_url = granule_url(t)
    query = f"/Grid/precipitation[0][{lon0}:{lon1}][{lat0}:{lat1}]"
    last_error = ""
    for attempt in range(5):
        try:
            response = requests.get(dap_url + "?" + query, timeout=(15, timeout))
            if response.status_code == 404:
                return {"time_utc": t.isoformat().replace("+00:00", "Z"), "download_status": "not_found", "source_url": source_url, "error": "GDEX granule not found"}
            response.raise_for_status()
            values = parse_values(response.text, cells)
            invalid = any(not math.isfinite(v) or math.isclose(v, FILL_VALUE, abs_tol=0.1) for v in values.values())
            weighted_rate = ""
            if not invalid:
                by_key = {f"rate_{c['lon']:.2f}_{c['lat']:.2f}_mm_hr": c["weight"] for c in cells}
                weighted_rate = sum(values[k] * by_key[k] for k in values)
            row = {"time_utc": t.isoformat().replace("+00:00", "Z"), **values}
            row.update({
                "area_weighted_rain_rate_mm_hr": weighted_rate,
                "missing_value_in_any_weighted_cell": invalid,
                "download_status": "ok",
                "source_url": source_url,
                "error": "",
            })
            return row
        except Exception as e:  # retries preserve a row-level audit trail
            last_error = f"{type(e).__name__}: {e}"
            if attempt < 4:
                time.sleep(min(2 ** attempt, 16))
    return {"time_utc": t.isoformat().replace("+00:00", "Z"), "download_status": "error", "source_url": source_url, "error": last_error}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, default=16)
    parser.add_argument("--timeout", type=int, default=75)
    args = parser.parse_args()
    if not (1 <= args.workers <= 32):
        raise SystemExit("--workers must be between 1 and 32")
    cells = get_cells()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    base_metadata = {
        "product": "GPM IMERG Final half-hourly V07B",
        "source_archive": "NSF NCAR GDEX dataset d731000, OPeNDAP extraction",
        "source_doi": "10.5065/SRTD-0R12",
        "requested_year": 2025,
        "available_start_utc": START.isoformat(),
        "available_end_exclusive_utc": AVAILABLE_END.isoformat(),
        "observed_availability_limit": "GDEX mirror ended at 2025-09-30 23:30 UTC; 2025-10-01 through 2025-12-31 were not available in this mirror at audit time.",
        "expected_half_hour_intervals": EXPECTED,
        "cells": cells,
        "rain_rate_units": "mm/hr",
        "aggregation": "Area-weighted mean over the three existing IMERG cells intersecting the study boundary; any missing weighted cell makes the aggregate missing.",
        "quality_index": "Not retrieved in this extraction; the precipitation-quality-index screening decision remains open.",
        "output_csv": str(OUT.relative_to(ROOT)).replace("\\", "/"),
        "script": "scripts/download_imerg_2025_aoi.py",
        "run_status": "in_progress",
    }
    META.write_text(json.dumps(base_metadata, indent=2), encoding="utf-8")
    fields = [
        "time_utc",
        *[f"rate_{c['lon']:.2f}_{c['lat']:.2f}_mm_hr" for c in cells],
        "area_weighted_rain_rate_mm_hr",
        "missing_value_in_any_weighted_cell",
        "download_status",
        "source_url",
        "error",
    ]
    existing: dict[str, dict] = {}
    if OUT.exists():
        if not META.exists():
            raise FileExistsError(f"Refusing to mix with untracked existing output: {OUT}")
        with OUT.open(encoding="utf-8-sig", newline="") as f:
            for row in csv.DictReader(f):
                if row.get("download_status") == "ok":
                    existing[row["time_utc"]] = row
    times = [START + timedelta(minutes=30 * i) for i in range(EXPECTED)]
    pending = [t for t in times if t.isoformat().replace("+00:00", "Z") not in existing]
    first_write = not OUT.exists()
    if first_write:
        with OUT.open("w", encoding="utf-8", newline="") as f:
            csv.DictWriter(f, fieldnames=fields).writeheader()
    completed = 0
    errors = 0
    with OUT.open("a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(fetch, t, cells, args.timeout): t for t in pending}
            for future in as_completed(futures):
                row = future.result()
                writer.writerow(row)
                completed += 1
                if row.get("download_status") != "ok":
                    errors += 1
                if completed % 100 == 0 or completed == len(pending):
                    f.flush()
                    print(f"completed={completed}/{len(pending)} errors={errors}", flush=True)

    # Deduplicate and sort checkpoints so an interrupted/resumed run is deterministic.
    all_rows: dict[str, dict] = {}
    with OUT.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            if row.get("time_utc"):
                old = all_rows.get(row["time_utc"])
                if old is None or row.get("download_status") == "ok":
                    all_rows[row["time_utc"]] = row
    tmp = OUT.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for key in sorted(all_rows):
            writer.writerow(all_rows[key])
    tmp.replace(OUT)
    ok = sum(r.get("download_status") == "ok" for r in all_rows.values())
    failed = len(all_rows) - ok
    metadata = {**base_metadata, "retrieved_rows_ok": ok, "rows_failed_or_missing": failed, "run_status": "complete" if not failed else "partial"}
    META.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"final_ok={ok} missing_or_failed={failed}")
    print(f"output={OUT}")


if __name__ == "__main__":
    main()
