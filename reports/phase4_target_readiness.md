# Phase 4 — Target Construction Readiness

**Snapshot:** 2026-11-10 (Asia/Kolkata)  
**Status:** Spatial support and target contract prepared; target rows are not yet supportable.

## Work completed

- Built [`analysis_grid_250m.gpkg`](../data/interim/phase4/analysis_grid_250m.gpkg) from the provisional study boundary in EPSG:32644, using a fixed 250 m grid anchored to 250 m UTM coordinates and clipped to the boundary.
- The grid contains 1,100 cells. Nominal full-cell area sums to 68.75 km²; clipped cell geometry area sums to 61.501967 km², matching the provisional municipal area. Edge cells are retained and their `coverage_ratio` records the fraction of nominal cell area inside the boundary. One or more very small edge slivers exist; decide whether to exclude them before final target aggregation and record the resulting covered area.
- Added [`phase4_target_schema.json`](phase4_target_schema.json) to define the intended grid-event observation unit and IER/IO fields without creating placeholder rows or labels.
- Added [`build_phase4_grid.py`](../scripts/build_phase4_grid.py) so the spatial support layer can be reproduced. The script refuses to overwrite an existing grid file.

## Target availability

| Required component | Current evidence | Phase 4 status |
|---|---|---|
| Stable spatial key | `grid_id` in the 250 m clipped grid | Available |
| Rainfall event key and timing | Partial 2015 event catalogue; the requested 2025 extraction was stopped at the user's request with 9,724 of 13,104 available Jan–Sep intervals retrieved (74.2%), through 2025-07-23 06:30 UTC; the public GDEX mirror currently ends at 2025-09-30 | Not frozen; August–September are not retrieved and Q4 is unavailable from this mirror |
| Verified pre/post SAR observations | 2024 scenes are STAC metadata candidates only; calibration and image alignment are not established | Not available |
| Permanent-water exclusion | No project-validated permanent-water mask | Not available |
| Valid/uncertain pixel mask | No calibrated SAR processing or quality mask yet | Not available |
| IER and IO | Require the masks and valid-area denominator above | Not calculated |
| Persistence | Requires multiple usable post-event masks and observation-time intervals | Not calculated |

Therefore `sar_inundation_targets.csv` has **not** been generated. The CSV is not represented by synthetic examples. The schema is only a contract; it contains no measured observations.

## Integration rules for the eventual table

1. Create one row per `grid_id × event_id × SAR observation` only after both event timing and scene association pass documented quality checks.
2. Use the boundary-clipped geometry area, then calculate the valid-land denominator after excluding permanent water and invalid/uncertain pixels. Do not use the nominal 62,500 m² as the denominator for clipped edge cells.
3. Calculate `IER = 100 × newly inundated valid area / valid land area`; retain null where no valid denominator exists. Select the IO threshold only after quantifying SAR classification uncertainty and pixel scale.
4. Store scene IDs, acquisition times, preprocessing version, detection method, threshold, and quality counts with each label. Describe IER/IO as SAR-derived labels, not independently verified flood ground truth.
5. Treat persistence as interval-censored between observation dates, never as continuous flood duration.
6. Do not associate the 2024 candidate scenes with the 2025 rainfall extraction. Same year alone is not sufficient; the event and acquisition timing must match.

## Relation to the reference project

The linked [HYDRASENSE-AI repository](https://github.com/miss-smiling/HYDRASENSE-AI) describes an early ward-level weighted score using illustrative sample inputs and lists replacement with real rainfall, GIS elevation, drainage, and verified outcomes as future work. DrainSenseAI can follow its transparent staged layout, but its local data currently support measured/geospatial feature construction more strongly than flood prediction. A predictive risk score would be unsupported until valid outcome labels and temporal rainfall coverage are available.

## Next gate

If rainfall acquisition is resumed, complete and quality-screen the available-period series; independently identify calibrated, aligned SAR scenes for events in the same period; then create and QC water masks before populating this schema. Until those gates pass, the grid is the only Phase 4 data artifact.
