# Phase 3 — Sentinel-1 Preprocessing Feasibility

**Snapshot:** 2026-11-10 (Asia/Kolkata)  
**Status:** Feasibility metadata verified; no image preprocessing or inundation labels created.

## Summary

An exact-boundary STAC search returned three Sentinel-1A scenes over the provisional Vijayawada municipal study polygon on 1, 13 and 25 September 2024. All three are IW GRD, descending, relative orbit 92, with VV and VH channels. This establishes a promising *same-track scene set* for further review. It does not establish a rainfall-linked event or a usable pre/post flood pair: local 2024 rainfall is absent, and the 1 September image cannot yet be called pre-event.

The scene measurements are exposed as cloud-optimized GeoTIFF assets in AWS Open Data. STAC identifies the channels as unsigned 16-bit values with zero nodata, but it does not expose a calibration scale in the inspected items. Consequently, no backscatter values, water masks, or inundation labels have been derived. Raw integer image values must not be interpreted as calibrated backscatter without resolving the product's scaling/calibration metadata and preprocessing provenance.

## Scene inventory

The reproducible query output is [`sentinel1_2024_stac_metadata.csv`](sentinel1_2024_stac_metadata.csv); the query script is [`inspect_phase3_s1_stac.py`](../scripts/inspect_phase3_s1_stac.py). The query uses the repository's provisional boundary and Earth Search STAC API, rather than an approximate city bounding box.

| Acquisition (UTC) | Relative / absolute orbit | Mode / product | Polarizations | STAC image grid | Candidate interpretation |
|---|---:|---|---|---|---|
| 2024-09-01 00:31:20 | 92 / 55464 | IW / GRD | VV, VH | EPSG:4326; 25,527 × 16,750 | Earlier same-track scene; pre-event status unknown |
| 2024-09-13 00:31:20 | 92 / 55639 | IW / GRD | VV, VH | EPSG:4326; 25,528 × 16,750 | Plan-proposed September case date; flood condition not independently verified here |
| 2024-09-25 00:31:20 | 92 / 55814 | IW / GRD | VV, VH | EPSG:4326; 25,527 × 16,750 | Later same-track observation; event/persistence relation unknown |

The `proj:shape` and `proj:transform` describe a geographic grid. The mission's nominal pixel spacing is 10 m while nominal GRD resolution is about 20 m; geographic-grid dimensions must not be mistaken for an equal-area 10 m analysis grid. Reprojection and pixel-area handling are required for area estimates.

## Processing and provenance findings

- STAC describes the assets as Sentinel-1 Level-1 GRD imagery, `uint16`, with nodata 0. Per-item STAC metadata does not provide a radiometric calibration scale or state that the published COG values are already calibrated sigma-nought/gamma-nought backscatter.
- STAC scene metadata provides orbit state, relative/absolute orbit, polarization, footprint, dimensions, and product type. It does not by itself demonstrate radiometric calibration, thermal/border-noise removal, terrain correction, speckle treatment, or subpixel registration between dates.
- Anonymous range access to a COG was verified during this work; the full scenes were not downloaded. This establishes delivery feasibility only, not image quality or valid inundation processing.
- The same relative orbit and descending direction make these acquisitions better matched than the 8 September ascending acquisition, which is excluded from this candidate set. Actual geometry, coverage within the boundary, layover/shadow, noise, and alignment still require image-level checks.
- No candidate is asserted to be ground-truth flooding. Sentinel-1 water-like radar signatures require interpretation, and permanent water, urban double-bounce, vegetation, and acquisition effects can confound simple thresholds.

## Phase 3 decision

**Do not create an inundation target from this scene set yet.** First establish local rainfall dates/amounts for the 2024 case and obtain sufficient product metadata or a documented preprocessed product (for example, a collection with a known calibrated-backscatter convention). Then inspect aligned, calibrated VV/VH imagery, validity masks, terrain effects, and independent reference information before selecting any threshold or interpreting change as inundation.

This is a deliberate stop at the preprocessing-feasibility gate. The report does not mark Phase 3 complete and does not train a model.

## Sources

- [Earth Search STAC API](https://earth-search.aws.element84.com/v1/) — queried for scenes intersecting the local boundary.
- [AWS Open Data Registry: Sentinel-1](https://registry.opendata.aws/sentinel-1/) — public archive and access details.
- [ASF Search API basics](https://docs.asf.alaska.edu/api/basics/) — archive metadata search background.
- [`DrainSenseAI_2.0_Redesigned_Research_Plan.md`](../DrainSenseAI_2.0_Redesigned_Research_Plan.md) — project preprocessing and water-detection requirements.
