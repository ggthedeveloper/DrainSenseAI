"""Look up the two model storm inputs for a civil date and time.

The calibrated model reads a 24-hour rainfall total and a Prakasam Barrage
stage. Rainfall in the CWC file is a daily gauge total. Stage is the archive
reading nearest to the requested clock time.
"""

from datetime import datetime
from typing import Optional

import pandas as pd

from backend.app.core.config import settings

_CACHE: Optional[dict] = None
STAGE_WINDOW_HOURS = 24.0


def _load() -> dict:
    global _CACHE
    if _CACHE is not None:
        return _CACHE

    rain = pd.read_csv(
        settings.DAILY_RAINFALL_PATH,
        usecols=["Data Acquisition Time", "Manual Daily Rainfall (mm)"],
    )
    rain["when"] = pd.to_datetime(rain["Data Acquisition Time"], dayfirst=True, errors="coerce")
    rain["mm"] = pd.to_numeric(rain["Manual Daily Rainfall (mm)"], errors="coerce")
    rain = rain.dropna(subset=["when", "mm"])

    stage = pd.read_csv(
        settings.STAGE_TELEMETRY_PATH,
        usecols=["Station", "observation_time", "water_level_m"],
    )
    stage = stage[stage["Station"] == "Prakasam Barrage"].copy()
    stage["when"] = pd.to_datetime(stage["observation_time"], errors="coerce")
    stage["level"] = pd.to_numeric(stage["water_level_m"], errors="coerce")
    stage = stage.dropna(subset=["when", "level"])
    stage = stage[stage["level"] >= 0].sort_values("when")

    rain_days = set(rain["when"].dt.date)
    stage_days = set(stage["when"].dt.date)
    both = sorted(rain_days & stage_days)
    _CACHE = {
        "rain": rain,
        "stage": stage,
        "overlap_start": both[0].isoformat() if both else None,
        "overlap_end": both[-1].isoformat() if both else None,
        "stage_end": stage["when"].max().strftime("%Y-%m-%dT%H:%M:%S") if len(stage) else None,
        "rain_end": rain["when"].max().strftime("%Y-%m-%dT%H:%M:%S") if len(rain) else None,
    }
    return _CACHE


def coverage() -> dict:
    data = _load()
    return {
        "overlap_start": data["overlap_start"],
        "overlap_end": data["overlap_end"],
        "stage_archive_end": data["stage_end"],
        "rain_archive_end": data["rain_end"],
        "note": (
            "Rainfall is the calendar-day gauge maximum. "
            "Barrage stage is the Prakasam reading nearest to the selected time, within 24 hours. "
            "The stage archive ends before the later rainfall days."
        ),
    }


def observation_at(when: datetime) -> dict:
    data = _load()
    requested = pd.Timestamp(when.replace(tzinfo=None))
    day = requested.normalize()
    day_rain = data["rain"][data["rain"]["when"].dt.normalize() == day]
    if day_rain.empty:
        raise LookupError(f"No Krishna daily rainfall on {day.strftime('%Y-%m-%d')}.")

    stage = data["stage"]
    if stage.empty:
        raise LookupError("The Prakasam Barrage archive is empty.")
    offsets = (stage["when"] - requested).abs()
    nearest = stage.loc[offsets.idxmin()]
    offset_hours = round(float(offsets.loc[nearest.name].total_seconds()) / 3600.0, 2)
    if offset_hours > STAGE_WINDOW_HOURS:
        end = data["stage_end"] or "the last archived reading"
        raise LookupError(
            f"No Prakasam Barrage reading within 24 hours of {requested.strftime('%Y-%m-%d %H:%M')}. "
            f"The stage archive ends at {end}."
        )

    observed = pd.Timestamp(nearest["when"])
    return {
        "requested_at": requested.strftime("%Y-%m-%dT%H:%M:%S"),
        "rain_24h_mm": round(float(day_rain["mm"].max()), 1),
        "rain_date": day.strftime("%Y-%m-%d"),
        "rain_source": "data/cwc_daily_rainfall_krishna_vja.csv",
        "prakasam_stage_m": round(float(nearest["level"]), 2),
        "stage_observed_at": observed.strftime("%Y-%m-%dT%H:%M:%S"),
        "stage_offset_hours": offset_hours,
        "stage_source": "data/cwc_krishna_river_telemetry_vja.csv",
        "station": "Prakasam Barrage",
    }
