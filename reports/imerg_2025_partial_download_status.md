# 2025 IMERG Rainfall Extraction — Stopped Partial Snapshot

**Status:** Stopped at the user's request; no additional download requests were made after the stop instruction.

## Coverage

- Expected half-hour intervals in the public mirror's available window (2025-01-01 00:00 UTC through 2025-09-30 23:30 UTC): **13,104**.
- Successfully retrieved intervals retained: **9,724** (74.2%).
- Retrieval errors: **18**; source 404 responses: **1**; intervals not requested when stopped: **3,361**.
- Successful timestamps extend from **2025-01-01 00:00 UTC** through **2025-07-23 06:30 UTC**. Coverage is not continuous through that last timestamp: 18 failed requests occur in June and one source granule returned 404 in February.
- Monthly interval status:

  | Month | Retrieved | Expected | Coverage |
  |---|---:|---:|---:|
  | 2025-01 | 1,488 | 1,488 | 100.00% |
  | 2025-02 | 1,343 | 1,344 | 99.93% |
  | 2025-03 | 1,488 | 1,488 | 100.00% |
  | 2025-04 | 1,440 | 1,440 | 100.00% |
  | 2025-05 | 1,488 | 1,488 | 100.00% |
  | 2025-06 | 1,422 | 1,440 | 98.75% |
  | 2025-07 | 1,055 | 1,488 | 70.90% |
  | 2025-08 | 0 | 1,488 | 0.00% |
  | 2025-09 | 0 | 1,440 | 0.00% |
- The mirror did not provide October–December 2025 at the time checked. This artifact is therefore not a complete 2025 rainfall record.

## Files and interpretation

- Consolidated, time-ordered partial series: [`data/interim/phase2/imerg_2025_study_area_halfhourly_partial.csv`](../data/interim/phase2/imerg_2025_study_area_halfhourly_partial.csv). It contains one row for each expected half-hour in the available window. Unretrieved intervals have blank values and status `not_requested_after_user_stop`; no zeros or interpolated values were inserted.
- Cell values and area-weighted mean use the same three IMERG grid cells and overlap-area weights as the existing 2015 study-area series. Rain rate unit: mm/hr.
- Attempt checkpoint preserved separately: [`data/interim/phase2/imerg_2025_study_area_halfhourly.csv`](../data/interim/phase2/imerg_2025_study_area_halfhourly.csv); duplicate request attempts are retained there for resumability and should not be analyzed as the canonical time series.
- IMERG precipitation-quality-index screening was not included. Any event catalogue made from this snapshot would be highly censored by unrequested intervals, so event detection was withheld.
- The 2025 retrieval used the public NSF NCAR GDEX mirror (dataset d731000, DOI 10.5065/SRTD-0R12) through spatial OPeNDAP queries; it did not download full global granules. NASA GES DISC's standard archive access requires Earthdata Login, which was not configured in this environment.

## Next step

Do not use this partial series to freeze 2025 event IDs or join rainfall to SAR scenes. Resume only if requested, then complete the missing available-period intervals, quality-screen the precipitation series, and obtain the missing Q4 source period before calling it a complete 2025 record.
