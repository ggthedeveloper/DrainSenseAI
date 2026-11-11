"""Build the fixed 250 m spatial support grid for target integration."""
from __future__ import annotations

import math
from pathlib import Path

import geopandas as gpd
from shapely.geometry import box


ROOT = Path(__file__).resolve().parents[1]
BOUNDARY = ROOT / "data" / "metadata" / "study_area.geojson"
OUTPUT = ROOT / "data" / "interim" / "phase4" / "analysis_grid_250m.gpkg"
CRS_METRIC = "EPSG:32644"  # UTM zone 44N; Vijayawada lies in this zone.
CELL_M = 250


def main() -> None:
    boundary = gpd.read_file(BOUNDARY).to_crs(CRS_METRIC)
    study_area = boundary.geometry.union_all()
    minx, miny, maxx, maxy = study_area.bounds
    col0 = math.floor(minx / CELL_M)
    row0 = math.floor(miny / CELL_M)
    col1 = math.ceil(maxx / CELL_M)
    row1 = math.ceil(maxy / CELL_M)

    records = []
    for row in range(row0, row1):
        y0 = row * CELL_M
        for col in range(col0, col1):
            x0 = col * CELL_M
            clipped = box(x0, y0, x0 + CELL_M, y0 + CELL_M).intersection(study_area)
            if clipped.is_empty or clipped.area <= 0:
                continue
            centroid = gpd.GeoSeries([clipped.centroid], crs=CRS_METRIC).to_crs("EPSG:4326").iloc[0]
            records.append({
                "grid_id": f"VJA250_R{row}_C{col}",
                "grid_row": row,
                "grid_col": col,
                "nominal_area_m2": CELL_M * CELL_M,
                "study_area_m2": clipped.area,
                "coverage_ratio": clipped.area / (CELL_M * CELL_M),
                "centroid_lon": centroid.x,
                "centroid_lat": centroid.y,
                "geometry": clipped,
            })

    grid = gpd.GeoDataFrame(records, geometry="geometry", crs=CRS_METRIC)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT.exists():
        raise FileExistsError(f"Refusing to overwrite existing output: {OUTPUT}")
    grid.to_file(OUTPUT, layer="grid_cells", driver="GPKG", index=False)
    print(f"cells={len(grid)}")
    print(f"grid_area_m2={grid.nominal_area_m2.sum():.2f}")
    print(f"study_area_in_grid_m2={grid.study_area_m2.sum():.2f}")
    print(f"coverage_ratio_min={grid.coverage_ratio.min():.6f}")
    print(f"coverage_ratio_max={grid.coverage_ratio.max():.6f}")
    print(f"crs={grid.crs}")
    print(f"output={OUTPUT}")


if __name__ == "__main__":
    main()
