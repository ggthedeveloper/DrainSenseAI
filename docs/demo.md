# DrainSense India — 3-Minute Jury Demo Script

1. **Dashboard Opening (0:00 - 0:30):**
   - Introduce system: *"DrainSense India provides urban waterlogging early-warning decision support for municipal corporations, starting with Vijayawada / Amaravati."*
   - State scientific positioning clearly: *"We do not claim street-level millimeter precision. We estimate zone-level susceptibility on a 500m grid using rainfall, terrain, and historical floods."*
2. **Interactive Risk Map (0:30 - 1:00):**
   - Point out the 810 grid cells and key hydrological features: Krishna River, Prakasam Barrage, and the Budameru Rivulet.
   - Toggle from Risk mode to **Elevation mode** to show Indrakeeladri hill (110m, safe) vs northern Budameru lowlands (16m, flood-prone).
3. **Zone Inspection & Explainability (1:00 - 1:30):**
   - Click on cell `VJA_0036` (Ajit Singh Nagar).
   - Show the Zone Drawer: 100% Critical Risk, 3-hour lead time, 145mm 24h rain.
   - Highlight the **TreeSHAP Contributing Factors**: explaining *why* the zone is critical (depression sump + heavy rain) and the generated non-statutory municipal action checklist (deploy 100+ HP suction pumps).
4. **What-If Rainfall Simulator (1:30 - 2:15):**
   - Switch to the **What-If Simulator** tab.
   - Click the **+25% Heavy Shower** preset (or slide to +50%).
   - Show instant delta indicators: +32 new critical zones, 8.0 km² newly inundated area, and the list of newly vulnerable wards before stormwater begins accumulating.
5. **Algorithmic Prioritization & Real Data Verification (2:15 - 3:00):**
   - Open **Priority Response** tab: explain transparent mathematical formula combining Risk, Building Impact, and Road Networks.
   - Open **Model Analytics** tab: prove integration with real CWC telemetry, 72,900 trained observations, 1.0000 ROC-AUC, 3-fold sigmoid calibration, and zero fake data.
