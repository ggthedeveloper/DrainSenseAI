# DrainSenseAI 2.0 --- Redesigned Research Plan

**Research direction:** Urban surface characterisation +
satellite-observed inundation analysis\
**Geographical scope:** Vijayawada, Andhra Pradesh, India\
**Core methods:** Multi-source dataset engineering, unsupervised
clustering, supervised regression/classification, spatial validation and
explainable ML

------------------------------------------------------------------------

## 1. Project direction

### Proposed title

**Multi-Source Urban Surface Characterisation and Satellite-Based
Inundation Analysis Using Hierarchical Machine Learning**

### Research objective

Investigate how urban surface characteristics and rainfall-event
properties relate to the spatial extent, distribution and persistence of
satellite-observed inundation in Vijayawada.

The project has three connected components:

1.  **Urban surface characterisation:** Identify distinct types of urban
    surfaces in Vijayawada.
2.  **Rainfall characterisation:** Identify different rainfall-event
    patterns.
3.  **Inundation analysis:** Investigate how surface types and rainfall
    events relate to satellite-observed inundation.

**Central research question:**

> How do urban surface characteristics and rainfall-event properties
> influence the spatial extent, distribution and persistence of
> satellite-observed inundation in Vijayawada?

### Intended research contribution

The contribution should be a carefully documented, multi-source
Vijayawada dataset and an empirical investigation of whether
representing urban surfaces and rainfall events as archetypes improves
the analysis and prediction of satellite-derived inundation.

Combining public datasets or applying clustering is not, by itself, a
novel contribution. Do not claim a new flood-detection algorithm unless
one is actually developed and validated.

## 2. What changes from the previous project?

  -----------------------------------------------------------------------
  Previous design                     Redesigned project
  ----------------------------------- -----------------------------------
  ERA5-Land runoff targets            Sentinel-1-derived inundation
                                      targets

  Modelled runoff response            Satellite-derived water/inundation
                                      extent

  Runoff depth prediction             Inundation extent analysis

  Runoff peak intensity               Inundation expansion

  Runoff response lag                 Observed inundation persistence

  Rainfall--runoff interaction        Rainfall--surface--inundation
                                      interaction
  -----------------------------------------------------------------------

**ERA5-Land is excluded entirely.** Do not use its runoff,
precipitation, soil-moisture or invariants files as predictors, targets
or validation data in this redesigned project.

Sentinel-1 detects radar signatures associated with surface water. It
does not directly measure flood depth, drainage flow or the exact time
flooding began.

## 3. Final dataset architecture

Organise the project data into four groups.

### A. Static urban surface datasets --- already available

  -----------------------------------------------------------------------
  Dataset                 Existing audit          Role
                          information             
  ----------------------- ----------------------- -----------------------
  Copernicus DEM          30 m                    Terrain characteristics

  ESA WorldCover 2020     10 m                    Land-cover proportions

  ESA WorldCover 2021     10 m                    Land-cover proportions

  SoilGrids               36 raster layers,       Soil characteristics
                          approximately 250 m     

  OpenStreetMap roads     62,866 features         Road-network proxies

  OpenStreetMap waterways 488 features            Mapped waterway proxies
  -----------------------------------------------------------------------

### B. Rainfall dataset --- already being collected

**NASA GPM IMERG**

-   Half-hourly precipitation.
-   Existing audit snapshot: 3,243 granules, January 2015 to partial
    March 2015.
-   Extend the historical period after verifying product consistency and
    coverage.

Source: [NASA GPM IMERG](https://gpm.nasa.gov/data/imerg)

### C. Satellite inundation observations --- new data required

**Sentinel-1 SAR GRD imagery**

Collect:

-   Pre-event images.
-   Post-event images.
-   VV and VH polarisation where available.
-   Acquisition dates and times.
-   Orbit direction and relative orbit metadata.
-   Image coverage and quality information.
-   Derived water and inundation masks.

Sources:

-   [Copernicus Sentinel-1
    data](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-1)
-   [Sentinel-1 GRD in Google Earth
    Engine](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD)

### D. Optional independent validation/context data

**Central Water Commission (CWC)**

-   Existing Krishna-basin river water-level records.
-   Requires station-specific quality control.
-   Keep as a separate station-level analysis, not as grid-level urban
    flood labels.

Sources:

-   [CWC hourly river discharge
    telemetry](https://nwdp.nwic.gov.in/dataset/river-discharge-telemetry-hourly-central-water-commission-cwc)
-   [CWC hourly river water-level
    telemetry](https://nwdp.nwic.gov.in/en/dataset/river-water-level-telemetry-hourly-central-water-commission-cwc)

The audited CWC files contain river water level, not discharge. The
discharge resource was not available in the recorded Krishna/AP
inventory.

## 4. Sentinel-1 SAR --- new satellite dataset

Sentinel-1 is a Copernicus Synthetic Aperture Radar (SAR) mission. Radar
imagery can observe the Earth's surface through clouds and during day or
night.

### Recommended imagery

Use Sentinel-1 Level-1 Ground Range Detected (GRD) products, preferably:

-   Interferometric Wide (IW) mode.
-   VV and VH polarisation where available.
-   Consistent orbit direction and relative orbit for before/after
    comparisons.
-   Pre-event images.
-   Post-event images.
-   Multiple post-event images where available.

The Sentinel-1 archive extends back to 2014. Actual usable acquisition
availability over Vijayawada must be checked.

### Historical event to investigate first

**September 2024 Vijayawada floods.**

An APSAC/NRSC map based on Sentinel-1A imagery from 13 September 2024 is
available. The map uses a May 2024 RISAT-1A pre-flood image and a
September 2024 Sentinel-1A post-flood image. It warns that the results
are preliminary and not ground-verified.

Useful links:

1.  [Copernicus Sentinel-1
    data](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-1)
2.  [Sentinel-1 GRD --- Google Earth
    Engine](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD)
3.  [APSAC flood maps](https://apsac.ap.gov.in/?page_id=7308)
4.  [NRSC/APSAC Vijayawada inundation map --- 13 September
    2024](https://apsac.ap.gov.in/wp-content/uploads/2024/09/AP_2024_13_09_Map.pdf)
5.  [International Charter --- 2024 India flood
    activation](https://upload.disasterscharter.org/activations/flood-in-india-activation-907-)
6.  [IMD Monsoon Report
    2024](https://mausam.imd.gov.in/imd_latest/monsoonreport2024.pdf)

**Initial event:** 1--13 September 2024.

Do not assume one event is sufficient to train and evaluate a
generalisable model. Search the Sentinel-1 archive and build a
multi-event inventory.

## 5. Spatial and temporal observation unit

### Recommended initial analysis grid: 250 m

Rationale:

-   SoilGrids has approximately 250 m native resolution.
-   WorldCover and DEM can be aggregated to this grid.
-   Sentinel-1 water detections can be aggregated into inundated-area
    proportions.
-   GPM rainfall remains coarse, so storm-level features will be shared
    across multiple 250 m cells.

Compare 250 m with a finer grid during sensitivity analysis, but do not
imply that GPM rainfall becomes 250 m resolution.

### Final observation unit

\[
`\boxed{\text{250 m grid cell}\times\text{satellite-observed event}}`{=tex}
\]

Each observation contains:

-   A permanent spatial ID.
-   Static environmental features.
-   Event-specific rainfall features.
-   Event-specific SAR-derived inundation observations.

Example schema:

  ------------------------------------------------------------------------------------
  grid_id        event_id       rainfall_total   built_up_ratio   inundated_fraction
  -------------- -------------- ---------------- ---------------- --------------------
  G001           E2024_09       Rainfall feature Surface feature  SAR target

  G002           E2024_09       Rainfall feature Surface feature  SAR target

  G001           E2025_07       Rainfall feature Surface feature  SAR target
  ------------------------------------------------------------------------------------

Values are illustrative only.

## 6. Complete phase-by-phase workflow

### Phase 1 --- Existing dataset audit and preparation

Use the existing audit as the starting point.

  -----------------------------------------------------------------------
  Dataset                 Audit status            Action
  ----------------------- ----------------------- -----------------------
  Copernicus DEM          Available               Keep

  ESA WorldCover 2020     Available               Keep

  ESA WorldCover 2021     Available               Keep

  SoilGrids               36 layers available     Keep; apply scaling and
                                                  NoData checks

  OSM roads               62,866 features         Keep

  OSM waterways           488 features            Keep

  GPM IMERG               Incomplete download     Complete and audit

  Sentinel-1              Not in audited          Acquire
                          inventory               

  CWC water level         Available, quality      Optional separate
                          concerns                analysis

  ERA5-Land               Previously available    Exclude entirely
  -----------------------------------------------------------------------

Actions:

1.  Create an authoritative data manifest.
2.  Preserve original files.
3.  Stop using expanded raster-to-CSV files for normal analysis.
4.  Resolve DEM and SoilGrids NoData handling.
5.  Apply property-specific SoilGrids scaling.
6.  Clip OSM features to the actual study boundary.
7.  Complete the IMERG download and inspect internal timestamps.
8.  Create a Vijayawada study-area polygon.

Questions answered:

-   Which existing datasets are genuinely usable?
-   Which spatial features can be extracted?
-   How much rainfall history is available?
-   Are the datasets spatially compatible?

**Deliverables:** `dataset_inventory.csv`, `data_quality_report.md`,
`study_area.geojson`.

### Phase 2 --- Historical rainfall and satellite-event catalogue

Identify events for which both rainfall information and usable SAR
observations exist.

#### Rainfall processing --- GPM IMERG

Extract:

-   Event total rainfall.
-   Peak rainfall intensity.
-   Mean rainfall intensity.
-   Maximum rolling 1-hour rainfall.
-   Maximum rolling 3-hour rainfall.
-   Maximum rolling 6-hour rainfall.
-   Event duration.
-   Antecedent 24-hour rainfall.
-   Antecedent 72-hour rainfall.
-   Rainfall concentration.

Detect events using a documented dry-gap rule. Test alternative dry-gap
thresholds and retain missing-interval flags.

#### Satellite-event processing

For each candidate event:

1.  Search for a suitable pre-event Sentinel-1 image.
2.  Search for a post-event image.
3.  Check acquisition date and time.
4.  Check orbit direction and relative orbit.
5.  Check VV/VH availability.
6.  Check spatial coverage.
7.  Record whether the image is usable for comparison.

Create `satellite_event_catalogue.csv` with fields such as:

  --------------------------------------------------------------------------------------
  event_id    rainfall_start   rainfall_end   pre_SAR_date   post_SAR_date   usable
  ----------- ---------------- -------------- -------------- --------------- -----------
  E001        Date/time        Date/time      Date           Date            Yes/No

  E002        Date/time        Date/time      Date           Date            Yes/No
  --------------------------------------------------------------------------------------

The rainfall event and SAR acquisition are not necessarily simultaneous.
Record the time difference between rainfall and each SAR image. Do not
label an image acquired days later as the exact peak inundation
condition.

Questions answered:

-   Which historical rainfall events have usable satellite observations?
-   How many independent events are available?
-   How frequently can we observe inundation after rainfall?
-   Which events have both pre-event and post-event observations?

**Deliverable:** `satellite_event_catalogue.csv`

**Decision gate:** If only one or two suitable events are available,
perform a detailed case study, but do not claim robust multi-event
predictive generalisation.

### Phase 3 --- Sentinel-1 preprocessing and inundation extraction

**Objective:** Convert Sentinel-1 SAR imagery into a consistent
water/inundation mask for every usable event.

#### 3.1 Preprocessing

For each selected scene:

1.  Apply orbit-file correction where required.
2.  Remove thermal noise and border noise.
3.  Perform radiometric calibration.
4.  Apply suitable speckle filtering.
5.  Perform terrain correction and geometric alignment.
6.  Check incidence-angle effects and image quality.
7.  Clip to the study boundary.
8.  Ensure pre-event and post-event images have compatible acquisition
    geometry.

If using Google Earth Engine's preprocessed GRD collection, document the
preprocessing already performed and avoid repeating the same steps
blindly.

#### 3.2 Water detection

Potential input bands and features:

-   VV backscatter.
-   VH backscatter.
-   VV/VH ratio.
-   Pre-event VV and VH.
-   Post-event VV and VH.
-   Backscatter change.
-   Terrain slope.
-   Permanent-water reference mask.
-   Land-cover class.

A simplified change feature is:

\[ `\Delta `{=tex}VV=VV\_{`\text{post}`{=tex}}-VV\_{`\text{pre}`{=tex}}
\]

Test threshold-based classification and, if suitable reference labels
exist, a supervised segmentation/classification approach.

#### 3.3 Separate permanent water from new inundation

Create:

-   Permanent-water mask.
-   Pre-event water mask.
-   Post-event water mask.
-   Newly detected water mask.
-   Uncertain/invalid pixel mask.

Conceptually:

\[
W\_{`\text{new}`{=tex}}=W\_{`\text{post}`{=tex}}`\setminus `{=tex}W\_{`\text{permanent}`{=tex}}
\]

Use the pre-event observation and other evidence to distinguish newly
detected water from water already present before the event.

#### 3.4 Urban SAR challenge

Urban flood detection is harder than open-water detection. Buildings,
radar shadows, layover and double-bounce scattering can make flooded
urban areas appear differently from open water.

Therefore:

-   Evaluate built-up and non-built-up areas separately.
-   Use terrain and land-cover information to identify unreliable zones.
-   Keep an uncertainty mask.
-   Compare multiple detection methods.
-   Do not automatically classify every low-backscatter pixel as
    flooded.

**Deliverables:**

-   `pre_event_water_mask.tif`
-   `post_event_water_mask.tif`
-   `permanent_water_mask.tif`
-   `new_inundation_mask.tif`
-   `inundation_confidence_mask.tif`

### Phase 4 --- Construct inundation targets

The previous runoff targets are removed. The new targets are based on
satellite-derived inundation.

#### Target 1 --- Inundation Extent Ratio (IER)

**Primary regression target**

\[ IER\_{g,e}= `\frac{\text{Newly inundated valid area}_{g,e}}`{=tex}
{`\text{Total valid land area}`{=tex}\_{g}} `\times100`{=tex} \]

-   (g): grid cell.
-   (e): event.
-   Unit: percentage.

Question: What percentage of a grid cell was newly inundated during the
satellite observation associated with the rainfall event?

#### Target 2 --- Inundation Occurrence (IO)

**Secondary classification target**

\[ IO\_{g,e}=
```{=tex}
\begin{cases}
1 & \text{if } IER_{g,e}\geq\tau\\
0 & \text{otherwise}
\end{cases}
```
\]

Here (`\tau`{=tex}) is a minimum inundation threshold selected and
documented after considering SAR pixel resolution and classification
uncertainty.

Question: Was newly detected inundation present in this grid cell?

This is a satellite-derived classification label, not independently
verified ground truth.

#### Target 3 --- Observed Inundation Persistence (OIP)

**Conditional target**

If multiple post-event Sentinel-1 acquisitions are available, calculate
the number of subsequent observation dates on which inundation remains
detectable.

Question: Does detected inundation remain visible across subsequent
satellite acquisitions?

Sentinel-1 does not observe continuously. Do not claim exact inundation
duration from intermittent images. Report observation dates, time
intervals and interval-censored persistence, not an exact number of
hours or days of flooding.

#### Final target selection

  -------------------------------------------------------------------------
  Target                  Type                      Priority
  ----------------------- ------------------------- -----------------------
  Inundation Extent Ratio Regression                Primary

  Inundation Occurrence   Binary classification     Secondary

  Observed Inundation     Temporal                  Conditional
  Persistence             classification/analysis   
  -------------------------------------------------------------------------

Begin with IER and IO. Include persistence only if the event catalogue
has enough repeated post-event images.

**Deliverable:** `sar_inundation_targets.csv`

### Phase 5 --- Urban surface feature engineering

Derive a comprehensive feature set for each 250 m grid cell.

#### A. Terrain features --- Copernicus DEM

  Feature               Description
  --------------------- -------------------------------------
  Mean elevation        Average elevation
  Minimum elevation     Lowest elevation
  Maximum elevation     Highest elevation
  Mean slope            Average terrain slope
  Slope variability     Variation in slope
  TPI                   Relative terrain position
  Flow accumulation     Potential upslope contributing area
  Terrain variability   Elevation variation within the cell

#### B. Soil features --- SoilGrids

  Feature               Description
  --------------------- -------------------------
  Clay percentage       Clay composition
  Sand percentage       Sand composition
  Silt percentage       Silt composition
  Clay/sand ratio       Relative soil texture
  Soil organic carbon   Organic carbon content
  Bulk density          Bulk density
  Soil pH               Soil acidity/alkalinity

Start with a few justified depth intervals rather than all 36 columns.
Preserve original source units and scaling information.

#### C. Land-cover features --- ESA WorldCover

  Feature                        Description
  ------------------------------ ------------------------------
  Built-up ratio                 Percentage built-up
  Tree-cover ratio               Percentage tree cover
  Grassland ratio                Percentage grassland
  Cropland ratio                 Percentage cropland
  Bare-ground ratio              Percentage bare ground
  Water ratio                    Percentage water
  Land-cover entropy             Land-cover diversity
  Vegetation-to-built-up ratio   Relative vegetation coverage

#### D. Infrastructure features --- OSM

  -----------------------------------------------------------------------
  Feature                             Description
  ----------------------------------- -----------------------------------
  Road density                        Road length per unit area

  Waterway density                    Mapped waterway length per unit
                                      area

  Distance to nearest waterway        Proximity to mapped water

  Road intersection density           Road-network connectivity proxy

  Waterway proximity                  Distance-based feature

  Building density                    Only if a suitable building layer
                                      is obtained and validated
  -----------------------------------------------------------------------

OSM waterway density does not represent complete underground
stormwater-drain capacity.

#### E. Rainfall-event features --- GPM IMERG

  -----------------------------------------------------------------------
  Feature                             Description
  ----------------------------------- -----------------------------------
  Total rainfall                      Total event precipitation

  Peak intensity                      Maximum rainfall rate

  Mean intensity                      Average event intensity

  Event duration                      Duration of rainfall event

  Maximum 1-hour rainfall             Highest rolling 1-hour amount

  Maximum 3-hour rainfall             Highest rolling 3-hour amount

  Maximum 6-hour rainfall             Highest rolling 6-hour amount

  Antecedent 24-hour rainfall         Rainfall before the event

  Antecedent 72-hour rainfall         Longer antecedent rainfall

  Rainfall concentration              Concentration of rainfall in
                                      shorter intervals
  -----------------------------------------------------------------------

**Deliverables:** `urban_surface_features.csv`,
`rainfall_event_features.csv`.

### Phase 6 --- Urban surface classification

**Learning type:** Unsupervised learning.

**Objective:** Discover statistically distinct urban surface archetypes.

Input:

-   Terrain features.
-   Soil properties.
-   Land-cover proportions.
-   Road and waterway characteristics.

Algorithms:

1.  K-Means.
2.  Agglomerative Hierarchical Clustering.
3.  Gaussian Mixture Models.

Experiments:

-   Feature scaling.
-   Correlation analysis.
-   Feature selection.
-   PCA for dimensionality reduction and visualisation.
-   Cluster-count comparison.
-   Silhouette Score.
-   Davies--Bouldin Index.
-   Calinski--Harabasz Index.
-   Cluster stability analysis.
-   Spatial visualisation.

Possible interpretations after examining results:

-   Dense built-up surfaces.
-   Vegetated surfaces.
-   Low-elevation urban surfaces.
-   Water-adjacent surfaces.
-   Mixed urban surfaces.

These are interpretations, not pre-assigned labels.

Questions answered:

1.  Can Vijayawada be divided into distinct urban surface types?
2.  Which environmental features distinguish those types?
3.  Are certain surface types concentrated near waterways?
4.  Do different clustering algorithms produce similar classifications?

**Deliverable:** `urban_surface_classes.csv`

### Phase 7 --- Rainfall event classification

**Learning type:** Unsupervised learning.

**Objective:** Discover rainfall-event archetypes.

Input:

-   Total rainfall.
-   Peak intensity.
-   Event duration.
-   Rolling rainfall maxima.
-   Antecedent rainfall.
-   Rainfall concentration.

Algorithms:

-   K-Means.
-   Hierarchical Clustering.
-   Gaussian Mixture Models.

Possible interpretations:

-   Short-duration, high-intensity events.
-   Long-duration, moderate-intensity events.
-   High-volume rainfall events.
-   Events following wet antecedent conditions.
-   Intermittent rainfall events.

Questions answered:

1.  Are rainfall events naturally separable into different types?
2.  Does total rainfall alone describe event severity?
3.  Do rainfall duration and intensity create different event groups?
4.  Does antecedent rainfall distinguish otherwise similar events?

**Deliverable:** `rainfall_event_classes.csv`

### Phase 8 --- Build the unified storm--surface--inundation dataset

For each 250 m grid cell and each usable event, combine:

1.  Static terrain features.
2.  Soil features.
3.  Land-cover features.
4.  Infrastructure features.
5.  Urban surface cluster.
6.  Rainfall-event features.
7.  Rainfall event cluster.
8.  SAR-derived inundation targets.
9.  Target confidence and valid-area information.

#### Engineered interaction features

  -----------------------------------------------------------------------
  Feature                             Formula
  ----------------------------------- -----------------------------------
  Built-up × rainfall intensity       Built-up ratio × peak rainfall
                                      intensity

  Vegetation × total rainfall         Vegetation ratio × event rainfall

  Clay × antecedent rainfall          Clay content × antecedent rainfall

  Elevation × rainfall                Elevation × rainfall intensity

  Slope × rainfall                    Slope × rainfall intensity

  Waterway proximity × rainfall       Waterway proximity × event rainfall

  Surface cluster × storm cluster     Categorical combination
  -----------------------------------------------------------------------

These are hypotheses to test. Their inclusion does not prove that one
feature causes inundation.

#### Example unified dataset

  --------------------------------------------------------------------------------------------
  grid_id   event_id     surface_cluster   storm_cluster    built_up rainfall_total   IER
  --------- ---------- ----------------- --------------- ----------- ---------------- --------
  G001      E001                       2               1        0.78 Example          SAR
                                                                                      target

  G002      E001                       0               1        0.24 Example          SAR
                                                                                      target

  G001      E002                       2               0        0.78 Example          SAR
                                                                                      target
  --------------------------------------------------------------------------------------------

Values are illustrative.

**Deliverable:** `storm_surface_inundation_dataset.csv`

### Phase 9 --- Machine-learning experiments

Compare several feature representations rather than train one model and
report one score.

#### Experiment 1 --- Direct baseline

Inputs:

-   Raw terrain features.
-   Soil features.
-   Land-cover features.
-   Infrastructure features.
-   Rainfall features.

Output: Inundation Extent Ratio.

Models:

-   Ridge Regression.
-   Random Forest Regressor.
-   Gradient Boosting Regressor.

#### Experiment 2 --- Feature-engineered model

Inputs: raw features, derived features and selected interactions.

Question: Does feature engineering improve inundation-extent estimation?

#### Experiment 3 --- Hierarchical representation model

Inputs: engineered features, urban surface cluster and rainfall event
cluster.

Question: Does representing the data through surface and rainfall
archetypes improve predictions?

#### Experiment 4 --- Full interaction model

Inputs: engineered features, surface clusters, rainfall clusters and
storm--surface interaction features.

Question: Does the combined representation improve performance compared
with direct regression?

#### Experiment 5 --- Inundation classification

Target: Inundation Occurrence (IO).

Models:

-   Logistic Regression.
-   Random Forest Classifier.
-   Gradient Boosting Classifier.

Metrics:

-   Precision.
-   Recall.
-   F1-score.
-   ROC-AUC.
-   PR-AUC.

Because inundation may be rare, PR-AUC and class-specific recall are
especially important.

#### Experiment 6 --- Persistence analysis

Only if enough repeated SAR observations exist. Investigate whether
terrain, surface characteristics and rainfall properties are associated
with longer observed inundation persistence.

### Phase 10 --- Evaluation, validation and explainability

#### A. Regression evaluation

For Inundation Extent Ratio:

-   MAE.
-   RMSE.
-   R².

Report error distributions across events and surface clusters.

#### B. Classification evaluation

For Inundation Occurrence:

-   Precision.
-   Recall.
-   F1-score.
-   ROC-AUC.
-   PR-AUC.
-   Confusion matrix.

#### C. Generalisation experiments

1.  **Event-held-out validation:** Train on selected events and test on
    entirely unseen events.
2.  **Spatial-block validation:** Train on some geographic blocks and
    test on held-out blocks.
3.  **Combined validation:** Where sufficient data exist, test on unseen
    events and unseen spatial blocks.

Do not randomly split neighbouring SAR pixels across training and test
sets. That can produce severe spatial leakage.

#### D. Ablation study

Remove one feature group at a time:

-   Without terrain.
-   Without soil.
-   Without land cover.
-   Without infrastructure.
-   Without rainfall.
-   Without clustering.
-   Without interaction features.

Measure the effect on regression and classification performance.

#### E. Explainable AI

Use SHAP and suitable feature-importance methods.

Investigate:

-   Which features influence inundation extent?
-   Does built-up coverage influence the relationship between rainfall
    intensity and inundation?
-   Do low-elevation areas show different inundation patterns?
-   Do waterway proximity and terrain features contribute differently
    across surface clusters?
-   Which features are most useful for identifying newly inundated grid
    cells?

**Deliverables:** `model_evaluation_report.md`, `ablation_results.csv`,
SHAP plots, spatial validation maps and event-wise prediction
comparisons.

## 7. Final research questions

  -----------------------------------------------------------------------
  ID                      Research question       Method
  ----------------------- ----------------------- -----------------------
  RQ1                     Can multiple geospatial Dataset engineering
                          datasets be integrated  
                          into a consistent urban 
                          surface dataset for     
                          Vijayawada?             

  RQ2                     Can distinct urban      Unsupervised clustering
                          surface archetypes be   
                          discovered using        
                          terrain, soil, land     
                          cover and               
                          infrastructure?         

  RQ3                     Can rainfall events be  Rainfall clustering
                          grouped into meaningful 
                          storm archetypes using  
                          intensity, duration and 
                          antecedent rainfall?    

  RQ4                     How does                Spatial/statistical
                          satellite-observed      analysis
                          inundation extent vary  
                          across different urban  
                          surface archetypes?     

  RQ5                     Which combinations of   Interaction analysis
                          rainfall and urban      
                          surface characteristics 
                          are associated with     
                          greater inundation      
                          extent?                 

  RQ6                     Does hierarchical       Controlled ML
                          feature representation  experiments
                          improve inundation      
                          prediction compared     
                          with direct regression? 

  RQ7                     Which environmental and SHAP and ablation
                          rainfall features       
                          contribute most to      
                          inundation extent and   
                          occurrence?             

  RQ8                     How well does the model Event and spatial
                          generalise to unseen    validation
                          rainfall events and     
                          unseen spatial areas?   

  RQ9                     Where repeated          Temporal satellite
                          observations exist,     analysis
                          which surface           
                          characteristics are     
                          associated with         
                          persistent inundation?  
  -----------------------------------------------------------------------

### Main research contribution

A multi-source urban surface and satellite-observed inundation dataset
for Vijayawada, coupled with a hierarchical ML framework for
investigating how rainfall-event patterns and urban surface archetypes
relate to inundation extent and occurrence.

## 8. Recommended tools and implementation stack

  Task                        Recommended tools
  --------------------------- -----------------------------------------------------
  Dataset exploration         Python, Pandas, NumPy
  Raster processing           Rasterio, GDAL, Xarray
  Geospatial processing       GeoPandas, Shapely
  SAR processing              Google Earth Engine, SNAP, or documented equivalent
  GIS inspection              QGIS
  Terrain analysis            WhiteboxTools or RichDEM
  Visualisation               Matplotlib, Seaborn, Plotly
  Clustering                  Scikit-learn
  Regression/classification   Scikit-learn, XGBoost (optional)
  Explainability              SHAP
  Notebook environment        Jupyter Notebook / Google Colab
  Version control             Git and GitHub

Documentation:

-   [Google Earth Engine](https://earthengine.google.com/)
-   [NASA Earthdata](https://www.earthdata.nasa.gov/)
-   [Copernicus Data Space](https://dataspace.copernicus.eu/)
-   [ESA SNAP](https://step.esa.int/main/download/snap-download/)
-   [Scikit-learn](https://scikit-learn.org/stable/)
-   [GeoPandas](https://geopandas.org/)
-   [Rasterio](https://rasterio.readthedocs.io/)
-   [SHAP](https://shap.readthedocs.io/)

## 9. Revised GitHub project structure

``` text
DrainSenseAI/
│
├── data/
│   ├── raw/
│   │   ├── rainfall/
│   │   ├── sentinel1/
│   │   ├── dem/
│   │   ├── landcover/
│   │   ├── soil/
│   │   ├── osm/
│   │   └── validation/
│   │
│   ├── interim/
│   │   ├── sar_preprocessed/
│   │   ├── water_masks/
│   │   └── event_catalogue/
│   │
│   ├── processed/
│   │   ├── urban_surface_features/
│   │   ├── rainfall_features/
│   │   ├── inundation_targets/
│   │   └── unified_dataset/
│   │
│   └── metadata/
│
├── notebooks/
│   ├── 01_existing_data_audit.ipynb
│   ├── 02_study_area_grid.ipynb
│   ├── 03_rainfall_event_detection.ipynb
│   ├── 04_sentinel1_event_search.ipynb
│   ├── 05_sentinel1_preprocessing.ipynb
│   ├── 06_inundation_detection.ipynb
│   ├── 07_target_construction.ipynb
│   ├── 08_feature_engineering.ipynb
│   ├── 09_surface_clustering.ipynb
│   ├── 10_rainfall_clustering.ipynb
│   ├── 11_unified_dataset.ipynb
│   ├── 12_regression_experiments.ipynb
│   ├── 13_classification_experiments.ipynb
│   ├── 14_ablation_study.ipynb
│   └── 15_explainability.ipynb
│
├── src/
│   ├── data_collection/
│   ├── preprocessing/
│   ├── satellite_processing/
│   ├── inundation_detection/
│   ├── feature_engineering/
│   ├── clustering/
│   ├── target_construction/
│   ├── modeling/
│   └── evaluation/
│
├── models/
├── reports/
│   ├── figures/
│   ├── maps/
│   ├── tables/
│   └── final_report/
│
├── configs/
├── requirements.txt
└── README.md
```

## 10. Critical research limitations and safeguards

### 10.1 SAR-derived inundation is not ground truth

Sentinel-1 produces radar observations from which we infer water extent.
The resulting mask is a satellite-derived label, not a field-verified
flood map.

The September 2024 APSAC/NRSC map explicitly states that its inundation
results are preliminary and not ground-verified. It also notes that
mapped water may include rainwater accumulation in low-lying areas.

Use terminology such as:

-   Satellite-observed inundation.
-   SAR-derived water extent.
-   Newly detected inundation.
-   Satellite-derived inundation occurrence.

Avoid claiming every detected water pixel is confirmed floodwater.

### 10.2 Urban flood detection is difficult

Radar interactions with buildings can hide or alter the appearance of
floodwater. A single threshold-based method may not work consistently
across the city.

Use uncertainty masks, separate urban/non-urban evaluation and
sensitivity analysis.

### 10.3 Cross-sensor comparisons

The September 2024 official map uses RISAT-1A for its pre-event
observation and Sentinel-1A for its post-event observation. These are
different radar systems.

Do not directly compare their raw backscatter values as if they were
identical. Prefer same-sensor, same-orbit Sentinel-1 pre/post pairs for
the primary detection workflow. The official map remains useful as a
historical reference.

### 10.4 Rainfall resolution

GPM IMERG is approximately 10 km, while the inundation analysis grid is
250 m.

Rainfall features will be shared across many smaller grid cells. Account
for repeated event-level information and spatial dependence when
splitting and evaluating the data.

### 10.5 Limited historical observations

The current IMERG download is incomplete. Extend the collection and
verify the Sentinel-1 archive before committing to the number of events.

### 10.6 Avoid circular validation

If an inundation mask is derived from a particular Sentinel-1 image, an
official flood map produced from that same image cannot be treated as
fully independent ground truth.

Use official maps for reference and consistency checks, but seek
independent field reports, georeferenced photographs, gauge information
or other observations for stronger validation.

### 10.7 No ERA5-Land dependency

ERA5-Land is excluded from this research plan. Do not reintroduce its
variables into the unified dataset or use its outputs to validate
satellite-derived inundation.

## 11. Final execution roadmap

  -----------------------------------------------------------------------
  Stage                   Task                    Output
  ----------------------- ----------------------- -----------------------
  1                       Audit and clean         Validated static data
                          existing datasets       

  2                       Complete GPM historical Rainfall time series
                          collection              

  3                       Build Sentinel-1        Satellite event
                          acquisition catalogue   catalogue

  4                       Select usable pre/post  Event image pairs
                          image pairs             

  5                       Process SAR imagery     Preprocessed SAR images

  6                       Extract water and       Inundation rasters
                          inundation masks        

  7                       Construct inundation    Target dataset
                          targets                 

  8                       Build urban surface     Surface feature dataset
                          features                

  9                       Perform surface         Surface archetypes
                          clustering              

  10                      Perform rainfall        Storm archetypes
                          clustering              

  11                      Integrate all datasets  Unified dataset

  12                      Train regression and    Experimental results
                          classification models   

  13                      Perform validation and  Robustness results
                          ablation                

  14                      Explain and interpret   SHAP and research
                          predictions             findings

  15                      Prepare the research    Final paper and
                          report                  documentation
  -----------------------------------------------------------------------

## 12. First milestone --- September 2024 Vijayawada SAR feasibility study

Do not begin with full ML implementation. First prove that the
satellite-observation pipeline works.

### Tasks

1.  Obtain a suitable pre-event Sentinel-1 image.
2.  Obtain the 13 September 2024 post-event Sentinel-1 image.
3.  Check whether both images cover the same study area and have
    compatible orbit geometry.
4.  Obtain corresponding GPM rainfall time series.
5.  Process the two SAR images.
6.  Generate a preliminary inundation mask.
7.  Compare results with the APSAC/NRSC map.
8.  Document detection uncertainty and differences.

### Success criteria

-   Valid pre/post imagery is available.
-   Water detection produces a spatially coherent result.
-   Permanent water can be distinguished from newly detected water with
    documented uncertainty.
-   The result can be aggregated to the proposed 250 m grid.
-   Rainfall and satellite observations can be associated with a
    documented event window.

If this pilot works, expand to other historical events. If it fails
because of urban SAR limitations, adjust the detection strategy before
investing in the full ML pipeline.

## 13. Final research direction

**DrainSenseAI is a multi-source urban surface and satellite-observed
inundation research project---not a generic flood/no-flood prediction
system.**

Its three main components are:

1.  **Original dataset engineering:** Integrate terrain, soil, land
    cover, infrastructure, rainfall and SAR observations into a
    documented Vijayawada dataset.
2.  **Hierarchical environmental analysis:** Discover urban surface and
    rainfall-event archetypes and investigate their interactions.
3.  **Satellite-based ML experiments:** Estimate inundation extent and
    occurrence, evaluate generalisation, and explain environmental
    factors associated with predictions.

The immediate priority is proving that reliable inundation targets can
be constructed from Sentinel-1 across enough independent historical
events.

That will determine whether the project can support a credible
multi-event ML study or should remain a detailed satellite-based case
study.
