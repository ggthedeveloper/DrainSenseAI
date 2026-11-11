"""Build a provisional rainfall/Sentinel-1 catalogue from Phase 1 data.

This is metadata/event-catalogue work only. It downloads no SAR imagery and
trains no models. It reads staged IMERG granules, queries ASF's public metadata
search API, and writes reproducible CSV outputs under reports/.
"""

from __future__ import annotations

import csv
import hashlib
import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import requests
from netCDF4 import Dataset
from pyproj import Transformer
from shapely.geometry import box, shape
from shapely.ops import transform
from shapely.wkt import dumps


ROOT = Path(__file__).resolve().parents[1]
BOUNDARY = ROOT / "data/metadata/study_area.geojson"
IMERG_TIMES = ROOT / "reports/imerg_file_times.csv"
OUT_DIR = ROOT / "reports"
ASF_URL = "https://api.daac.asf.alaska.edu/services/search/param"
WET_RATE_THRESHOLD_MM_HR = 0.1
DRY_GAP_HOURS = (3, 6)
SAR_PRE_WINDOW_DAYS = 36
SAR_POST_WINDOW_DAYS = 14


def read_boundary():
    fc = json.loads(BOUNDARY.read_text(encoding="utf-8"))
    return shape(fc["features"][0]["geometry"])


def rainfall_cell_weights(polygon):
    sample = ROOT / "data/raw/rainfall/_stage/2015/20150101_00.nc"
    to_metric = Transformer.from_crs("EPSG:4326", "EPSG:32644", always_xy=True).transform
    with Dataset(sample) as ds:
        lats = np.asarray(ds.variables["lat"][:], dtype=float)
        lons = np.asarray(ds.variables["lon"][:], dtype=float)
    weights = []
    for lon_idx, lon in enumerate(lons):
        for lat_idx, lat in enumerate(lats):
            cell = box(lon - 0.05, lat - 0.05, lon + 0.05, lat + 0.05)
            overlap = polygon.intersection(cell)
            if overlap.is_empty:
                continue
            area_m2 = transform(to_metric, overlap).area
            if area_m2 > 0:
                weights.append((lon_idx, lat_idx, area_m2))
    total = sum(x[2] for x in weights)
    if not weights or total <= 0:
        raise RuntimeError("No IMERG grid cells intersect the study polygon")
    return [(i, j, area / total) for i, j, area in weights]


def read_rainfall_series(weights):
    with IMERG_TIMES.open(encoding="utf-8-sig", newline="") as f:
        granules = list(csv.DictReader(f))
    cache = OUT_DIR / "imerg_study_area_series_partial.csv"
    cache_meta = OUT_DIR / "imerg_study_area_series_partial.meta.json"
    weight_key = json.dumps([(i, j, round(w, 15)) for i, j, w in weights], separators=(",", ":"))
    weight_signature = hashlib.sha256(weight_key.encode("utf-8")).hexdigest()
    if cache.exists() and cache_meta.exists():
        meta = json.loads(cache_meta.read_text(encoding="utf-8"))
        with cache.open(encoding="utf-8-sig", newline="") as f:
            cached = list(csv.DictReader(f))
        cached_paths = {r["granule_path"] for r in cached if r["granule_path"]}
        manifest_paths = {r["relative_path"] for r in granules}
        if meta.get("weight_signature") == weight_signature and cached_paths == manifest_paths and len(cached) > 0:
            timeline = [datetime.fromisoformat(r["time_utc"]) for r in cached]
            rates = [None if r["area_weighted_rain_rate_mm_hr"] == "" else float(r["area_weighted_rain_rate_mm_hr"]) for r in cached]
            source_files = {datetime.fromisoformat(r["time_utc"]): r["granule_path"] for r in cached if r["granule_path"]}
            print(f"Using cached study-area rainfall series: {len(cached)} timestamps")
            return timeline, rates, source_files
    series = {}
    source_files = {}
    missing_value = -9999.9
    for row in granules:
        t = datetime.fromisoformat(row["granule_start_utc"])
        path = ROOT / row["relative_path"]
        with Dataset(path) as ds:
            var = ds.variables["precipitation"]
            fill = float(getattr(var, "CodeMissingValue", missing_value))
            arr = np.asarray(var[0, :, :], dtype=float)
        vals = np.asarray([arr[i, j] for i, j, _ in weights], dtype=float)
        w = np.asarray([weight for _, _, weight in weights], dtype=float)
        invalid = (~np.isfinite(vals)) | np.isclose(vals, fill)
        if invalid.any():
            series[t] = None
        else:
            series[t] = float(np.dot(vals, w))
        source_files[t] = path.relative_to(ROOT).as_posix()

    first, last = min(series), max(series)
    timeline = []
    t = first
    while t <= last:
        timeline.append(t)
        t += timedelta(minutes=30)
    rates = [series.get(t) for t in timeline]
    with cache.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["time_utc", "area_weighted_rain_rate_mm_hr", "granule_path", "missing_interval"])
        for t, rate in zip(timeline, rates):
            w.writerow([t.isoformat(), "" if rate is None else rate, source_files.get(t, ""), rate is None])
    cache_meta.write_text(
        json.dumps({"weight_signature": weight_signature, "cell_weights": weights, "source_granule_count": len(granules)}, indent=2),
        encoding="utf-8",
    )
    return timeline, rates, source_files


def rolling_max_mm(rates, window_bins):
    if len(rates) < window_bins:
        return ""
    values = np.asarray(rates, dtype=float) * 0.5
    return float(max(values[i : i + window_bins].sum() for i in range(len(values) - window_bins + 1)))


def find_events(timeline, rates, dry_gap_hours, threshold):
    gap_bins = int(round(dry_gap_hours * 2))
    events = []
    left = 0
    while left < len(rates):
        while left < len(rates) and rates[left] is None:
            left += 1
        if left >= len(rates):
            break
        right = left
        while right + 1 < len(rates) and rates[right + 1] is not None:
            right += 1
        wet = [i for i in range(left, right + 1) if rates[i] >= threshold]
        groups = []
        current = []
        for idx in wet:
            if current and idx - current[-1] > gap_bins:
                groups.append(current)
                current = []
            current.append(idx)
        if current:
            groups.append(current)
        for group in groups:
            start_idx, end_idx = group[0], group[-1]
            sub = [float(x) for x in rates[start_idx : end_idx + 1]]
            depth = sum(max(x, 0) * 0.5 for x in sub)
            duration_h = (end_idx - start_idx + 1) * 0.5
            antecedent = {}
            for hours in (24, 72):
                bins = hours * 2
                a, b = start_idx - bins, start_idx
                if a >= 0 and all(x is not None for x in rates[a:b]):
                    antecedent[hours] = sum(max(float(x), 0) * 0.5 for x in rates[a:b])
                else:
                    antecedent[hours] = ""
            concentration = rolling_max_mm(sub, 2)
            events.append(
                {
                    "event_start_utc": timeline[start_idx],
                    "event_end_utc": timeline[end_idx] + timedelta(minutes=30),
                    "rain_total_mm": depth,
                    "peak_intensity_mm_hr": max(sub),
                    "mean_intensity_mm_hr": depth / duration_h if duration_h else 0,
                    "duration_hours": duration_h,
                    "max_1h_mm": rolling_max_mm(sub, 2),
                    "max_3h_mm": rolling_max_mm(sub, 6),
                    "max_6h_mm": rolling_max_mm(sub, 12),
                    "antecedent_24h_mm": antecedent[24],
                    "antecedent_72h_mm": antecedent[72],
                    "rainfall_concentration_max_1h_fraction": concentration / depth if depth > 0 and concentration != "" else "",
                    "left_censored_by_missing_interval": start_idx == left and left > 0,
                    "right_censored_by_missing_interval": end_idx == right and right < len(rates) - 1,
                    "first_granule_start_utc": timeline[left],
                    "last_granule_start_utc": timeline[right],
                }
            )
        left = right + 1
    return events


def query_sentinel1(polygon):
    now = datetime.now(timezone.utc)
    params = {
        "dataset": "SENTINEL-1",
        "beamMode": "IW",
        "processingLevel": "GRD_HD,GRD_MD",
        "intersectsWith": dumps(polygon, rounding_precision=6),
        "start": "2014-01-01T00:00:00Z",
        "end": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "output": "geojson",
        "maxResults": 1000,
    }
    response = requests.get(ASF_URL, params=params, timeout=90)
    response.raise_for_status()
    data = response.json()
    if data.get("type") != "FeatureCollection":
        raise RuntimeError("ASF search response was not a GeoJSON FeatureCollection")
    return data.get("features", [])


def write_sar_inventory(features):
    fields = [
        "sceneName", "startTime", "stopTime", "platform", "processingLevel", "beamModeType",
        "polarization", "flightDirection", "pathNumber", "frameNumber", "orbit", "fileID",
        "bytes", "url", "browse",
    ]
    rows = []
    for f in features:
        p = f.get("properties", {})
        rows.append({k: p.get(k, "") for k in fields})
    path = OUT_DIR / "sentinel1_acquisition_inventory.csv"
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(sorted(rows, key=lambda r: r["startTime"]))
    return rows


def acquisition_records(rows):
    by_key = {}
    for row in rows:
        key = (row["startTime"], row["pathNumber"], row["flightDirection"], row["polarization"], row["processingLevel"])
        current = by_key.get(key)
        if current is None:
            by_key[key] = {**row, "sceneNames": [row["sceneName"]]}
        else:
            current["sceneNames"].append(row["sceneName"])
    records = list(by_key.values())
    for r in records:
        r["time"] = datetime.fromisoformat(r["startTime"].replace("Z", "+00:00"))
    return sorted(records, key=lambda r: r["time"])


def match_sar(event, acquisitions):
    start = event["event_start_utc"]
    end = event["event_end_utc"]
    pre = [x for x in acquisitions if start - timedelta(days=SAR_PRE_WINDOW_DAYS) <= x["time"] < start]
    post = [x for x in acquisitions if end < x["time"] <= end + timedelta(days=SAR_POST_WINDOW_DAYS)]
    pairs = []
    for a in pre:
        for b in post:
            if (a["pathNumber"], a["flightDirection"], a["polarization"], a["processingLevel"]) == (
                b["pathNumber"], b["flightDirection"], b["polarization"], b["processingLevel"]
            ):
                pairs.append((a, b))
    if not pairs:
        return {"sar_pair_candidate": "No", "pre_sar_start_utc": "", "post_sar_start_utc": "", "sar_path_number": "", "sar_flight_direction": "", "pre_scene_names": "", "post_scene_names": "", "pre_lag_days": "", "post_lag_days": "", "sar_pair_note": "No same-path, same-direction, same-polarization acquisition pair found within pre/post windows; inventory is metadata only."}
    a, b = min(pairs, key=lambda pair: (abs((start - pair[0]["time"]).total_seconds()) + abs((pair[1]["time"] - end).total_seconds())))
    return {
        "sar_pair_candidate": "Yes; metadata only",
        "pre_sar_start_utc": a["startTime"],
        "post_sar_start_utc": b["startTime"],
        "sar_path_number": a["pathNumber"],
        "sar_flight_direction": a["flightDirection"],
        "pre_scene_names": ";".join(a["sceneNames"]),
        "post_scene_names": ";".join(b["sceneNames"]),
        "pre_lag_days": round((start - a["time"]).total_seconds() / 86400, 3),
        "post_lag_days": round((b["time"] - end).total_seconds() / 86400, 3),
        "sar_pair_note": "Candidate pair only; no SAR image downloaded, processed, or validated.",
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    polygon = read_boundary()
    weights = rainfall_cell_weights(polygon)
    timeline, rates, _ = read_rainfall_series(weights)
    features = query_sentinel1(polygon)
    rows = write_sar_inventory(features)
    acquisitions = acquisition_records(rows)

    sensitivity_rows = []
    primary = []
    for threshold in (0.1, 0.5):
        for gap in DRY_GAP_HOURS:
            events = find_events(timeline, rates, gap, threshold)
            sensitivity_rows.append(
                {
                    "wet_rate_threshold_mm_hr": threshold,
                    "dry_gap_hours": gap,
                    "event_count": len(events),
                    "left_censored_count": sum(bool(e["left_censored_by_missing_interval"]) for e in events),
                    "right_censored_count": sum(bool(e["right_censored_by_missing_interval"]) for e in events),
                    "series_start_utc": timeline[0].isoformat(),
                    "series_end_utc": timeline[-1].isoformat(),
                    "note": "Partial 2015 snapshot; missing intervals split segments; no values imputed; no precipitation-quality filter applied.",
                }
            )
            if threshold == WET_RATE_THRESHOLD_MM_HR and gap == 3:
                primary = events

    with (OUT_DIR / "rainfall_event_sensitivity_partial.csv").open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(sensitivity_rows[0]))
        w.writeheader()
        w.writerows(sensitivity_rows)

    event_fields = ["event_id", "wet_rate_threshold_mm_hr", "dry_gap_hours"] + list(primary[0].keys()) if primary else ["event_id", "wet_rate_threshold_mm_hr", "dry_gap_hours"]
    for i, event in enumerate(primary, 1):
        event["event_id"] = f"IM2015_3H_{i:04d}"
        event["wet_rate_threshold_mm_hr"] = WET_RATE_THRESHOLD_MM_HR
        event["dry_gap_hours"] = 3
        for k, v in list(event.items()):
            if isinstance(v, datetime):
                event[k] = v.isoformat()
        event.update(match_sar({"event_start_utc": datetime.fromisoformat(event["event_start_utc"]), "event_end_utc": datetime.fromisoformat(event["event_end_utc"])}, acquisitions))
    pair_fields = list(match_sar({"event_start_utc": timeline[0], "event_end_utc": timeline[0]}, acquisitions).keys())
    catalogue_fields = event_fields + pair_fields
    with (OUT_DIR / "satellite_event_catalogue_partial.csv").open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=catalogue_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(primary)
    with (OUT_DIR / "rainfall_events_partial_2015.csv").open("w", encoding="utf-8-sig", newline="") as f:
        fields = event_fields
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(primary)

    # The redesigned plan names September 2024 as a first case-study candidate.
    # Preserve it as a plan candidate until matching rainfall verifies timing.
    sep = [x for x in rows if x["startTime"].startswith("2024-09-") and str(x["pathNumber"]) == "92" and x["flightDirection"] == "DESCENDING"]
    by_day = {}
    for x in sep:
        by_day.setdefault(x["startTime"][:10], x)
    print("September 2024 same-track SAR metadata:", {k: v.get("startTime", "") for k, v in by_day.items()})
    candidate = {"event_id": "PLAN_2024_09", "catalogue_record_type": "plan-proposed case-study candidate", "event_status": "rainfall not locally available; event timing unverified", "rainfall_start_date": "2024-09-01", "rainfall_end_date": "2024-09-13", "pre_image_candidate": by_day.get("2024-09-01", {}).get("startTime", ""), "post_image_candidate": by_day.get("2024-09-13", {}).get("startTime", ""), "additional_post_candidate": by_day.get("2024-09-25", {}).get("startTime", ""), "orbit_track": "92", "flight_direction": "DESCENDING", "image_status": "ASF metadata only; not downloaded or processed", "note": "1 Sep cannot be called pre-event until local rainfall onset is verified; 13 Sep is the plan-specified post-event acquisition date; 25 Sep is a later candidate observation."}
    cand_path = OUT_DIR / "sentinel1_2024_case_candidate.csv"
    with cand_path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(candidate))
        w.writeheader(); w.writerow(candidate)

    matched = sum(r.get("sar_pair_candidate", "") != "No" for r in primary)
    years = Counter(r["startTime"][:4] for r in rows)
    print("study_cell_weights", weights)
    print("imerg_timestamps", len(timeline) - sum(x is None for x in rates), "missing", sum(x is None for x in rates), "rain_events_primary", len(primary), "sar_pairs", matched)
    print("asf_granules", len(rows), "acquisitions", len(acquisitions), "years", dict(sorted(years.items())))
    print("outputs: reports/sentinel1_acquisition_inventory.csv, reports/rainfall_events_partial_2015.csv, reports/rainfall_event_sensitivity_partial.csv, reports/satellite_event_catalogue_partial.csv, reports/sentinel1_2024_case_candidate.csv")


if __name__ == "__main__":
    main()
