# Phase 2 — Provisional Rainfall and Sentinel-1 Event Catalogue

**Status:** Partial catalogue built from the available rainfall snapshot and public Sentinel-1 metadata.  
**Snapshot:** 2026-11-10 (Asia/Kolkata)  
**ERA5-Land:** Excluded as directed by the redesigned plan.

## Summary

- The available IMERG time series covers 2015-01-01 00:00 UTC through 2015-07-08 17:00 UTC and has 232 missing half-hour intervals. It is not a complete historical rainfall record.
- Area-weighted aggregation over the provisional municipal polygon intersects three 0.1° IMERG cells. The weights are approximately 77.66%, 15.56%, and 6.78%; rainfall is therefore still coarse-grid satellite precipitation, not 250 m rainfall.
- Under a provisional wet threshold of 0.1 mm/hr and a 3-hour dry-gap rule, 66 candidate rainfall events were identified. A sensitivity check produced 49 events with a 6-hour gap, 39 with a 0.5 mm/hr threshold and 3-hour gap, and 33 with a 0.5 mm/hr threshold and 6-hour gap.
- Events touching missing-interval segment edges are flagged: 9 left-censored and 8 right-censored under the primary rule. Missing intervals split event-detection segments; no rainfall was interpolated.
- The public ASF metadata search returned 413 Sentinel-1 IW GRD_HD scene records intersecting the study polygon from 2015-03-05 through 2026-11-09. The records have VV+VH polarization; 407 are descending and 6 ascending. They are acquisition metadata only, not downloaded image files.
- Only two Sentinel-1 scene records overlap the partial 2015 rainfall period (2015-03-05 and 2015-05-28). None of the 66 rainfall candidates has a same-path, same-direction, same-polarization pre/post pair within the selection windows below.
- The plan-proposed September 2024 case has same-track Sentinel-1 metadata on September 1, 13, and 25, plus a separate ascending pass on September 8. Local 2024 rainfall is absent, so the September 1 scene cannot yet be classified as pre-event and the other scenes remain unpaired candidate observations.

## Method and assumptions

1. **Spatial rainfall series:** each half-hour granule's precipitation rate was aggregated to the municipal polygon using the overlap area of each intersecting IMERG cell in EPSG:32644. The three cell weights are recorded in the builder output. The precipitation field is in mm/hr; event depth sums use the 0.5-hour interval duration.
2. **Primary event rule:** a time step is wet when the area-weighted rate is at least 0.1 mm/hr. Wet steps separated by fewer than six observed dry half-hour steps are grouped; a dry gap of at least three hours splits events. Six-hour gap and 0.5 mm/hr threshold alternatives are recorded in the sensitivity table.
3. **Missing data:** a missing granule splits the time series. Adjacent event segments are marked censored because an unobserved interval could change event boundaries. No missing rates were filled. The primary event list is a candidate catalogue, not a completed historical event record.
4. **SAR search:** Sentinel-1 GRD metadata was queried with ASF's public [Search API](https://docs.asf.alaska.edu/api/basics/) for IW mode and the municipal-polygon intersection. Query parameters and the script are in [`build_phase2_catalogue.py`](../scripts/build_phase2_catalogue.py). The inventory includes the ASF scene name, time, platform, polarization, flight direction, path and frame. The [ASF keyword reference](https://docs.asf.alaska.edu/api/keywords/) defines the search filters.
5. **Candidate SAR pairing:** a pre-event candidate must occur within 36 days before event start; a post-event candidate must occur within 14 days after event end. Both must share ASF `pathNumber`, flight direction, polarization, and processing level. `pathNumber` is retained as reported by ASF; scene geometry and relative-orbit compatibility still require image-level confirmation. The windows are catalogue filters, not evidence that a SAR image captured peak inundation.
6. **No image processing:** no SAR product was downloaded or processed. No water mask, inundation target, or flood label was generated.

## Outputs

| File | Contents |
|---|---|
| [`sentinel1_acquisition_inventory.csv`](sentinel1_acquisition_inventory.csv) | 413 ASF Sentinel-1 GRD scene metadata rows intersecting the study polygon |
| [`imerg_study_area_series_partial.csv`](imerg_study_area_series_partial.csv) | Area-weighted provisional rainfall rate for observed half-hour timestamps, including gap rows |
| [`rainfall_events_partial_2015.csv`](rainfall_events_partial_2015.csv) | 66 provisional 2015 rainfall events under the primary 0.1 mm/hr / 3-hour rule |
| [`rainfall_event_sensitivity_partial.csv`](rainfall_event_sensitivity_partial.csv) | Event counts for four wet-threshold / dry-gap combinations |
| [`satellite_event_catalogue_partial.csv`](satellite_event_catalogue_partial.csv) | Rainfall candidates and same-track pre/post SAR-pair status; no pair found under current rules |
| [`sentinel1_2024_case_candidate.csv`](sentinel1_2024_case_candidate.csv) | Plan-proposed September 2024 candidate dates; rainfall timing remains unverified |
| [`../scripts/build_phase2_catalogue.py`](../scripts/build_phase2_catalogue.py) | Reproducible builder for this provisional catalogue |

## Findings and limitations

- The 66 event count depends on the selected threshold and dry-gap rule. It is not a climate-normal estimate and should not be used to claim sufficient independent events for generalizable ML.
- At the current 2015 coverage, no candidate has a compatible pre/post SAR pair in the stated windows. This prevents construction of satellite-derived inundation targets for the available 2015 events.
- The archive metadata confirms that Sentinel-1 scenes intersect the study boundary, but actual image coverage, speckle/quality, acquisition geometry, and usability for inundation change detection require downloading and inspecting the products.
- The September 2024 case remains promising as a metadata candidate: the September 1, 13, and 25 scenes share the same reported descending path, while September 8 is on a different ascending path. Rainfall onset and the 1 September acquisition time must be checked before treating that image as pre-event. The 13 September scene is not evidence by itself that inundation was present at that time.
- No 2024 IMERG rainfall is present in the local collection. The full GPM download was deliberately not resumed after the user chose to continue without it. A separate credentialed acquisition is required before this case can be rainfall-associated.
- The candidate catalogue uses an unfiltered precipitation-quality-index series. A documented quality screening decision and dry-gap sensitivity review remain required before event IDs are frozen.

## Phase decision

**Phase 2 is partially complete.** The provisional rainfall event list and SAR acquisition inventory are available, but no usable event pair is verified and the 2024 case lacks locally available rainfall. Continue to Phase 3 only after a selected event has matching rainfall and validated pre/post SAR imagery. The current data support an acquisition-feasibility review, not inundation labeling or model training.

## Addendum — 2025 rainfall request

After this status snapshot, a spatially limited query of public NSF NCAR GDEX IMERG Final V07B data retrieved 9,724 of 13,104 half-hour intervals (74.2%) from the mirror's available 2025-01-01 through 2025-09-30 window. The user then explicitly stopped the download. The retained partial series reaches 2025-07-23 06:30 UTC, with 18 retrieval errors, one source 404, and August–September not retrieved; October–December were absent from that mirror. No 2025 event catalogue was generated because the remaining gaps would censor event boundaries. See [`imerg_2025_partial_download_status.md`](imerg_2025_partial_download_status.md) and [`imerg_2025_study_area_halfhourly_partial.csv`](../data/interim/phase2/imerg_2025_study_area_halfhourly_partial.csv).
