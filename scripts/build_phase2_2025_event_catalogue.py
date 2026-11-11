"""Build provisional 2025 rainfall events and metadata-only SAR pair candidates."""
from __future__ import annotations

import csv
import json
import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAIN = ROOT / "data" / "interim" / "phase2" / "imerg_2025_study_area_halfhourly.csv"
RAIN_META = RAIN.with_suffix(".meta.json")
SAR = ROOT / "reports" / "sentinel1_acquisition_inventory.csv"
EVENTS_OUT = ROOT / "reports" / "rainfall_events_partial_2025.csv"
SENS_OUT = ROOT / "reports" / "rainfall_event_sensitivity_partial_2025.csv"
PAIRS_OUT = ROOT / "reports" / "satellite_event_catalogue_partial_2025.csv"
META_OUT = ROOT / "reports" / "phase2_2025_catalogue_status.json"
START = datetime(2025, 1, 1, tzinfo=timezone.utc)
END = datetime(2025, 10, 1, tzinfo=timezone.utc)  # Exclusive; GDEX source coverage currently ends 2025-09-30.
STEP = timedelta(minutes=30)


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def read_series() -> tuple[list[datetime], list[float | None], list[dict]]:
    by_time: dict[datetime, dict] = {}
    with RAIN.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            if not row.get("time_utc"):
                continue
            t = datetime.fromisoformat(row["time_utc"].replace("Z", "+00:00"))
            old = by_time.get(t)
            if old is None or row.get("download_status") == "ok":
                by_time[t] = row
    times = []
    t = START
    while t < END:
        times.append(t)
        t += STEP
    rates: list[float | None] = []
    for t in times:
        row = by_time.get(t)
        if row and row.get("download_status") == "ok" and row.get("area_weighted_rain_rate_mm_hr"):
            value = float(row["area_weighted_rain_rate_mm_hr"])
            rates.append(value if math.isfinite(value) else None)
        else:
            rates.append(None)
    return times, rates, [by_time.get(t, {}) for t in times]


def rolling_max_mm(rates: list[float], window_bins: int) -> float | str:
    if len(rates) < window_bins:
        return ""
    return max(sum(max(v, 0) * 0.5 for v in rates[i:i + window_bins]) for i in range(len(rates) - window_bins + 1))


def detect_events(times: list[datetime], rates: list[float | None], threshold: float, dry_gap_hours: float) -> list[dict]:
    gap_bins = int(round(dry_gap_hours * 2))
    out = []
    i = 0
    while i < len(rates):
        while i < len(rates) and rates[i] is None:
            i += 1
        if i >= len(rates):
            break
        seg_start = i
        while i + 1 < len(rates) and rates[i + 1] is not None:
            i += 1
        seg_end = i
        wet = [j for j in range(seg_start, seg_end + 1) if rates[j] is not None and rates[j] >= threshold]
        groups: list[list[int]] = []
        current: list[int] = []
        for j in wet:
            if current and j - current[-1] > gap_bins:
                groups.append(current)
                current = []
            current.append(j)
        if current:
            groups.append(current)
        for group in groups:
            a, b = group[0], group[-1]
            sub = [float(x) for x in rates[a:b + 1] if x is not None]
            depth = sum(max(x, 0) * 0.5 for x in sub)
            duration_h = (b - a + 1) * 0.5
            antecedent = {}
            for hours in (24, 72):
                bins = hours * 2
                lo = a - bins
                if lo >= 0 and all(x is not None for x in rates[lo:a]):
                    antecedent[hours] = sum(max(float(x), 0) * 0.5 for x in rates[lo:a])
                else:
                    antecedent[hours] = ""
            max_1h = rolling_max_mm(sub, 2)
            out.append({
                "event_start_utc": times[a].isoformat().replace("+00:00", "Z"),
                "event_end_utc": (times[b] + STEP).isoformat().replace("+00:00", "Z"),
                "rain_total_mm": depth,
                "peak_intensity_mm_hr": max(sub),
                "mean_intensity_mm_hr": depth / duration_h if duration_h else 0,
                "duration_hours_including_dry_gaps": duration_h,
                "max_rolling_1h_mm": max_1h,
                "max_rolling_3h_mm": rolling_max_mm(sub, 6),
                "max_rolling_6h_mm": rolling_max_mm(sub, 12),
                "antecedent_24h_mm": antecedent[24],
                "antecedent_72h_mm": antecedent[72],
                "max_1h_rainfall_concentration_fraction": max_1h / depth if depth > 0 and max_1h != "" else "",
                "left_censored_at_segment_edge": a == seg_start,
                "right_censored_at_segment_edge": b == seg_end,
                "left_censored_at_archive_start": a == 0,
                "right_censored_at_archive_end": b == len(rates) - 1,
                "first_valid_segment_start_utc": times[seg_start].isoformat().replace("+00:00", "Z"),
                "last_valid_segment_start_utc": times[seg_end].isoformat().replace("+00:00", "Z"),
            })
        i += 1
    return out


def acquisitions() -> list[dict]:
    grouped: dict[tuple, dict] = {}
    with SAR.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            key = (row["startTime"], row["pathNumber"], row["flightDirection"], row["polarization"], row["processingLevel"])
            if key not in grouped:
                grouped[key] = {**row, "sceneNames": [row["sceneName"]], "time": datetime.fromisoformat(row["startTime"].replace("Z", "+00:00"))}
            else:
                grouped[key]["sceneNames"].append(row["sceneName"])
    return sorted(grouped.values(), key=lambda r: r["time"])


def match_sar(event: dict, scenes: list[dict]) -> dict:
    start = datetime.fromisoformat(event["event_start_utc"].replace("Z", "+00:00"))
    end = datetime.fromisoformat(event["event_end_utc"].replace("Z", "+00:00"))
    pre = [s for s in scenes if start - timedelta(days=36) <= s["time"] < start]
    post = [s for s in scenes if end < s["time"] <= end + timedelta(days=14)]
    pairs = [(a, b) for a in pre for b in post if (a["pathNumber"], a["flightDirection"], a["polarization"], a["processingLevel"]) == (b["pathNumber"], b["flightDirection"], b["polarization"], b["processingLevel"])]
    if not pairs:
        return {"sar_pair_candidate": "No", "pre_sar_start_utc": "", "post_sar_start_utc": "", "sar_path_number": "", "sar_flight_direction": "", "pre_scene_names": "", "post_scene_names": "", "pre_lag_days": "", "post_lag_days": "", "sar_pair_note": "No same-path, same-direction, same-polarization pair found in catalogue windows; inventory is metadata only."}
    a, b = min(pairs, key=lambda p: abs((start - p[0]["time"]).total_seconds()) + abs((p[1]["time"] - end).total_seconds()))
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
        "sar_pair_note": "Candidate pair only; image data not radiometrically checked, aligned, or validated for inundation.",
    }


def main() -> None:
    rain_meta = json.loads(RAIN_META.read_text(encoding="utf-8"))
    if not RAIN.exists():
        raise FileNotFoundError(RAIN)
    times, rates, source_rows = read_series()
    interval_coverage = sum(v is not None for v in rates) / len(times) if times else 0.0
    # Operational safeguard: avoid deriving event boundaries from a heavily
    # censored interval series. This is not a statistical quality guarantee.
    if interval_coverage < 0.99:
        raise SystemExit(
            f"Event catalogue withheld: only {interval_coverage:.1%} of available half-hour intervals "
            "have valid area-weighted values. Resume/complete the available period before event detection."
        )
    primary = detect_events(times, rates, 0.1, 3)
    for i, event in enumerate(primary, start=1):
        event["event_id"] = f"VJA_IMERG_2025_{i:04d}"
        event["event_status"] = "partial-year candidate; not linked to verified inundation"
    fields = [
        "event_id", "event_start_utc", "event_end_utc", "rain_total_mm", "peak_intensity_mm_hr", "mean_intensity_mm_hr",
        "duration_hours_including_dry_gaps", "max_rolling_1h_mm", "max_rolling_3h_mm", "max_rolling_6h_mm",
        "antecedent_24h_mm", "antecedent_72h_mm", "max_1h_rainfall_concentration_fraction", "left_censored_at_segment_edge",
        "right_censored_at_segment_edge", "left_censored_at_archive_start", "right_censored_at_archive_end",
        "first_valid_segment_start_utc", "last_valid_segment_start_utc", "event_status",
    ]
    write_csv(EVENTS_OUT, primary, fields)

    sensitivity = []
    for threshold, gap in ((0.1, 3), (0.1, 6), (0.5, 3), (0.5, 6)):
        events = detect_events(times, rates, threshold, gap)
        sensitivity.append({
            "wet_rate_threshold_mm_hr": threshold,
            "dry_gap_hours": gap,
            "event_count": len(events),
            "left_censored_count": sum(e["left_censored_at_segment_edge"] for e in events),
            "right_censored_count": sum(e["right_censored_at_segment_edge"] for e in events),
            "available_period_start_utc": times[0].isoformat().replace("+00:00", "Z"),
            "available_period_end_exclusive_utc": END.isoformat().replace("+00:00", "Z"),
            "note": "Partial-year IMERG Final; no gap fill; no precipitation-quality-index screening.",
        })
    write_csv(SENS_OUT, sensitivity, list(sensitivity[0].keys()))

    scene_records = acquisitions()
    pair_rows = []
    for event in primary:
        pair = match_sar(event, scene_records)
        pair_rows.append({**{k: event[k] for k in ("event_id", "event_start_utc", "event_end_utc", "event_status", "left_censored_at_segment_edge", "right_censored_at_segment_edge")}, **pair})
    write_csv(PAIRS_OUT, pair_rows, list(pair_rows[0].keys()) if pair_rows else fields[:1])

    good = sum(r.get("download_status") == "ok" and r.get("area_weighted_rain_rate_mm_hr") not in (None, "") for r in source_rows)
    failed_download = sum(r.get("download_status") != "ok" for r in source_rows)
    missing_rain = len(rates) - sum(v is not None for v in rates)
    valid = [v for v in rates if v is not None]
    meta = {
        "status": "partial-year provisional event catalogue",
        "source_metadata": rain_meta,
        "available_timestamps_expected": len(times),
        "downloaded_valid_aggregates": good,
        "download_failures_or_missing_granules": failed_download,
        "missing_area_weighted_intervals": missing_rain,
        "valid_rate_min_mm_hr": min(valid) if valid else None,
        "valid_rate_max_mm_hr": max(valid) if valid else None,
        "negative_valid_rate_count": sum(v < 0 for v in valid),
        "wet_threshold_mm_hr": 0.1,
        "primary_dry_gap_hours": 3,
        "primary_event_count": len(primary),
        "metadata_pair_candidate_count": sum(r["sar_pair_candidate"].startswith("Yes") for r in pair_rows),
        "caveat": "No event is a verified flood. Q4 2025 rainfall is unavailable from the current public mirror, and Sentinel-1 pair matches are metadata candidates only.",
        "outputs": [str(p.relative_to(ROOT)).replace("\\", "/") for p in (EVENTS_OUT, SENS_OUT, PAIRS_OUT)],
    }
    META_OUT.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"available_interval_count={len(times)} valid={good} missing={missing_rain}")
    print(f"primary_events={len(primary)} metadata_sar_pairs={meta['metadata_pair_candidate_count']}")


if __name__ == "__main__":
    main()
