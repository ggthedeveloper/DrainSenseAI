"""Consolidate the stopped IMERG request log locally without network access."""
from __future__ import annotations

import csv
import json
import math
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CHECKPOINT = ROOT / "data" / "interim" / "phase2" / "imerg_2025_study_area_halfhourly.csv"
CHECKPOINT_META = CHECKPOINT.with_suffix(".meta.json")
OUT = ROOT / "data" / "interim" / "phase2" / "imerg_2025_study_area_halfhourly_partial.csv"
OUT_META = OUT.with_suffix(".meta.json")
REPORT = ROOT / "reports" / "imerg_2025_partial_download_status.md"
START = datetime(2025, 1, 1, tzinfo=timezone.utc)
END = datetime(2025, 10, 1, tzinfo=timezone.utc)
N = int((END - START).total_seconds() // 1800)


def main() -> None:
    for p in (OUT, OUT_META, REPORT):
        if p.exists():
            raise FileExistsError(f"Refusing to overwrite existing output: {p}")
    if not CHECKPOINT.exists() or not CHECKPOINT_META.exists():
        raise FileNotFoundError("Stopped downloader checkpoint or metadata is missing")

    by_time: dict[str, list[dict]] = defaultdict(list)
    attempts = 0
    with CHECKPOINT.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            attempts += 1
            by_time[row["time_utc"]].append(row)

    template = next(iter(next(iter(by_time.values()))))
    fields = list(template.keys())
    records = {}
    t = START
    while t < END:
        key = t.isoformat().replace("+00:00", "Z")
        candidates = by_time.get(key, [])
        successful = [r for r in candidates if r.get("download_status") == "ok"]
        if successful:
            row = successful[-1]
        elif candidates:
            row = candidates[-1]
        else:
            row = {name: "" for name in fields}
            row.update({"time_utc": key, "download_status": "not_requested_after_user_stop", "error": ""})
        records[key] = row
        t += timedelta(minutes=30)

    with OUT.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for key in sorted(records):
            writer.writerow(records[key])

    statuses = Counter(r.get("download_status", "") for r in records.values())
    values = []
    missing_values = 0
    monthly = defaultdict(Counter)
    for key, row in records.items():
        month = key[:7]
        status = row.get("download_status", "")
        monthly[month][status] += 1
        raw = row.get("area_weighted_rain_rate_mm_hr", "")
        if raw not in (None, ""):
            v = float(raw)
            if math.isfinite(v):
                values.append(v)
        if status == "ok" and row.get("missing_value_in_any_weighted_cell", "").lower() == "true":
            missing_values += 1

    original_meta = json.loads(CHECKPOINT_META.read_text(encoding="utf-8"))
    successful_times = [
        key for key, row in records.items()
        if row.get("download_status") == "ok" and row.get("area_weighted_rain_rate_mm_hr") not in (None, "")
    ]
    meta = {
        **original_meta,
        "run_status": "stopped_by_user; partial extract retained",
        "download_attempt_rows": attempts,
        "unique_timestamp_count": len(by_time),
        "expected_interval_count": N,
        "successful_download_count": statuses.get("ok", 0),
        "valid_area_weighted_rate_count": len(values),
        "successful_rows_with_source_fill_in_weighted_cells": missing_values,
        "request_errors": statuses.get("error", 0),
        "source_not_found": statuses.get("not_found", 0),
        "not_requested_after_stop": statuses.get("not_requested_after_user_stop", 0),
        "coverage_fraction_by_download_status": statuses.get("ok", 0) / N,
        "first_successful_interval_utc": min(successful_times) if successful_times else None,
        "last_successful_interval_utc": max(successful_times) if successful_times else None,
        "local_partial_dataset": str(OUT.relative_to(ROOT)).replace("\\", "/"),
        "checkpoint_log_preserved": str(CHECKPOINT.relative_to(ROOT)).replace("\\", "/"),
        "no_more_network_requests_made_after_stop": True,
        "values_summary_mm_hr": {
            "min": min(values) if values else None,
            "max": max(values) if values else None,
            "mean": sum(values) / len(values) if values else None,
            "zero_rate_count": sum(v == 0 for v in values),
            "negative_rate_count": sum(v < 0 for v in values),
        },
        "monthly_interval_status": {m: dict(c) for m, c in sorted(monthly.items())},
        "event_detection": "Not run because the available extraction is incomplete and download was stopped; no event labels were generated from the partial series.",
    }
    OUT_META.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    CHECKPOINT_META.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    report = [
        "# 2025 IMERG Rainfall Extraction — Stopped Partial Snapshot",
        "",
        "**Status:** Stopped at the user's request; no additional download requests were made after the stop instruction.",
        "",
        "## Coverage",
        "",
        f"- Expected half-hour intervals in the public mirror's available window (2025-01-01 00:00 UTC through 2025-09-30 23:30 UTC): **{N:,}**.",
        f"- Successfully retrieved intervals retained: **{statuses.get('ok', 0):,}** ({statuses.get('ok', 0) / N:.1%}).",
        f"- Retrieval errors: **{statuses.get('error', 0)}**; source 404 responses: **{statuses.get('not_found', 0)}**; intervals not requested when stopped: **{statuses.get('not_requested_after_user_stop', 0):,}**.",
        f"- Successful timestamps extend from **{min(successful_times) if successful_times else 'none'}** through **{max(successful_times) if successful_times else 'none'}**; failed retrievals remain gaps.",
        "- Monthly interval coverage:",
        "",
        "  | Month | Retrieved | Expected | Coverage |",
        "  |---|---:|---:|---:|",
    ]
    for month, counts in sorted(monthly.items()):
        expected_month = sum(1 for key in records if key.startswith(month))
        ok_month = counts.get("ok", 0)
        report.append(f"  | {month} | {ok_month:,} | {expected_month:,} | {ok_month / expected_month:.2%} |")
    report.extend([
        "- The mirror did not provide October–December 2025 at the time checked. This artifact is therefore not a complete 2025 rainfall record.",
        "",
        "## Files and interpretation",
        "",
        f"- Consolidated, time-ordered partial series: [`{OUT.relative_to(ROOT).as_posix()}`](../data/interim/phase2/{OUT.name}). It contains one row for each expected half-hour in the available window. Unretrieved intervals have blank values and status `not_requested_after_user_stop`; no zeros or interpolated values were inserted.",
        f"- Cell values and area-weighted mean use the same three IMERG grid cells and overlap-area weights as the existing 2015 study-area series. Rain rate unit: mm/hr.",
        f"- Attempt checkpoint preserved separately: [`{CHECKPOINT.relative_to(ROOT).as_posix()}`](../data/interim/phase2/{CHECKPOINT.name}); duplicate request attempts are retained there for resumability and should not be analyzed as the canonical time series.",
        "- IMERG precipitation-quality-index screening was not included. Any event catalogue made from this snapshot would be highly censored by unrequested intervals, so event detection was withheld.",
        "- The 2025 retrieval used the public NSF NCAR GDEX mirror (dataset d731000, DOI 10.5065/SRTD-0R12) through spatial OPeNDAP queries; it did not download full global granules. NASA GES DISC's standard archive access requires Earthdata Login, which was not configured in this environment.",
        "",
        "## Next step",
        "",
        "Do not use this partial series to freeze 2025 event IDs or join rainfall to SAR scenes. Resume only if requested, then complete the missing available-period intervals, quality-screen the precipitation series, and obtain the missing Q4 source period before calling it a complete 2025 record.",
        "",
    ])
    REPORT.write_text("\n".join(report), encoding="utf-8")
    print(f"success={statuses.get('ok', 0)} errors={statuses.get('error', 0)} source_not_found={statuses.get('not_found', 0)} not_requested={statuses.get('not_requested_after_user_stop', 0)}")
    print(f"partial_csv={OUT}")
    print(f"report={REPORT}")


if __name__ == "__main__":
    main()
