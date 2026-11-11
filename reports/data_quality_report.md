# Phase 1 — Existing Data Audit and Preparation

**Project:** DrainSenseAI 2.0 redesigned research plan  
**Audit snapshot:** 2026-11-10 (Asia/Kolkata); manifest generated 2026-11-10 00:16 IST  
**Scope:** existing repository datasets and Phase 1 derivatives only. ERA5-Land was inventoried for preservation/provenance, but is excluded from predictors, targets, and validation as required by the redesigned plan.

## Phase 1 status

**Status: In progress; core static preparation is complete, rainfall acquisition and NoData confirmation remain open.**

| Plan action | Status | Evidence / limitation |
|---|---|---|
| Create an authoritative data manifest | Complete for this snapshot | [`dataset_inventory.csv`](dataset_inventory.csv) contains one row per file under `data/` except the Python virtual environment: 9,011 records across 8,834 NetCDF, 87 CSV, 78 GeoTIFF, 5 GeoPackage, 1 GeoJSON, 1 ZIP and metadata/code files. It includes exact IMERG internal time bounds, file size, format, dimensions/schema where inspected, and role/duplication notes. |
| Preserve original files | Complete | No source data file was overwritten or deleted. New clipped/scaled products are in `data/interim/phase1/`; the new boundary is in `data/metadata/`. Existing expanded CSVs remain in place and are labeled as mirrors in the manifest. |
| Stop using expanded raster-to-CSV files for normal analysis | Complete as a workflow choice | Native GeoTIFF, NetCDF and vector sources are the analysis inputs. CSV exports are retained for provenance/compatibility but not treated as independent observations. |
| Resolve DEM and SoilGrids NoData handling | **Open** | The inspected DEM and SoilGrids GeoTIFFs have no explicit NoData value. SoilGrids zero pixels are preserved and flagged as ambiguous; source coverage/masks must be confirmed before assigning NoData. No values were fabricated or filled. |
| Apply property-specific SoilGrids scaling | Complete as derived copies | 36 float32 scaled GeoTIFF copies are in `data/interim/phase1/soilgrids_scaled/`. Original values remain untouched; zeros are preserved. Layer-level extrema, zero counts, scale factors and unit labels are recorded in [`soilgrids_layer_quality.csv`](soilgrids_layer_quality.csv). |
| Clip OSM features to the study boundary | Complete using a provisional boundary | Roads and waterways were clipped to the municipality polygon. Outputs are separate GPKGs in `data/interim/phase1/osm_clipped/`; original GPKGs remain unchanged. |
| Complete IMERG download and inspect timestamps | Timestamp audit complete; download incomplete | 8,827 valid granules through 2015-07-08 17:00 UTC. The download process is no longer running. 232 half-hour intervals are missing within the observed span; full 2015–2024 coverage is not present. No Earthdata token is configured in this execution environment, so the download cannot be resumed here without credentials. |
| Create Vijayawada study-area polygon | Complete as a sourced provisional boundary | [`study_area.geojson`](../data/metadata/study_area.geojson) is a valid municipal polygon, about 61.5 km², in OGC:CRS84/EPSG:4326. The source is a CC BY 4.0 DataMeet boundary distributed through India Geodata. Its vintage/legal extent is not independently confirmed against an authoritative municipal record, so treat it as provisional. |

## 1. Manifest and file preservation

The manifest is a point-in-time file inventory, not a data-cleaning operation. It covers native files, export mirrors, the former ERA5-Land files, and the new Phase 1 derivatives. For large raster CSV mirrors, counts/dimensions are reported from their matching raster rather than reparsing billions of expanded fields. For regional OSM WKT CSV exports, the manifest records schemas and file sizes and marks them as region-wide exports; use the source archive or city extracts for feature analysis.

The older `data/metadata/dataset_inventory.csv` remains the original downloader-oriented manifest. It is preserved unchanged because it records source download information, but it does not include the complete current file set. Use the report-level manifest above as the comprehensive repository snapshot.

## 2. Boundary and spatial preparation

The study-area polygon source is the [Vijayawada municipal-boundaries collection](https://github.com/yashveeeeeer/india-geodata/tree/main/data/urban/municipal-boundaries), which identifies DataMeet Municipal Spatial Data as its source and CC BY 4.0 as its license. The [source GeoJSON](https://raw.githubusercontent.com/yashveeeeeer/india-geodata/main/data/urban/municipal-boundaries/vijayawada/Vijayawada_Boundary.geojson) contains one valid Polygon with bounds 80.586658–80.684366°E, 16.478660–16.584444°N. The existing static raster clips cover this polygon. The polygon is much smaller than the earlier rectangular data-download bbox; this is expected because the bbox was a coverage envelope, not a city boundary.

| Derived OSM layer | Source features | Clipped features | Output |
|---|---:|---:|---|
| Roads | 62,866 | 7,368 | `data/interim/phase1/osm_clipped/roads.gpkg` |
| Waterways | 488 | 18 | `data/interim/phase1/osm_clipped/waterways.gpkg` |

The clipped features remain in EPSG:4326. Reproject them to a suitable local metric CRS before calculating lengths, density, or distance. Clipping uses the municipality polygon, not a drainage catchment. OSM gaps must not be interpreted as proof that infrastructure is absent.

## 3. SoilGrids scaling and NoData findings

The 36 source rasters are six properties at six depth intervals, 265 × 209 pixels each (55,385 pixels), with no explicit NoData marker in the inspected TIFF metadata. The scaled copies apply these conversions:

| Property | Stored source unit | Scale | Output unit |
|---|---|---:|---|
| Clay | g/kg | 0.1 | percent |
| Sand | g/kg | 0.1 | percent |
| Silt | g/kg | 0.1 | percent |
| Soil organic carbon (`soc`) | dg/kg | 0.1 | g/kg |
| Bulk density (`bdod`) | cg/cm³ | 0.01 | g/cm³ |
| Soil pH (`phh2o`) | pH × 10 | 0.1 | pH |

Zeros occur in every property and depth layer. Summed across six depths, 19,692 zeros occur in each of clay, sand, silt, SOC and pH; 21,120 occur in bulk density. Some zeros may be valid for a texture component, but pH=0 and bulk density=0 are implausible soil measurements. The zero patterns and missing source masks require comparison with authoritative SoilGrids coverage/masks. The scaled copies therefore preserve zero values and include a tag stating that NoData remains unresolved; do not use those pixels as confirmed valid soil measurements until this is resolved.

The DEM clip is 2,160 × 1,800, float32, EPSG:4326, with observed values about 3–546.7 and no explicit NoData marker. Do not infer NoData from elevation values without checking source masks/coverage. Reproject before slope/area calculations; document hydrologic conditioning before deriving flow indices.

## 4. Rainfall coverage and timestamp audit

The staged files identify GPM IMERG `3IMERGHH` / `3B-HHR`, algorithm version `3IMERGH_7.0` (V07B), half-hour granules, precipitation in mm/hr, and an 8-latitude × 9-longitude grid. The full scan of internal `FileHeader` start/stop times and time coordinates found:

- 8,827 granules read successfully; no unreadable files in the snapshot.
- Granule start times: 2015-01-01 00:00 through 2015-07-08 17:00 UTC; final interval ends at 17:29:59.999 UTC.
- All files had the same algorithm version and spatial coordinate arrays.
- No duplicate timestamps and no mismatch between the internal start time and time coordinate.
- 232 expected half-hour intervals are absent between the first and last observed time; 75 dates are complete and 114 dates are partial within this observed time window. The final date has 26 of 35 intervals through 17:00 UTC.
- No missing precipitation cells were found inside the stored granules (635,544 cell-time values checked). This does not imply complete time coverage.

Machine-readable evidence is in [`imerg_file_times.csv`](imerg_file_times.csv), [`imerg_daily_coverage.csv`](imerg_daily_coverage.csv), and [`imerg_missing_intervals.csv`](imerg_missing_intervals.csv). Missing intervals were reported, not interpolated. Rainfall totals must convert the mm/hr rate to half-hour depth with the documented interval duration and apply a justified quality-index policy. This collection is not a complete historical record and is not yet suitable for a multi-year event catalogue or held-out event generalization.

The download script defaults to 2015–2024, but only a partial 2015 archive is present. No active downloader process was found at the end of the audit. `EARTHDATA_TOKEN` is unset here; the download requires an authorized NASA Earthdata token. The existing staged files are preserved so a credentialed run can resume and skip valid files.

## 5. Static feature suitability

- **WorldCover:** 2020 v100 and 2021 v200 clips are each 7,200 × 6,000 categorical 10 m rasters. The inspected clips contain class codes 10–90, with eight classes present. Aggregate class-area proportions and retain year/version; do not average class codes or treat the two versions as direct pixel-level change labels.
- **Terrain:** Copernicus DEM can support elevation, slope, aspect and neighborhood terrain summaries after metric reprojection and NoData review. Flow accumulation/TWI need a documented hydrologic conditioning method.
- **Soil:** SoilGrids can provide model-predicted texture, SOC, bulk density and pH proxies after scale conversion and mask resolution. These are not field infiltration measurements.
- **Infrastructure:** clipped OSM roads and waterways can provide mapped network density/proximity proxies. They are incomplete mapped data, not a verified storm-drain inventory.
- **Rainfall:** the current IMERG span can support a limited data-pipeline pilot after gap-aware event detection, but not representative historical rainfall archetypes.
- **Sentinel-1:** no Sentinel-1 SAR imagery or derived inundation mask was found in the audited repository. It remains new data required for Phase 2/3.
- **CWC:** station water-level records remain a separate river-stage context dataset. Their earlier audit showed anomalous station metadata, extreme values and duplicates; they are not cell-level inundation targets.
- **ERA5-Land:** retained and inventoried for reproducibility only. It is excluded entirely from this redesigned study and must not enter the unified dataset.

## 6. Phase 1 decision gate and next steps

**Phase 1 is not yet complete.** Continue only after these open gates are addressed:

1. Resume the IMERG collection with an authorized Earthdata token, then rebuild this snapshot manifest and repeat the timestamp/gap/version audit after the intended period is downloaded.
2. Confirm SoilGrids and DEM NoData semantics from source metadata/masks; update scaled derivatives only after a defensible mask decision. Current scaled copies preserve the source grid and values except for the documented unit multipliers.
3. Confirm the municipal polygon's boundary vintage and legal extent with a municipal/authoritative GIS source. Replace the provisional polygon only after verification; regenerate clipped OSM derivatives from the confirmed boundary.
4. Keep the current original files and derived outputs separated. Do not start ML training. Once Phase 1 is closed, proceed to the plan's rainfall/Sentinel-1 event catalogue and verify whether enough independent SAR-observed events exist.

The immediate data package is prepared for further audit and a limited processing pilot, but there is not yet adequate evidence for multi-event inundation modeling or reliable generalized targets.
