"""Record public Sentinel-1 STAC metadata intersecting the study boundary."""
from __future__ import annotations

import csv
import json
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
BOUNDARY = ROOT / "data" / "metadata" / "study_area.geojson"
OUTPUT = ROOT / "reports" / "sentinel1_2024_stac_metadata.csv"
API = "https://earth-search.aws.element84.com/v1/search"


def main() -> None:
    geo = json.loads(BOUNDARY.read_text(encoding="utf-8"))
    feature = geo["features"][0] if geo.get("type") == "FeatureCollection" else geo
    payload = {
        "collections": ["sentinel-1-grd"],
        "intersects": feature["geometry"],
        "datetime": "2024-09-01T00:00:00Z/2024-09-26T00:00:00Z",
        "limit": 100,
    }
    req = Request(API, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urlopen(req, timeout=90) as response:
        result = json.load(response)

    records = []
    for item in result.get("features", []):
        p = item["properties"]
        if p.get("sat:orbit_state") != "descending" or p.get("sat:relative_orbit") != 92:
            continue
        records.append({
            "item_id": item["id"],
            "datetime_utc": p.get("datetime"),
            "platform": p.get("platform"),
            "orbit_state": p.get("sat:orbit_state"),
            "relative_orbit": p.get("sat:relative_orbit"),
            "absolute_orbit": p.get("sat:absolute_orbit"),
            "instrument_mode": p.get("sar:instrument_mode"),
            "product_type": p.get("sar:product_type"),
            "polarizations": ";".join(p.get("sar:polarizations", [])),
            "stac_epsg": p.get("proj:epsg"),
            "shape_rows_cols": json.dumps(p.get("proj:shape")),
            "bbox_wgs84": json.dumps(p.get("proj:bbox")),
            "processing_level": p.get("s1:processing_level"),
            "vv_href": item.get("assets", {}).get("vv", {}).get("href"),
            "vv_data_type": (item.get("assets", {}).get("vv", {}).get("raster:bands") or [{}])[0].get("data_type"),
            "vv_nodata": (item.get("assets", {}).get("vv", {}).get("raster:bands") or [{}])[0].get("nodata"),
            "vh_href": item.get("assets", {}).get("vh", {}).get("href"),
            "vh_data_type": (item.get("assets", {}).get("vh", {}).get("raster:bands") or [{}])[0].get("data_type"),
            "vh_nodata": (item.get("assets", {}).get("vh", {}).get("raster:bands") or [{}])[0].get("nodata"),
            "calibration_scale_metadata_present": "not exposed in STAC item",
        })
    records.sort(key=lambda row: row["datetime_utc"] or "")
    if not records:
        raise RuntimeError("No matching descending relative-orbit-92 scenes returned")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)
    print(f"Wrote {len(records)} STAC scene records to {OUTPUT}")


if __name__ == "__main__":
    main()
