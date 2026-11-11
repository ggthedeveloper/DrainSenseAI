"""Build a real 250 m static-feature table from local land-cover and OSM data.

DEM and SoilGrids are deliberately withheld until their unresolved NoData
semantics are settled. This script does not create flood targets or labels.
"""
from __future__ import annotations

import csv
import json
import math
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.transform import from_origin
from rasterio.warp import reproject


ROOT = Path(__file__).resolve().parents[1]
GRID_PATH = ROOT / "data" / "interim" / "phase4" / "analysis_grid_250m.gpkg"
WORLDCOVER = ROOT / "data" / "raw" / "landcover" / "esa_worldcover_2021_v200_vijayawada_clip.tif"
ROADS = ROOT / "data" / "interim" / "phase1" / "osm_clipped" / "roads.gpkg"
WATERWAYS = ROOT / "data" / "interim" / "phase1" / "osm_clipped" / "waterways.gpkg"
OUT = ROOT / "data" / "interim" / "phase5" / "static_grid_features_2021_osm.csv"
META = OUT.with_suffix(".meta.json")
CRS_METRIC = "EPSG:32644"
WC_CLASSES = {
    10: "tree_cover",
    20: "shrubland",
    30: "grassland",
    40: "cropland",
    50: "built_up",
    60: "bare_sparse_vegetation",
    70: "snow_ice",
    80: "permanent_water",
    90: "herbaceous_wetland",
    95: "mangroves",
    100: "moss_lichen",
}


def landcover_counts(grid: gpd.GeoDataFrame) -> tuple[list[dict], dict]:
    with rasterio.open(WORLDCOVER) as src:
        bounds = grid.total_bounds
        x0 = math.floor(bounds[0] / 10) * 10
        y1 = math.ceil(bounds[3] / 10) * 10
        width = math.ceil((bounds[2] - x0) / 10)
        height = math.ceil((y1 - bounds[1]) / 10)
        transform = from_origin(x0, y1, 10, 10)
        dst = np.zeros((height, width), dtype=np.uint8)
        reproject(
            source=rasterio.band(src, 1),
            destination=dst,
            src_transform=src.transform,
            src_crs=src.crs,
            src_nodata=0,
            dst_transform=transform,
            dst_crs=CRS_METRIC,
            dst_nodata=0,
            resampling=Resampling.nearest,
        )

    shapes = [(geom, i + 1) for i, geom in enumerate(grid.geometry)]
    labels = rasterize(
        shapes,
        out_shape=dst.shape,
        transform=transform,
        fill=0,
        all_touched=False,
        dtype="uint16",
    )
    results = []
    pixel_size_area = 100.0
    for i, row in enumerate(grid.itertuples(index=False), start=1):
        vals = dst[labels == i]
        valid = vals[vals != 0]
        counts = np.bincount(valid.astype(np.int64), minlength=101) if len(valid) else np.zeros(101, dtype=np.int64)
        features = {
            "worldcover_2021_valid_pixel_count": int(len(valid)),
            "worldcover_2021_nodata_pixel_count": int(len(vals) - len(valid)),
        }
        for code, name in WC_CLASSES.items():
            count = int(counts[code]) if code < len(counts) else 0
            features[f"worldcover_2021_{name}_fraction"] = count / len(valid) if len(valid) else ""
        if len(valid):
            p = counts[counts > 0] / len(valid)
            features["worldcover_2021_entropy_bits"] = float(-(p * np.log2(p)).sum())
        else:
            features["worldcover_2021_entropy_bits"] = ""
        features["worldcover_2021_classified_area_m2_approx"] = len(valid) * pixel_size_area
        results.append(features)
    metadata = {
        "source": str(WORLDCOVER.relative_to(ROOT)).replace("\\", "/"),
        "source_year": 2021,
        "source_crs": "EPSG:4326",
        "source_nodata": 0,
        "analysis_crs": CRS_METRIC,
        "resampling": "nearest-neighbor to 10 m projected pixels",
        "pixel_counting": "pixel center assigned to one boundary-clipped grid polygon; 100 m2 approximate pixel area",
        "class_codes": WC_CLASSES,
    }
    return results, metadata


def line_features(grid: gpd.GeoDataFrame, path: Path, prefix: str) -> tuple[list[dict], int]:
    source = gpd.read_file(path).to_crs(CRS_METRIC)
    geometries = source.geometry.reset_index(drop=True)
    spatial_index = source.sindex
    union = geometries.union_all() if len(geometries) else None
    out = []
    for row in grid.itertuples(index=False):
        positions = spatial_index.query(row.geometry, predicate="intersects") if len(source) else []
        length_m = 0.0
        count = 0
        for pos in positions:
            segment = geometries.iloc[int(pos)].intersection(row.geometry)
            if not segment.is_empty and segment.length > 0:
                length_m += segment.length
                count += 1
        area = float(row.study_area_m2)
        density = (length_m * 1000 / area) if area > 0 else ""
        nearest_m = float(row.geometry.centroid.distance(union)) if union is not None and not union.is_empty else ""
        out.append({
            f"{prefix}_intersecting_feature_count": count,
            f"{prefix}_length_m": length_m,
            f"{prefix}_density_km_per_km2": density,
            **({f"{prefix}_nearest_mapped_distance_m": nearest_m} if prefix == "osm_waterway" else {}),
        })
    return out, len(source)


def main() -> None:
    if OUT.exists() or META.exists():
        raise FileExistsError(f"Refusing to overwrite existing phase 5 output: {OUT}")
    grid = gpd.read_file(GRID_PATH, layer="grid_cells").to_crs(CRS_METRIC)
    grid = grid.sort_values("grid_id").reset_index(drop=True)
    wc, wc_meta = landcover_counts(grid)
    road, road_n = line_features(grid, ROADS, "osm_road")
    waterway, waterway_n = line_features(grid, WATERWAYS, "osm_waterway")
    fields = [
        "grid_id", "grid_cell_area_m2", "boundary_coverage_ratio",
        *wc[0].keys(), *road[0].keys(), *waterway[0].keys(),
    ]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for i, row in enumerate(grid.itertuples(index=False)):
            writer.writerow({
                "grid_id": row.grid_id,
                "grid_cell_area_m2": row.study_area_m2,
                "boundary_coverage_ratio": row.coverage_ratio,
                **wc[i], **road[i], **waterway[i],
            })

    meta = {
        "dataset_type": "derived static spatial features from repository sources",
        "row_count": len(grid),
        "observation_unit": "boundary-clipped 250 m grid cell",
        "grid_source": str(GRID_PATH.relative_to(ROOT)).replace("\\", "/"),
        "crs": CRS_METRIC,
        "worldcover": wc_meta,
        "osm_roads": {"source": str(ROADS.relative_to(ROOT)).replace("\\", "/"), "feature_count": road_n, "interpretation": "mapped road centerline geometry only; not road condition or drainage capacity"},
        "osm_waterways": {"source": str(WATERWAYS.relative_to(ROOT)).replace("\\", "/"), "feature_count": waterway_n, "interpretation": "mapped surface waterway geometry only; not underground stormwater network or guaranteed complete hydrography"},
        "excluded_sources": {
            "copernicus_dem": "withheld: no explicit NoData marker; require source-mask semantics review before terrain aggregation",
            "soilgrids": "withheld: no explicit NoData marker and zeros are ambiguous in the current local rasters",
        },
        "targets": "No rainfall-event or inundation target columns are included.",
        "output": str(OUT.relative_to(ROOT)).replace("\\", "/"),
    }
    META.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"rows={len(grid)} roads={road_n} waterways={waterway_n}")
    print(f"worldcover_valid_pixels={sum(r['worldcover_2021_valid_pixel_count'] for r in wc)}")
    print(f"output={OUT}")


if __name__ == "__main__":
    main()
