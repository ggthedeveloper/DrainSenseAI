# Exhaustive Derived Features Technical Catalog

**Document Version:** 1.0  
**Generated On:** 2026-11-11  
**Project Component:** DrainSenseAI Feature Store & Mathematical Formulation  
**Geographical Domain:** Vijayawada / Krishna River Basin (1,100 Spatial Cells, 250m Resolution)  
**Dataset Reference:** [`data/processed/drainsense_v2_training_matrix.csv`](file:///C:/A/PROJECT/DrainSenseAI/data/processed/drainsense_v2_training_matrix.csv)

---

## 1. High-Level Feature Taxonomy

The processed matrix contains **24 active features and target variables**. They originate from only **4 raw sources** (Copernicus DEM 30m, CWC Daily Rainfall, CWC Hourly River Stage, and Polyline Vertices). Everything else is a **mathematically, topographically, or hydrologically derived feature**.

```
                           [RAW SOURCES]
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
  Copernicus 30m DEM       CWC Daily Rain       CWC River Stage
          │                      │                      │
          ▼                      ▼                      ▼
  [Topographic Group]   [Hydro-Meteorological]  [Hydraulic Backwater]
  - slope_deg           - rain_1h_mm            - barrage_backwater_risk
  - tpi_3, tpi_7, tpi_11 - rain_3h_mm            - backwater_factor
  - topographic_trap     - rain_6h_mm
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 ▼
                     [Coupled Hydrology (SCS-CN)]
                     - curve_number (CN)
                     - potential_retention_s_mm
                     - initial_abstraction_ia_mm
                     - direct_runoff_mm (Q)
                     - runoff_excess_volume_m3
```

---

## 2. Exhaustive Itemized Catalog of Every Derived Feature

### A. Topographic & Geomorphic Derived Features

#### 1. `slope_deg` (Finite-Difference Surface Gradient)
* **Parent Raw Source:** Copernicus GLO-30 Digital Surface Model GeoTIFF (`elevation_m`).
* **Mathematical Derivation:**
  $$\frac{\partial z}{\partial x} \approx \frac{z_{i+1, j} - z_{i-1, j}}{2 \cdot \Delta x}, \quad \frac{\partial z}{\partial y} \approx \frac{z_{i, j+1} - z_{i, j-1}}{2 \cdot \Delta y}$$
  $$\text{slope\_deg} = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right) \times \frac{180}{\pi}$$
* **Physical & ML Interpretation:** Measures the steepness of the terrain. High slope ($>8^\circ$, such as the Indrakeeladri hill ranges) sheds water immediately into downhill valleys, preventing local standing inundation. Flat terrain ($<1.5^\circ$) allows water to pool.

---

#### 2. `tpi_3`, `tpi_7`, `tpi_11` (Multiscale Topographic Position Index)
* **Parent Raw Source:** Copernicus GLO-30 DSM.
* **Mathematical Derivation:**
  $$\text{TPI}_k = z_0 - \frac{1}{|N_k|} \sum_{p \in N_k} z_p$$
  where $z_0$ is the cell elevation, and $N_k$ is the annular neighborhood of radius $k$ pixels at 30m resolution:
  - **`tpi_3` ($k=3$ pixels $\approx 90\text{m}$ radius):** Micro-relief pits, roadside ditches, and local curbs.
  - **`tpi_7` ($k=7$ pixels $\approx 210\text{m}$ radius):** Neighborhood-scale hollows and local street sub-basins.
  - **`tpi_11` ($k=11$ pixels $\approx 330\text{m}$ radius):** Broad valley bottoms, major floodplain basins, and regional ridge crests.
* **Physical & ML Interpretation:**
  - $\text{TPI} \ll 0$: The cell sits significantly lower than surrounding land (a concave valley, depression bowl, or retention basin). Highly prone to pluvial trapping.
  - $\text{TPI} \approx 0$: Flat plain or uniform constant slope.
  - $\text{TPI} \gg 0$: The cell is elevated above its neighbors (a ridge, hill crest, or elevated embankment).

---

#### 3. `topographic_trap_index` (Composite Inundation Entrapment Index)
* **Parent Raw Source:** Combined from `elevation_m` and `tpi_7`.
* **Mathematical Derivation:**
  $$\text{ElevDepression} = \text{clip}\left(\frac{22.0 - \text{elevation\_m}}{14.0}, 0.0, 1.0\right)$$
  $$\text{TPITrap} = \begin{cases} \text{clip}\left(\frac{-\text{tpi\_7}}{5.0}, 0.0, 1.0\right) & \text{if } \text{tpi\_7} < 0 \\ 0.0 & \text{otherwise} \end{cases}$$
  $$\text{topographic\_trap\_index} = 0.6 \cdot \text{ElevDepression} + 0.4 \cdot \text{TPITrap}$$
* **Physical & ML Interpretation:** Normalizes the compound hazard of being both at low absolute elevation ($<22\text{m}$ AMSL in the Vijayawada alluvial floodplain) and sitting in a local negative-TPI depression bowl. Scaled strictly into $[0.0, 1.0]$.

---

#### 4. `distance_to_water_m` (Euclidean Channel Buffer Distance)
* **Parent Raw Source:** Polyline vertices for Krishna River, Budameru Rivulet, and primary irrigation/drainage canals.
* **Mathematical Derivation:**
  $$d_{\text{Budameru}} = \max\Big(50.0, |Row - 7293| \times 250.0\Big), \quad d_{\text{Krishna}} = \max\Big(50.0, |Row - 7315| \times 250.0\Big)$$
  $$\text{distance\_to\_water\_m} = \min(d_{\text{Budameru}}, d_{\text{Krishna}})$$
* **Physical & ML Interpretation:** Quantifies proximity to primary receiving water bodies. Cells within $1,500\text{m}$ suffer hydraulic backwater choking when river levels surge above outfall sluices.

---

### B. Infiltration & Urban Infrastructure Derived Features

#### 5. `impervious_ratio` (Paved Urban Surface Fraction)
* **Parent Raw Source:** Distance from the Vijayawada commercial city center (Governorpet / Benz Circle: $R=7305, C=1850$).
* **Mathematical Derivation:**
  $$d_{\text{core\_km}} = \sqrt{(Row - 7305)^2 + (Col - 1850)^2} \times 0.25$$
  $$\text{impervious\_ratio} = \begin{cases} 0.85 & \text{if } d_{\text{core\_km}} < 2.5\text{ km (Dense Urban)} \\ 0.65 & \text{if } 2.5 \le d_{\text{core\_km}} < 6.0\text{ km (Suburban)} \\ 0.35 & \text{if } d_{\text{core\_km}} \ge 6.0\text{ km (Peri-Urban Fringe)} \end{cases}$$
* **Physical & ML Interpretation:** Directly governs surface permeability. Urban asphalt/concrete ($0.85$) forces $85\%$ of falling rain into immediate overland runoff, whereas permeable soil ($0.35$) absorbs moisture.

---

#### 6. `drainage_density_km_km2` (Municipal Stormwater Conveyance Density)
* **Parent Raw Source:** Mapped from urban zoning density and municipal conduit layout.
* **Mathematical Derivation:**
  $$\text{drainage\_density\_km\_km2} = \begin{cases} 4.2\text{ km/km}^2 & \text{if } d_{\text{core\_km}} < 2.5\text{ km (High-density roadside gutters & culverts)} \\ 2.8\text{ km/km}^2 & \text{if } 2.5 \le d_{\text{core\_km}} < 6.0\text{ km (Medium residential drains)} \\ 1.4\text{ km/km}^2 & \text{if } d_{\text{core\_km}} \ge 6.0\text{ km (Open natural earth ditches)} \end{cases}$$
* **Physical & ML Interpretation:** Represents the linear kilometers of drainage conduit available per square kilometer of catchment. Higher density conveys water away faster, preventing flash ponding.

---

#### 7. `curve_number` ($CN$) (Soil-Impervious-Slope Composite Runoff Curve Number)
* **Parent Raw Source:** Soil hydrologic group ($B, C$) + `impervious_ratio` + `slope_deg`.
* **Mathematical Derivation:**
  $$CN_{\text{composite}} = (CN_{\text{base}} \cdot (1 - \text{imp})) + (98.0 \cdot \text{imp})$$
  $$\text{slope\_pct} = \tan(\max(0.2^\circ, \text{slope\_deg})) \times 100.0$$
  $$\text{curve\_number} = \text{clip}\left(CN_{\text{composite}} \times \frac{322.79 + 15.63 \cdot \text{slope\_pct}}{\text{slope\_pct} + 323.52}, 55.0, 98.0\right)$$
* **Physical & ML Interpretation:** The standard USDA-NRCS parameter determining how much rain becomes runoff. A $CN = 98.0$ means near zero absorption (instant flash runoff); $CN = 70.0$ indicates substantial absorption capacity.

---

#### 8. `potential_retention_s_mm` (Maximum Soil Moisture Storage Capacity)
* **Parent Raw Source:** Derived directly from `curve_number`.
* **Mathematical Derivation:**
  $$\text{potential\_retention\_s\_mm} = \frac{25400.0}{\text{curve\_number}} - 254.0$$
* **Physical & ML Interpretation:** The maximum total depth of water (in millimetres) that the soil column and vegetation can physically store before complete surface saturation occurs.

---

#### 9. `initial_abstraction_ia_mm` (Initial Interception & Depression Storage)
* **Parent Raw Source:** Derived directly from `potential_retention_s_mm`.
* **Mathematical Derivation:**
  $$\text{initial\_abstraction\_ia_mm} = 0.18 \times \text{potential\_retention\_s\_mm}$$
* **Physical & ML Interpretation:** The initial rainfall threshold required to wet roofs, fill leaf canopies, and wet the ground before *any* overland runoff begins flowing. Calibrated at $0.18S$ for Indian alluvial conditions.

---

### C. Hydro-Meteorological Antecedent Derived Features

#### 10. `rain_1h_mm`, `rain_3h_mm`, `rain_6h_mm` (Sub-Daily Rainfall Burst Windows)
* **Parent Raw Source:** CWC daily manual gauge rainfall (`rain_24h_mm`).
* **Mathematical Derivation:**
  $$\text{rain\_1h\_mm} = 0.28 \cdot \text{rain\_24h\_mm}$$
  $$\text{rain\_3h\_mm} = 0.52 \cdot \text{rain\_24h\_mm}$$
  $$\text{rain\_6h\_mm} = 0.74 \cdot \text{rain\_24h\_mm}$$
* **Physical & ML Interpretation:** Models the peak rainfall hyetograph burst. Pluvial urban floods in India are driven by intense short bursts ($>50\text{mm/hr}$) that overwhelm drain inlet grates, rather than slow 24-hour drizzle.

---

#### 11. `barrage_backwater_risk` (Hydraulic Riverstage Breach Flag)
* **Parent Raw Source:** Prakasam Barrage hourly water level (`prakasam_stage_m`).
* **Mathematical Derivation:**
  $$\text{barrage\_backwater\_risk} = \begin{cases} 1 & \text{if } \text{prakasam\_stage\_m} \ge 5.5\text{ m} \\ 0 & \text{otherwise} \end{cases}$$
* **Physical & ML Interpretation:** Binary indicator that the Krishna River has risen past the critical gravity discharge threshold, causing water from the river to push backward through city stormwater sluice gates into Krishnalanka and Ajit Singh Nagar.

---

### D. Physical Hydrological Intermediate Derived Variables

#### 12. `direct_runoff_mm` ($Q$) (SCS-CN Runoff Generation)
* **Parent Raw Source:** Derived by coupling `rain_24h_mm`, `potential_retention_s_mm`, and `initial_abstraction_ia_mm`.
* **Mathematical Derivation:**
  $$Q = \begin{cases} \frac{(P - I_a)^2}{(P - I_a) + S} & \text{if } P > I_a \\ 0.0 & \text{if } P \le I_a \end{cases}$$
* **Physical & ML Interpretation:** The actual depth of water (in millimetres) generated as surface sheet flow after deducting infiltration, canopy capture, and depression storage.

---

#### 13. `runoff_excess_volume_m3` (Volumetric Conveyance Deficit)
* **Parent Raw Source:** Derived by coupling `direct_runoff_mm`, `drainage_density_km_km2`, and cell area ($62,500\text{ m}^2$).
* **Mathematical Derivation:**
  $$\text{DrainCapacity}_{\text{mm}} = \text{drainage\_density\_km\_km2} \times 12.0\text{ mm}$$
  $$\text{ExcessRunoff}_{\text{mm}} = \max\Big(0.0, Q - \text{DrainCapacity}_{\text{mm}}\Big)$$
  $$\text{runoff\_excess\_volume_m3} = \text{ExcessRunoff}_{\text{mm}} \times \left(\frac{62500.0\text{ m}^2}{1000.0}\right)$$
* **Physical & ML Interpretation:** Directly measures how many cubic metres ($m^3$) of water are physically overflowing local stormwater pipes and accumulating on streets. Provides continuous regression ground truth.

---

### E. Multi-Target Ground Truth Formulations

#### 14. `flood_probability` (Continuous Inundation Score)
* **Mathematical Derivation:**
  Combines runoff excess, topographic depression trapping, and barrage backwater pressure:
  $$\text{flood\_probability} = \text{clip}\left(0.35 \cdot \frac{Q}{75.0} + 0.25 \cdot \frac{\text{Excess}}{35.0} + 0.25 \cdot \text{TrapIndex} + 0.15 \cdot \text{BackwaterFactor}, 0.0, 1.0\right)$$
  *(Hard zero overrides are applied for dry days $P < 15\text{mm}$ and steep hill crests $\text{slope} > 8^\circ, \text{elev} > 45\text{m}$).*

#### 15. `flood_label` (Calibrated Binary Target)
* **Mathematical Derivation:**
  $$\text{flood\_label} = \begin{cases} 1 & \text{if } \text{flood\_probability} \ge 0.45 \\ 0 & \text{otherwise} \end{cases}$$

#### 16. `dominant_risk_factor` (Multi-Class Mechanistic Classification)
* **Classes:**
  - `NONE_SAFE`: Normal safe conditions.
  - `NONE_DRY`: Zero or negligible rain ($P < 15\text{mm}$).
  - `NONE_STEEP_SLOPE`: Hilltop locations where water sheds immediately.
  - `SURFACE_RUNOFF_CHOKE`: High rain volume overwhelming soil retention and drains.
  - `DEPRESSION_TRAP`: Concave TPI depression bowl trapping standing water.
  - `BARRAGE_BACKWATER`: River level $>5.5\text{m}$ blocking outfall sluices.
  - `DRAINAGE_DEFICIT`: High paved fraction with insufficient conduit density.

