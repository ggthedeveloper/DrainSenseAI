PROJECT REPORT ON

DrainSenseAI

Urban Flood Nowcasting and Municipal Resource Dispatch System: A Physics-Informed Three-Tier Machine Learning Pipeline for Vijayawada

PROJECT

OF

MACHINE LEARNING

Submitted by: -

Alok Raj             AP24110010335

Gaurav Gautam      AP24110010133

Ansh Shukla         AP24110011321

Aniket Mahto      AP24110011701

Under the guidance of

Dr. Sanjay Kumar

Assistant Professor,

Department of Computer Science and Engineering

SRM University, AP

Prepared in the partial fulfilment of the requirements for the award of the degree of

Bachelor of Technology in Computer Science and Engineering.

SRM UNIVERSITY, AP

Amaravati, Andhra Pradesh

NOVEMBER 2026

CERTIFICATE

This is to certify that the project report entitled “DrainSenseAI: Urban Flood Nowcasting and Municipal Resource Dispatch System: A Physics-Informed Three-Tier Machine Learning Pipeline for Vijayawada” is a bonafide record of the work carried out by Alok Raj (AP24110010335), Gaurav Gautam (AP24110010133), Ansh Shukla (AP24110011321) and Aniket Mahto (AP24110011701), students of the Department of Computer Science and Engineering, SRM University-AP, Andhra Pradesh, in partial fulfilment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering.

The work was carried out under my supervision and guidance and has satisfactorily met the requirements of the project.

(Signature)

Dr. Sanjay Kumar

Assistant Professor

Department of Computer Science and Engineering

SRM University-AP

ACKNOWLEDGEMENT

We are very thankful to our project guide, Dr. Sanjay Kumar, Assistant Professor, Department of Computer Science and Engineering, SRM University-AP, for his guidance through out this project. His questions about how our data was split and where our labels came from pushed us to check our results more carefully and to report it honestly.

We would also like to thank the Head of the Department of Computer Science and Engineering and the management of SRM University-AP for providing good academic environment and the computing resources we needed for this work.

We are grateful to the Central Water Commission for making it's rainfall and river-level records available through India-WRIS, and to the European Space Agency for the open Copernicus elevation model. We also thank the developers of scikit-learn, XGBoost, pandas, FastAPI, Next.js and Leaflet, on whose open-source work this project is built.

Lastly, we thank our classmates and our families for their support and encouragement throughout the project.

Alok Raj (AP24110010335)

Gaurav Gautam (AP24110010133)

Ansh Shukla (AP24110011321)

Aniket Mahto (AP24110011701)

ABSTRACT

Heavy rain in Vijayawada floods some neighbourhoods long before others, and the city's drains stop emptying when the Krishna River stands high at Prakasam Barrage. Municipal teams therefore needs to know, before water collects, which small parts of the city are most at risk and what kind of failure is likely there. DrainSenseAI is our attempt to build that kind of a decision-support tool. It divide the study area into 1,100 grid cells of 250 m × 250 m and, for a given 24-hour rainfall and barrage water level, gives every cell a flood probability, a five-level alert, a likely failure mechanism and a terrain type.

The terrain of each cell comes from the Copernicus GLO-30 elevation model, and the storm inputs come from Central Water Commission rain gauges and the Prakasam Barrage water-level record for 2021 to 2025. Because no observed flood maps exists for these storms, the training labels are produced by a physics-based scoring rule that combines SCS Curve Number runoff, drain capacity, a topographic trap index and a river backwater term. Joining 1,100 cells with 101 rain events gives 111,100 labelled rows, of which 21.0% are flooded. The events are split by date into 70 training, 15 validation and 16 test storms, so the test set (July to October 2025) contains only storms the models never saw.

We compared six classifier on the 17,600 test rows. Raw XGBoost was the strongest overall (F1 0.9547, ROC-AUC 0.9986, Brier score 0.0203). The deployed model, XGBoost with three-fold sigmoid (Platt) calibration, gave the fewest false alarms (58 of 11,699 safe rows, precision 98.88%) but missed more flooded rows (recall 87.14%, F1 0.9264) and was less well calibrated (Brier 0.0638). A Random Forest assigns the failure mechanism with 95.14% accuracy, and K-Means separates the city into four terrain archetypes. An extra check showed that an unrestricted decision tree recovers 97.38% of the test labels from the same nine features, which means the models mainly learn the physics rule rather than independent flood evidence.

The trained models runs behind a FastAPI service with 26 routes and a Next.js map dashboard that shows risk, elevation and flow layers, a rainfall-scaled nowcast timeline, a priority queue and a rule-based equipment dispatch plan. Our main conclusion is that the system work end to end and reproduces its physics-based risk index on unseen storms, but its accuracy figures describe agreement with that index, not with real floods. Satellite flood maps and barrage data for 2024 to 2025 are needed before it can be validated as a flood predictor.

Keywords: urban flooding, flood risk nowcasting, XGBoost, Platt calibration, SCS Curve Number, topographic position index, chronological split, physics-informed machine learning, Vijayawada.

TABLE OF CONTENTS

CERTIFICATE	i

ACKNOWLEDGEMENT	ii

ABSTRACT	iii

LIST OF FIGURES	vi

LIST OF TABLES	vii

LIST OF ABBREVIATIONS	viii

1. Introduction	1

1.1 Background and Motivation	1

1.2 Problem Statement	1

1.3 Research Questions	1

1.4 Scope of the Project	2

1.5 Scientific Novelty and Research Contributions	2

1.6 Organisation of the Report	3

2. Aim and Objectives	4

2.1 Project Objectives	4

3. Literature Review	5

3.1 Machine Learning for Flood Prediction	5

3.2 Rainfall-Runoff Modelling with the SCS Curve Number	5

3.3 Terrain Analysis for Flood Susceptibility	5

3.4 Physics-Guided Machine Learning	5

3.5 Evaluating Models on Spatio-Temporal Data	6

3.6 Probability Calibration and Flood Mapping from Satellites	6

3.7 Summary of Related Work and Research Gap	6

4. Theoretical Background	7

4.1 SCS Curve Number Runoff	7

4.2 Topographic Position and Trap Index	7

4.3 Drain Capacity and River Backwater	7

4.4 Physics-Based Flood Score	8

4.5 Classification Models	8

4.6 Evaluation Metrics	9

4.7 Manning's Equation for Flow Routing	9

5. Datasets and Requirement Analysis	10

5.1 Study Area and Spatial Grid	10

5.2 Datasets	11

5.3 Functional Requirements	15

5.4 Non-Functional Requirements	16

5.5 Software and Hardware Requirements	16

6. Methodology and System Architecture	17

6.1 System Architecture	17

6.2 Offline Pipeline Workflow	17

6.3 Data Preprocessing	18

6.4 Label Construction	20

6.5 Feature Engineering	22

6.6 Feature Selection	23

6.7 Chronological Train, Validation and Test Split	24

6.8 Three-Tier Model Design	25

7. Implementation	26

7.1 Project Structure	26

7.2 Data Preparation Module	26

7.3 Training Module	26

7.4 Inference Service	27

7.5 Rule-Based Decision-Support Engines	27

7.6 Backend API	28

7.7 Frontend Dashboard	28

7.8 Testing	30

8. Experimental Setup	31

9. Results and Analysis	32

9.1 Tier 1: Terrain Archetypes	32

9.2 Tier 2: Binary Classifier Benchmark (RQ1)	32

9.3 The Effect of Calibration (RQ2)	35

9.4 Feature Importance	37

9.5 Error Analysis by Event	38

9.6 How Recoverable Is the Label?	38

9.7 Tier 3: Failure-Mode Attribution (RQ3)	39

9.8 Summary of Findings	40

10. Discussion	41

10.1 What the Accuracy Figures Mean	41

10.2 Choosing the Production Model	41

10.3 Data Limitations that Shape the Results	41

10.4 What Worked Well	41

11. Limitations	42

12. Future Scope	43

13. Conclusion	44

References	45

Appendix A: Reproducing the Results	47

Appendix B: Backend Routes	48

Appendix C: Diagnostic Script	49

LIST OF FIGURES

Figure 5.1: Copernicus GLO-30 source tile with the study boundary (black outline)	10

Figure 5.2: Copernicus GLO-30 elevation clipped to the study boundary (UTM 44N)	11

Figure 5.3: Mean elevation of each 250 m cell	12

Figure 5.4: Slope in degrees computed from the DEM	12

Figure 5.5: Topographic position index with a 7 × 7 window (about 210 m)	13

Figure 5.6: Locations of the seven CWC rain gauges relative to the study grid	14

Figure 5.7: Prakasam Barrage water-level record and the stage assigned to each event	15

Figure 6.1: Layered architecture of DrainSenseAI	17

Figure 6.2: Offline data and model pipeline	18

Figure 6.3: Derived static features across the grid	20

Figure 6.4: Construction of the flood label and the failure-mode label for one cell and event	21

Figure 6.5: Class balance of the training matrix and number of events in each rainfall tier	21

Figure 6.6: Number of cells labelled flooded in each event against event rainfall	22

Figure 6.7: Pearson correlation between the nine production features and the flood label (training rows)	23

Figure 6.8: Event timeline coloured by split	24

Figure 6.9: Three-tier inference for one rainfall and barrage-stage scenario	25

Figure 7.1: Dashboard risk layer for the 23 July 2022 heavy-storm scenario	29

Figure 7.2: Dashboard elevation layer and city summary for the 30 October 2025 event	29

Figure 7.3: Dashboard flow-index layer	30

Figure 9.1: K-Means archetypes plotted by mean elevation and impervious ratio	32

Figure 9.2: Benchmark comparison of the six classifiers on the test set	33

Figure 9.3: ROC curves of the six classifiers on the test set	34

Figure 9.4: Precision-recall curves of the six classifiers on the test set	34

Figure 9.5: Confusion matrices of the six classifiers on the test set	35

Figure 9.6: Confusion matrix of the production calibrated XGBoost	35

Figure 9.7: Reliability diagram of raw and calibrated XGBoost on the test set	36

Figure 9.8: Brier score (left) and training time (right) of each classifier	37

Figure 9.9: Gain-based feature importance of the raw XGBoost model	37

Figure 9.10: False alarms and missed floods of logistic regression and the decision tree in each test event	38

Figure 9.11: Test accuracy of simple rules and unrestricted trees compared with the benchmark	39

Figure 9.12: Tier 3 precision, recall and F1 by failure class	39

LIST OF TABLES

Table 3.1: Summary of the most relevant prior work	6

Table 5.1: Data files in the project and their role	11

Table 5.2: Static features of the 1,100 grid cells	15

Table 5.3: Software environment (versions pinned in requirements.txt and package.json)	16

Table 6.1: Data quality problems and how the pipeline handles them	18

Table 6.2: Event tiers in the training matrix	19

Table 6.3: Candidate features and how each is computed	22

Table 6.4: Results of the wrapper feature-selection methods	23

Table 6.5: Nine production features	24

Table 6.6: Chronological split	24

Table 7.1: Main folders and files of the implementation	26

Table 7.2: Rule-based components and how they work	27

Table 7.3: Main backend routes	28

Table 7.4: Automated tests	30

Table 8.1: Experimental settings	31

Table 9.1: Tier 1 K-Means clusters (cluster means)	32

Table 9.2: Binary classifier results on the 17,600 test rows	33

Table 9.3: Production model on the test set	36

Table 9.4: Tier 3 per-class results on the test set	39

Table 9.5: Answers to the research questions	40

Table B.1: All 26 backend routes	48

LIST OF ABBREVIATIONS


# 1. Introduction


Urban flooding in Indian cities is usually not one large river overtopping it's banks. More often, intense rain falls on paved ground, the storm drains fills, and water collects in lowest streets and colonies within a few hours. In a river city the problem has a second layer: when the river is high, the drains cannot discharge in to it, and water which would normally leave the city backs up instead. Vijayawada, on the Krishna River with the Budameru rivulet running through its northern wards, has both the problems.

This report describes DrainSenseAI, a machine learning project that try to give municipal engineers an early, cell-by-cell picture of flood risk for Vijayawada. The system is combining open terrain data, Central Water Commission (CWC) rain and river records, a set of hydrological formulas and three machine learning models, and serves the result through a web dashboard. The report explains how the data was prepared, how the training labels were made, how the models was trained and tested, and what the results does and does not show.


## 1.1 Background and Motivation


Between 31 August and 2 September 2024 Vijayawada had one of the worst floods in its history. The Krishna River carried a record 11.43 lakh cusecs through Prakasam Barrage on 2 September, the highest flow since the barrage was built in 1957 [1]. At same time the Budameru rivulet breached and flooded the low-lying colonies around Singh Nagar, and because the river was so high, the Budameru could not drain into it [2]. This combination of local rain, a choked rivulet and a high river is exactly the kind of situation in which a ward-level warning would helps.

India's national guidelines on urban flooding asks cities to build local early-warning capability and to plan drainage and response at the level of individual wards and catchments [3]. Studies of other Indian cities, such as the analysis of Mumbai's 2005 flood, also shows that much of the damage come from local drainage failure rather than from the main river [4]. In practice, however, most of cities have no dense network of street-level water sensors, so there is no record of exactly which streets flooded in which storm. This lack of observed outcomes are the main difficulty for any data-driven approach and it shapes whole design of this project.


## 1.2 Problem Statement


We wanted to built and evaluate a system that answer the following question for every 250 m cell of Vijayawada:

Given the terrain of a cell, the 24-hour rainfall and the water level at Prakasam Barrage, how likely is the cell to be waterlogged, which physical mechanism is most likely responsible, and how should limited municipal resources be prioritised across the city?

Because no observed flood maps was available for the storms in our data, project first had to construct training labels from hydrological principles and then train models on them. A second, equally important part of problem was to evaluate those models honestly, without letting informations from a test storm leak into training.


## 1.3 Research Questions


The work is organised around three research question:

- RQ1 (prediction on unseen storms): When the data are split strictly by date, how well do standard classifiers (logistic regression, decision tree, random forest and XGBoost) reproduce the flood label on storms from a later season, and which of them is best?

- RQ2 (calibration and deployment choice): What does three-fold sigmoid (Platt) calibration change in XGBoost's behaviour, in terms of false alarms, missed floods and probability quality, and is the calibrated model the right choice for an alert system?

- RQ3 (structure and attribution): Can unsupervised clustering separate the city into meaningful terrain types, and how well can a multi-class model identify the dominant failure mechanism behind each flood label? A related check is how much of the label is simply recoverable from the input features.


## 1.4 Scope of the Project


The project cover one city and one spatial resolution. Specifically, it include:

- a study area of 1,100 grid cells (250 m × 250 m, UTM zone 44N) covering Vijayawada and the adjoining Krishna and Budameru corridors;

- 101 rain events between July 2021 and October 2025 (81 wet days selected from the CWC rainfall record and 20 added dry days);

- a physics-based labelling procedure, nine model features, and six binary classifiers plus a K-Means model and a multi-class Random Forest;

- a FastAPI backend and a Next.js dashboard that use the trained models, together with several rule-based tools (nowcast timeline, downstream cascade, physics audit and dispatch planning).

Several thing are outside the scope of this version. The project does not solve two-dimensional hydraulic flow equations, does not use observed flood extents, and does not include live sensor feeds. The dashboard's other-city options and the satellite (Sentinel-1) labelling work in the repository are only planned or partially started and we are treating them as future work.


## 1.5 Scientific Novelty and Research Contributions


In contemporary machine learning research applied to urban flood prediction, merely training an off-the-shelf gradient boosted classifier on raw tabular figures is not a novel scientific contribution. Published literature in data-driven flood hazard mapping frequently suffers from two foundational flaws: (1) circular synthetic labelling, wherein models memorize mathematical definitions rather than capturing physical hydrological complexity; and (2) fraudulent spatiotemporal data leakage, wherein standard random train-test splitting leaks regional storm weather across shared dates, producing inflated 99% accuracy figures that catastrophic collapse when deployed on unseen future storms.

DrainSenseAI 2.0 directly confronts these methodological bottlenecks through four distinct, defensible pillars of scientific and engineering novelty:


### 1.5.1 The Four Novelty Pillars of DrainSenseAI 2.0


- •  Pillar 1 — Multi-Source Spatiotemporal Dataset Coupling and Nearest-Neighbor Imputation: A unified 111,100-sample spatiotemporal matrix cross-joining 1,100 spatial cells (250 m × 250 m) with 101 historical storm and baseline events (2021–2025). The data engineering pipeline introduces a physical 1-hop nearest-neighbour gradient imputation for 12 boundary cells (preserving terrain slope continuity and flagged with imputed = 1), alongside the systematic injection of 20 verified dry baseline days (0 mm rainfall, 3.40 m river stage) to constrain positive reporting bias and establish an unbiased 21.0% flood base rate (1:4 ratio).

- •  Pillar 2 — Coupled Atmospheric Infiltration and Riverine Hydraulic Backwater Choking: The first machine learning formulation for Indian riverine catchments that couples atmospheric precipitation (via USDA SCS-CN overland runoff equations) with downstream hydraulic backpressure at Prakasam Barrage (when river stage exceeds 5.5 m). This captures the compound pluvial-fluvial disaster mechanism observed during the catastrophic September 2024 Vijayawada deluge, where record Krishna River discharge prevented urban drainage outfalls from discharging.

- •  Pillar 3 — Zero-Leakage Chronological Benchmark Architecture: A rigorous date-partitioned evaluation protocol (70% train: July 2021 – May 2024; 15% validation: May 2024 – June 2025; 16 test holdout storms: July – October 2025). Standardisation scalers are isolated strictly to training events. Benchmark results prove that while a stratified chance-level baseline yields ROC-AUC 0.4982, raw XGBoost achieves 0.9986 ROC-AUC and 0.9547 F1 on completely unseen future storms from a distinct subsequent monsoon season.

- •  Pillar 4 — Actionable Multi-Target Root-Cause Attribution & Volumetric Deficit (m³): Moving beyond binary classification by deploying a Tier 3 Random Forest that attributes the predominant physical failure mode with 95.14% test accuracy (SURFACE_RUNOFF_CHOKE, DEPRESSION_TRAP, BARRAGE_BACKWATER, DRAINAGE_DEFICIT) and computes continuous physical excess runoff volumes (runoff_excess_volume_m3) to directly inform municipal dewatering pump sizing and dispatch.


### 1.5.2 Detailed Physical Grounding of the Novelty Pillars


Pillar 1 couples high-resolution terrain characteristics from the Copernicus GLO-30 Digital Elevation Model with five years of CWC rain gauge records and Prakasam Barrage telemetry. Spatial boundary cells that intersect raster edges are imputed from the geometrically nearest valid neighbour at 250 m distance, ensuring continuous slope gradients without introducing artificial sea-level sinks. The addition of 20 dry baseline events (0 mm rainfall, 3.40 m river stage) ensures the classifiers are exposed to non-storm conditions, preventing systematic false-positive drift.

Pillar 2 models compound hydraulic interactions through an explicit backwater penalty term (B) and a topographic trap index (T). When Prakasam Barrage water level (H) reaches or exceeds 5.5 m, cells located within distance d < 2000 m from the Krishna River or Budameru rivulet corridors experience backwater choking:

B = (2000 - d) / 2000   for H >= 5.5 m and d < 2000 m;   B = 0 otherwise

The topographic trap index blends absolute elevation depression with multiscale Topographic Position Index (TPI-7, ~210 m radius):

T = 0.6 * clip((22 - z) / 14, 0, 1) + 0.4 * clip(-TPI_7 / 5, 0, 1)

This mathematical formulation captures the physical mechanism of the 31 August – 2 September 2024 Vijayawada flood, in which record Krishna River discharge (>11.43 lakh cusecs) produced sustained hydraulic backpressure that submerged Ajit Singh Nagar and surrounding northern colonies under 2 to 3 metres of water.

Pillar 3 eliminates the universal temporal leakage flaw present in traditional random cross-validation. In urban flood settings, all grid cells share regional weather on any given storm day; randomly shuffled cross-validation allows models to memorize the day's rainfall and test on neighbouring cells from the same storm. Our chronological split partitions the 101 storms by date into 70 training events (77,000 samples), 15 validation events (16,500 samples), and 16 unseen test events (17,600 samples) occurring between July and October 2025. Standardisation parameters are fitted strictly on the training partition, guaranteeing zero leakage of test distribution statistics.

Pillar 4 provides actionable decision support by combining classification with continuous volumetric deficit estimation. The excess volume of runoff that exceeds local conduit capacity is computed as:

runoff_excess_volume_m3 = max(0, Q - 12 * D) * Cell_Area

where Q is SCS Curve Number direct runoff (mm), D is drainage density (km/km²), and Cell_Area is 62,500 m². This allows municipal disaster response teams (NDRF/SDRF) to size and deploy dewatering equipment dynamically based on cubic metres of standing water rather than guessing from a dimensionless probability.


### 1.5.3 Comparison with Prior Art and Academic Literature


Table 1.1 provides a systematic comparison between standard literature practices, the initial DrainSenseAI prototype, and the DrainSenseAI 2.0 system presented in this report.


*Table 1.1: Scientific novelty and methodological comparison with prior art*



### 1.5.4 Summary Defense Statement for Academic and Viva Review


To substantiate the originality of this project during technical viva and academic defense panels, the core research contribution is summarized as follows:

"Our primary contribution is not merely training an XGBoost algorithm. It is the creation and validation of a physics-coupled spatiotemporal dataset (111,100 samples) that solves three universal failures in urban flood AI: (1) it eliminates data leakage by implementing chronological storm-event splitting, proving true generalisation on unseen 2025 storms; (2) it couples atmospheric rainfall with downstream river-stage telemetry at Prakasam Barrage, modelling the backwater choking that caused the September 2024 Vijayawada disaster; and (3) it transitions AI output from a useless binary score to multi-class root-cause attribution (95.14% accuracy), telling municipal engineers whether an alert requires dewatering pumps, flap-gate closures, or underpass evacuations."


## 1.6 Organisation of the Report


Chapter 2 set out the aim and objectives. Chapter 3 reviews related work and Chapter 4 explains the hydrological and machine learning theory that the system uses. Chapter 5 describes the datasets and the requirements, and Chapter 6 presents the methodology and system architecture, including how the labels were built. Chapter 7 cover the implementation, Chapter 8 the experimental setup, and Chapter 9 the results. Chapter 10 discusses the findings, and Chapters 11, 12 and 13 cover limitations, future scope and the conclusion. The references and appendices are followed.


# 2. Aim and Objectives


The aim of this project is to built an end-to-end system that estimates urban flood risk for every 250 m cell of Vijayawada from terrain, rainfall and river-level inputs, and to evaluate the machine learning part of that system in a way that reflects how it would be used: on storms that happen after the training data were collected.


## 2.1 Project Objectives


We have split the aim in six objectives. Each one are linked to a part of code and to a section of this report.

Objective 1: Build a clean spatio-temporal dataset

Process the Copernicus DEM into per-cell terrain statistics, clean the CWC rainfall and barrage records, and join the 1,100 cells with a set of rain events into one training matrix (Sections 5.2 and 6.3).

Objective 2: Construct physically meaningful labels

Because no observed flood map exist, derive a binary flood label and a failure-mode label for each cell and event from SCS-CN runoff, drain capacity, a trap index and a backwater term (Section 6.4).

Objective 3: Engineer and select features

Derive terrain, surface and hydrological features and choose a compact production set using filter and wrapper methods (Sections 6.5 and 6.6).

Objective 4: Train and compare models without leakage

Split the events by date, fit five baseline classifiers and a calibrated XGBoost, and evaluate all of them once on the later test storms (Sections 6.7, 8 and 9.2).

Objective 5: Add structure and attribution

Group cells into terrain archetypes with K-Means and predict the dominant failure mechanism with a multi-class Random Forest (Sections 9.1 and 9.6).

Objective 6: Deliver a usable prototype

Expose the models through a REST API and an interactive map dashboard, with alert levels, priorities and an equipment plan for operators (Chapter 7).


# 3. Literature Review


This chapter place the project within the earlier work on flood prediction with machine learning, rainfall-runoff modelling, terrain analysis, physics-guided learning, evaluation of models on spatio-temporal data and probability calibration.


## 3.1 Machine Learning for Flood Prediction


Machine learning have been used widely for flood prediction and flood susceptibility mapping. Mosavi et al. reviewed a large body of this work and found that artificial neural networks, support vector machines, decision trees and ensemble methods were the most common choices, with ensembles and hybrid models often performing best [5]. Susceptibility studies typically combines terrain layers such as elevation, slope and distance to rivers with land-use and soil data inside a GIS, and train a classifier on an inventory of past flood locations. Tehrany et al., for example, combined a weights-of-evidence model with a support vector machine to map flood susceptibility [6]. A common feature of these studies is that they rely on an inventory of observed flood points; our project did not had such an inventory, which is the main difference from most of this literature.


## 3.2 Rainfall-Runoff Modelling with the SCS Curve Number


The SCS Curve Number (SCS-CN) method, documented in the USDA National Engineering Handbook, estimate direct runoff from a storm's rainfall using a single number which summarise soil type and land cover [7]. Mishra and Singh gives a detailed treatment of the method and its many extensions [8]. Two extension matter for this project. First, the initial abstraction ratio λ, traditionally 0.2, has been re-examined, and smaller values have been proposed from observed rainfall-runoff data [9]. Second, the Curve Number can be adjusted for slope; Huang et al. proposed the slope correction that our code uses [10].


## 3.3 Terrain Analysis for Flood Susceptibility


The topographic position index (TPI) compare the elevation of a point with the mean elevation of its neighbourhood, so negative values mark valleys and depressions and positive values mark ridges [11]. Computed at several window sizes, it give a multi-scale picture of where the water is likely to collect. Flow-routing methods such as the eight-direction steepest-descent (D8) algorithm trace the path that water takes across a DEM [12], and Manning's equation gives a standard estimate of flow velocity in open channels [13]. Our project uses TPI and a trap index as model features and uses a D8-style search with Manning velocities in a separate, rule-based cascade tool.


## 3.4 Physics-Guided Machine Learning


Karpatne et al. argued that combining scientific theory with data-driven models can gives results that are more consistent with known physics and generalise better, especially when data are limited [14]. Reichstein et al. made a similar case for Earth-system science, noting that purely data-driven models can fit observations well while still violating physical constraints [15]. These ideas motivates the hydrological features in DrainSenseAI. However, in our case physics is used not only to build features but also to build the labels, which changes how the results should be interpreted (Section 10.1).


## 3.5 Evaluating Models on Spatio-Temporal Data


When samples is correlated in space or time, random cross-validation can give optimistic estimates because nearly identical samples end up in both training and test folds. Roberts et al. recommend blocking the data along the dimension of dependence, for example by time period or spatial block, so that the test data are genuinely independent [16]. In our matrix all 1,100 cells share the same rainfall and river level on a given day, so a random split will put almost identical rows in both set. We therefore split by event date.


## 3.6 Probability Calibration and Flood Mapping from Satellites


Many classifiers produces scores that rank cases well but are not reliable probabilities. Platt proposed fitting a sigmoid to classifier scores to turn them into probabilities [17], and Niculescu-Mizil and Caruana compared sigmoid and isotonic calibration across several learners, including boosted trees [18]. The Brier score is a standard measure of how close predicted probabilities are to the observed outcomes [19]. For observed flood extents, synthetic aperture radar (SAR) is the most widely used source because it sees through cloud; Twele et al. described a fully automated Sentinel-1 flood-mapping chain [20]. Such maps is the natural source of real labels for a future version of this project.


## 3.7 Summary of Related Work and Research Gap



*Table 3.1: Summary of the most relevant prior work*


Taken together, earlier work gives well-tested pieces (runoff formulas, terrain indices, tree ensembles, calibration and blocked evaluation) but usually assume that observed flood locations is available for training and testing. For many Indian cities that assumption does not hold. Our project explore what can be build and honestly evaluated when the labels must instead come from hydrological rules, and it makes the consequences of that choice explicit.


# 4. Theoretical Background


This chapter explain the formulas used in data pipeline, the labelling rule and the models. Throughout, P is the 24-hour rainfall of an event in millimetres, H is the Prakasam Barrage water level in metres, and each sample is one grid cell during one event.


## 4.1 SCS Curve Number Runoff


The SCS-CN method relate direct runoff Q (mm) to rainfall P through the potential maximum retention S (mm) and the initial abstraction Ia (mm), which is the rain lost to interception and surface wetting before runoff starts [7]:

S = 25400 / CN − 254	(4.1)

Ia = λ · S,   λ = 0.18	(4.2)

Q = (P − Ia)2 / (P − Ia + S)  if P > Ia;   Q = 0 otherwise	(4.3)

The project use λ = 0.18 instead of the textbook 0.2, following the literature that questions the standard ratio [9]. A higher Curve Number mean less retention and therefore more runoff; CN = 98 corresponds to an almost fully paved surface.


### 4.1.1 Composite and Slope-Adjusted Curve Number


Each cell are treated as a mix of pervious ground with a soil-dependent Curve Number CNsoil and impervious surface with CN = 98, weighted by the impervious fraction fimp. The result is then adjusted for slope using the correction of Huang et al. [10], where α is the slope in percent:

CNc = CNsoil · (1 − fimp) + 98 · fimp	(4.4)

CNα = CNc · (322.79 + 15.63 α) / (α + 323.52)	(4.5)

In the code the adjusted value is clipped in the range 55 to 98.


## 4.2 Topographic Position and Trap Index


The topographic position index of a pixel compares its elevation z0 with the mean elevation of the Nr pixels in a window of radius r [11]:

TPIr = z0 − (1 / Nr) · Σi=1..N_{r} zi	(4.6)

The project compute TPI with 3, 7 and 11 pixel windows (about 90 m, 210 m and 330 m) and then averages it over each 250 m cell. A topographic trap index between 0 and 1 combines how low a cell is with how bowl-shaped it is:

T = 0.6 · clip((22 − z) / 14, 0, 1) + 0.4 · clip(−TPI7 / 5, 0, 1)	(4.7)

Here z is the cell's mean elevation in metres. The first term is 1 for cells at or below 8 m and 0 above 22 m; the second term is non-zero only for cells which sits below their 210 m neighbourhood.


## 4.3 Drain Capacity and River Backwater


The labelling rule assume that each kilometre of drain per square kilometre remove 12 mm of runoff, so the runoff that exceeds the local drain capacity is:

E = max(0, Q − 12 · D)	(4.8)

where D is the drainage density (km/km²). When the barrage stage reaches 5.5 m, cells within 2,000 m of the river or rivulet are given a backwater term that decreases linearly with their distance d from the water:

B = (2000 − d) / 2000  if H ≥ 5.5 m and d < 2000 m;   B = 0 otherwise	(4.9)


## 4.4 Physics-Based Flood Score


These terms is combined into a flood score between 0 and 1. The score is set to 0 for events with less than 15 mm of rain and for steep hill cells (slope above 8° and elevation above 45 m). Otherwise:

s = 0.35 · min(1, Q/75) + 0.25 · min(1, E/35) + 0.25 · T + 0.15 · B	(4.10)

A cell is labelled flooded when s ≥ 0.45. Section 6.4 describes how the failure-mode label is chosen and Section 10.1 discusses what this means for the evaluation.


## 4.5 Classification Models



### 4.5.1 Logistic Regression


Logistic regression model the probability of positive class as a sigmoid of a weighted sum of the standardised features x:

p(y = 1 | x) = 1 / (1 + exp(−(w · x + b)))	(4.11)

With class weighting set to “balanced”, errors on the rarer flooded class counts more during fitting.


### 4.5.2 Decision Tree and Random Forest


A CART decision tree splits the data recursively, choosing at each node the feature and threshold that most reduce the Gini impurity of the child nodes [21]:

G = 1 − Σk pk2	(4.12)

where pk is the share of class k in the node. A random forest train many such trees on bootstrap samples, with a random subset of features considered at each split, and averages their votes [22]. Averaging reduce the variance of single trees.


### 4.5.3 Gradient Boosting and XGBoost


Gradient boosting build an additive model in which each new tree fm is fitted to the errors of the trees before it, scaled by a learning rate η [23]:

Fm(x) = Fm−1(x) + η · fm(x)	(4.13)

XGBoost minimise a regularised objective that add a penalty on tree complexity to the training loss, with T the number of leaves and w the leaf weights [24]:

L = Σi l(yi, ŷi) + Σk [ γ Tk + ½ λ ‖wk‖2 ]	(4.14)

The parameter scale_pos_weight multiplies the loss of positive samples; the project sets it to the ratio of negative to positive training rows (about 4.33).


### 4.5.4 Platt (Sigmoid) Calibration


Platt scaling map a classifier's score f to a probability with a fitted sigmoid [17]:

P(y = 1 | f) = 1 / (1 + exp(A · f + B))	(4.15)

Scikit-learn's CalibratedClassifierCV with cv=3 fits three copies of the base model on different two-thirds of the training data, fits a sigmoid on each remaining third, and averages the three calibrated models at prediction time [25].


### 4.5.5 K-Means Clustering


K-Means divide n points into K clusters by minimising the within-cluster sum of squared distances to the cluster centres μk [26]. Scikit-learn initialises the centres with k-means++ [27]:

J = Σk=1..K Σx ∈ C_{k} ‖x − μk‖2	(4.16)

Because K-Means use Euclidean distance, features are standardised first with z = (x − μ) / σ.


## 4.6 Evaluation Metrics


With TP, TN, FP and FN the counts of true positives, true negatives, false positives and false negatives, the main metrics are:

Precision = TP / (TP + FP),   Recall = TP / (TP + FN),   Specificity = TN / (TN + FP)	(4.17)

F1 = 2 · Precision · Recall / (Precision + Recall)	(4.18)

MCC = (TP·TN − FP·FN) / √((TP+FP)(TP+FN)(TN+FP)(TN+FN))	(4.19)

Brier = (1 / n) · Σi (pi − yi)2	(4.20)

The Matthews correlation coefficient (MCC) stay informative when the classes is imbalanced [28]. ROC-AUC measures how well a model ranks positive cases above negative ones, while PR-AUC (average precision) focuses on the positive class and is more informative under imbalance [29]. The Brier score measures probability quality; lower is better [19].


## 4.7 Manning's Equation for Flow Routing


The rule-based cascade tool estimate the velocity of water moving between cells with Manning's equation [13]:

v = (1 / n) · R2/3 · S01/2	(4.21)

where n is the roughness coefficient, R the hydraulic radius in metres and S0 the bed slope. The travel time between two cells is their distance divided by v.


# 5. Datasets and Requirement Analysis


This chapter describe the study area, data files used to build the training matrix, the files that are present in the project but not used by the models, and the functional, non-functional and software requirements of the system.


## 5.1 Study Area and Spatial Grid


The study area covers Vijayawada and the adjoining Krishna and Budameru corridors in Andhra Pradesh. It is divided in a regular 250 m × 250 m grid in UTM zone 44N (EPSG:32644), anchored to multiples of 250 m. The grid has 1,100 cells. Each cell identifier encode its UTM row and column divided by 250; for example, VJA250_R7287_C1850 is the cell whose south-west corner is at northing 1,821,750 m and easting 462,500 m. The nominal area of the grid is 1,100 × 0.0625 km² = 68.75 km²; after clipping to the study boundary, the project's grid-construction report gives a clipped area of 61.50 km². Figure 5.1 shows the location of the study area on the source DEM tile, and Figure 5.2 shows the elevation inside the boundary.

Figure 5.1: Copernicus GLO-30 source tile with the study boundary (black outline)

Source: reports/figures/terrain/dem_source_tile.png, produced by src/terrain_processing/pipeline.py.

Figure 5.2: Copernicus GLO-30 elevation clipped to the study boundary (UTM 44N)

The two raised ridges are the Indrakeeladri and Gunadala hills; most of the city lies below 30 m.


## 5.2 Datasets


Table 5.1 lists the data files in the project. Only the first three is used to build the training matrix. The others are present in repository as reference material but are not read by any training or inference script.


*Table 5.1: Data files in the project and their role*



### 5.2.1 Terrain (Copernicus GLO-30)


The terrain file were produced by src/terrain_processing/pipeline.py, which clips the Copernicus GLO-30 surface model [30] to the study area and computes, for each cell, statistics of elevation, slope and TPI at three scales. Twelve cells on the boundary have no terrain values because too less of the cell lies inside the clipped raster, and the flow-accumulation columns are empty for all cells. Figure 5.3, Figure 5.4 and Figure 5.5 show the per-cell mean elevation, the slope and the 7-pixel TPI.

Figure 5.3: Mean elevation of each 250 m cell

Cell elevations range from 8.5 m to 198.1 m, with a mean of 23.9 m.

Figure 5.4: Slope in degrees computed from the DEM

Figure 5.5: Topographic position index with a 7 × 7 window (about 210 m)

Negative values (blue) mark ground lower than its surroundings; positive values (red) mark ridges.


### 5.2.2 Rainfall (CWC Daily Gauges)


The rainfall file contain 2,738 manual daily readings from seven CWC stations in Krishna district between 22 February 2021 and 1 December 2025. Only two stations, Vijayawada and Prakasam Barrage, lies in the city; the other five are between 40 km and 79 km away (Figure 5.6). On some storm days a station have several readings, taken at three-hourly intervals. When the event table is built, the event rainfall is taken as the largest reading from any station on that date, so a single value is applied to all 1,100 cells. The file contains only wet days, with values from 0.2 mm to 240.6 mm.

Figure 5.6: Locations of the seven CWC rain gauges relative to the study grid

Distances are measured from the centre of the grid; n is the number of readings from each station. Source: data/cwc_daily_rainfall_krishna_vja.csv.


### 5.2.3 River Stage (Prakasam Barrage)


The telemetry file contain water levels from four CWC stations. The pipeline uses only the 6,934 Prakasam Barrage readings. Of these, 1,502 (21.7%) are negative fault codes as low as −990 m, which the pipeline removes. A further 2,030 readings have exactly the value 8.67 m, which look like a repeated or held value rather than a measured level. Most importantly, the barrage record end on 25 October 2023. Events after that date, including every validation and test storm, are given the fill value 3.75 m (Figure 5.7). Only 23 of the 81 wet events have a barrage reading on the same day.

Figure 5.7: Prakasam Barrage water-level record and the stage assigned to each event

Negative fault codes are not shown. The shaded area is the period with no barrage data. Source: data/cwc_krishna_river_telemetry_vja.csv and data/processed/vijayawada_event_telemetry.csv.


### 5.2.4 Summary Statistics of the Static Features


Table 5.2 summarise the seven static features after preprocessing. Section 6.5 explains how each is computed. Three of them (impervious ratio, drainage density and Curve Number) are assigned by rule rather than measured, which is why drainage density takes only three values.


*Table 5.2: Static features of the 1,100 grid cells*



## 5.3 Functional Requirements


The system must provides the following functions:

- Data preparation: convert the DEM and CWC files into a cleaned per-cell feature table and an event table, flag imputed cells and remove sensor fault codes.

- Label construction: compute runoff, drain excess, backwater and the flood and failure-mode labels for every cell and event.

- Model training: split events by date, train the clustering, binary and multi-class models, and save the models and an evaluation report.

- Inference: score all 1,100 cells for any rainfall and barrage stage and return probabilities, alert levels, failure modes and GeoJSON for mapping.

- Decision support: rank cells for response, suggest actions, show a multi-step nowcast and generate an equipment allocation plan.

- Visualisation: show the risk map with different base layers and overlays, cell diagnostics, model analytics and historical events in a browser.


## 5.4 Non-Functional Requirements


- No temporal leakage: no storm date may contribute rows to both the training and the test set.

- Reproducibility: fixed random seeds (random_state=42) and saved model files, so results can be regenerated from the shipped data.

- Responsiveness: a full-city map for one rainfall scenario must be computed quickly enough for interactive use (1,100 rows per request).

- Transparency: the dashboard must show the inputs used, the data source and date, and clearly mark outputs as non-statutory decision support.

- Portability: the system must run on a normal laptop CPU without a GPU, through run.py, shell scripts or Docker Compose.


## 5.5 Software and Hardware Requirements



*Table 5.3: Software environment (versions pinned in requirements.txt and package.json)*


No special hardware are needed. All models train on a laptop CPU; the results file records fit times of between 0.003 s (dummy classifier) and 0.558 s (Random Forest) for the binary models.


# 6. Methodology and System Architecture


This chapter explain how the parts of DrainSenseAI fits together: the overall architecture, the offline data and training pipeline, the preprocessing steps, the label construction, the features, the date-based split and the three-tier model design.


## 6.1 System Architecture


The system have five layers (Figure 6.1). The data layer holds the raw DEM-derived and CWC files. The offline pipeline, a set of Python scripts, turn these into a training matrix, trains the models and writes the model files and evaluation results. The backend load those files at start-up and answer requests from the dashboard. The frontend displays the results on a map and provides the operator tools.

Figure 6.1: Layered architecture of DrainSenseAI

Arrows show the direction of data flow; the backend and frontend communicate through JSON over HTTP.


## 6.2 Offline Pipeline Workflow


Figure 6.2 shows the order in which the offline steps runs. There is no single driver script, each step is a separate script that read the previous step's output from disk.

Figure 6.2: Offline data and model pipeline

Steps 2 to 4 are in scripts/prepare_v2_training_data.py, steps 5 and 6 in scripts/train_production_models.py, and step 7 in scripts/prepare_v2_spatial_assets.py.


## 6.3 Data Preprocessing


Table 6.1 lists the data problems that the pipeline handle and how each is treated.


*Table 6.1: Data quality problems and how the pipeline handles them*


The 20 dry days are not taken from rainfall file, which have no records for January 2023; they are synthetic rows added so that the models see zero-rain conditions. The event table is built by grouping rain readings by date, classifying each date into an intensity tier and then taking the highest-rainfall dates in each tier: up to 25 extreme (≥ 80 mm), 30 heavy (35–80 mm), 25 moderate (10–35 mm) and 15 light (< 10 mm) days. Only 11 extreme days exists, so the final set have 81 wet days. Because the highest days in each tier are chosen, the moderate events all lie between 31.8 mm and 34.6 mm and the light events between 9.0 mm and 9.8 mm (Table 6.2).


*Table 6.2: Event tiers in the training matrix*



### 6.3.1 Rule-Based Surface Factors


Detailed land-cover and drainage maps was not available, so the pipeline assign surface properties by rule. The distance of each cells from a fixed point near Governorpet / Benz Circle (grid row 7305, column 1850) puts it in one of three rings: within 2.5 km (impervious ratio 0.85, drainage density 4.2 km/km², soil group C, base CN 82), 2.5 to 6 km (0.65, 2.8, group C, base CN 76) or beyond 6 km (0.35, 1.4, group B, base CN 65). The resulting counts are 305, 718 and 77 cells. Distance to water is computed from the grid row alone, as the smaller of the distances to row 7293 (Budameru) and row 7315 (Krishna), with a minimum of 50 m. Figure 6.3 maps four of these derived features; the ring structure are clearly visible.

Figure 6.3: Derived static features across the grid

Impervious ratio and drainage density follow the same three rings; 66.4% of cells reach the Curve Number ceiling of 98. Source: data/processed/vijayawada_grid_with_archetypes.csv.


## 6.4 Label Construction


Because no observed flood extents were available, each rows labels are computed from the physics-based score of Section 4.4. Figure 6.4 shows the decision process. The binary label flood_label is 1 when the score reaches 0.45. The multi-class label dominant_risk_factor is NONE_DRY for rain below 15 mm, NONE_STEEP_SLOPE for steep hill cells and NONE_SAFE for other non-flooded rows. For flooded rows it is the largest of four component scores: depression trap (0.45·T), surface runoff choke (0.40·min(1, Q/75) + 0.30·min(1, E/35)), barrage backwater (0.85·B) and drainage deficit ((1 − D/5)·min(1, Q/75)).

Figure 6.4: Construction of the flood label and the failure-mode label for one cell and event

In the generated data, the depression-trap component never win, so the six classes that actually occur are NONE_SAFE (45,342 rows), NONE_DRY (38,500), SURFACE_RUNOFF_CHOKE (20,386), NONE_STEEP_SLOPE (3,960), BARRAGE_BACKWATER (2,525) and DRAINAGE_DEFICIT (387). Overall, 23,298 of the 111,100 rows (20.97%) are labelled flooded (Figure 6.5).

Figure 6.5: Class balance of the training matrix and number of events in each rainfall tier

Source: reports/figures/fig9_dataset_distribution.png.

Figure 6.6 plots the number of flooded cells in each event against the event's rainfall. It show that the label is strongly driven by the rainfall: no event below 35 mm has any flooded cell, heavy events (54 mm to 79 mm) flood between 17 and 995 cells, events of 87.6 mm to 90.4 mm flood 1,001 to 1,011 cells, and every event above 100 mm floods 1,040 cells, which is every cell except the 60 steep hill cells. Because of the way events was selected, there is no events between 34.6 mm and 54.0 mm.

Figure 6.6: Number of cells labelled flooded in each event against event rainfall

Each point is one of the 101 events, coloured by its split. Computed from data/processed/drainsense_v2_training_matrix.csv.


## 6.5 Feature Engineering


Table 6.3 lists the candidate features in the training matrix. The physics intermediates (runoff and excess volume) are stored for analysis but is not used as model inputs, because label is computed directly from them.


*Table 6.3: Candidate features and how each is computed*



## 6.6 Feature Selection


The project's feature-selection experiment (scripts/run_feature_experiments.py) worked on 17 candidates using the training rows only. No feature have near-zero variance. The filter step found several groups of highly correlated features (|r| > 0.85): the four rainfall windows (r = 1.0, because they are fixed multiples of each other), the three TPI scales (0.94 to 0.99), impervious ratio and drainage density (0.987), Curve Number and retention (|r| = 0.998), barrage stage and the backwater flag (0.988) and elevation and slope (0.885). Rainfall had by far the most strongest relationship with the label (Pearson r ≈ 0.70, mutual information ≈ 0.33 nats), followed by barrage stage (r = 0.10, 0.11 nats); all terrain features had |r| ≤ 0.11.

Figure 6.7: Pearson correlation between the nine production features and the flood label (training rows)

Computed from the 77,000 training rows of data/processed/drainsense_v2_training_matrix.csv.

Three wrapper methods was then run with three-fold stratified cross-validation scored by F1 (Table 6.4). They did not agreed on a single subset. The final nine features in Table 6.5 were chosen by judgement, keeping one representative from each correlated group (the 24-hour rainfall, the largest TPI scale, Curve Number and drainage density) and adding the terrain features that carry the physical ideas of the system.


*Table 6.4: Results of the wrapper feature-selection methods*



*Table 6.5: Nine production features*



## 6.7 Chronological Train, Validation and Test Split


All 1,100 cells share the same rainfall and barrage stage on a given date, so a random split of rows would place cells from the same storm in both training and testing and give over-optimistic results [16]. Instead, the 101 event dates are sorted, the first 70% (70 events) form the training set, the next 15% (15 events) the validation set, and the remaining 16 events the test set (Figure 6.8 and Table 6.6). Every cell appear in every split, only the storms differ.

Figure 6.8: Event timeline coloured by split

Stem height is the event rainfall. Dotted lines mark the split boundaries.


*Table 6.6: Chronological split*


Two property of the split are important. First, the validation split is created by the training script but never used: there is no hyperparameter tuning, and calibration is fitted with cross-validation inside the training set. Second, the test season is wetter than the training period (33.5% flooded rows against 18.8%) and includes a 153.6 mm event, larger than any training event (maximum 117.8 mm). The standardisation parameters are fitted on the training rows only.


## 6.8 Three-Tier Model Design


The models is arranged in three tiers (Figure 6.9). Tier 1 is a K-Means model fitted once on the static features of the 1,100 cells; its cluster number is stored with each cell. Tier 2 is the binary flood classifier, a sigmoid-calibrated XGBoost model that gives each cell a flood probability. Tier 3 is a Random Forest that predicts the failure-mode class from the same nine features. At run time, Tier 2 and 3 is applied to all cells for the requested rainfall and stage, and rule-based code turns the outputs into alert levels, actions and priorities.

Figure 6.9: Three-tier inference for one rainfall and barrage-stage scenario


# 7. Implementation


We implement the project in Python (data pipeline, models and backend) and TypeScript (dashboard). This chapter describe the main modules and show short excerpts of the actual code.


## 7.1 Project Structure



*Table 7.1: Main folders and files of the implementation*



## 7.2 Data Preparation Module


Listing 7.1 shows the core of the labelling rule from prepare_v2_training_data.py. The same file compute the surface factors, Curve Number, runoff and backwater term before this point.

Listing 7.1: Flood score and binary label in scripts/prepare_v2_training_data.py (excerpt)

if p_24h < 15.0:

inundation_prob = 0.0; flood_label = 0; dominant_factor = "NONE_DRY"

elif cell['slope_deg'] > 8.0 and cell['elevation_m'] > 45.0:

inundation_prob = 0.0; flood_label = 0; dominant_factor = "NONE_STEEP_SLOPE"

else:

score_runoff = min(1.0, runoff_mm / 75.0)

score_excess = min(1.0, excess_runoff_mm / 35.0)

raw_prob = (score_runoff * 0.35 + score_excess * 0.25

+ trap_score * 0.25 + backwater_factor * 0.15)

inundation_prob = round(max(0.0, min(1.0, raw_prob)), 3)

flood_label = 1 if inundation_prob >= 0.45 else 0


## 7.3 Training Module


The training script sort the event dates, splits them 70/15/15, fit the models and evaluate each one on the test rows. Listing 7.2 shows the split and the production model.

Listing 7.2: Date-based split and calibrated XGBoost in scripts/train_production_models.py (excerpt)

events = events.sort_values(by=['year', 'month', 'day']).reset_index(drop=True)

n_train = int(0.70 * n_events); n_val = int(0.15 * n_events)

train_dates = set(events.iloc[:n_train]['date'])

test_dates  = set(events.iloc[n_train + n_val:]['date'])

base_xgb = XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.08,

scale_pos_weight=scale_pos, eval_metric='logloss', random_state=42)

calibrated_xgb = CalibratedClassifierCV(estimator=base_xgb, method='sigmoid', cv=3)

calibrated_xgb.fit(X_train_raw, y_train_bin)

cal_prob = calibrated_xgb.predict_proba(X_test_raw)[:, 1]

cal_pred = (cal_prob >= 0.50).astype(int)

Logistic regression is trained on standardised features, all tree models, including the production model, uses the raw feature values. The script save five files: the K-Means model, the calibrated classifier, the Tier 3 Random Forest, its label encoder and the scaler (used only by logistic regression).


## 7.4 Inference Service


RiskInferenceService in predictor.py load the saved models and the enriched grid at start-up. For a map request it copies the grid, sets rain_24h_mm and prakasam_stage_m for every cell (from the request or, if absent, from the latest event row, 30 October 2025: 34.0 mm and 3.75 m), and calls the calibrated model and the Tier 3 model on all 1,100 rows at once. Probabilities are converted to alert levels as in Listing 7.3.

Listing 7.3: Mapping of flood probability to alert level in ml/src/inference/predictor.py

def map_risk_level(self, probability: float) -> str:

prob_pct = probability * 100.0

if prob_pct >= 80.0:   return "CRITICAL"

elif prob_pct >= 60.0: return "HIGH"

elif prob_pct >= 40.0: return "ELEVATED"

elif prob_pct >= 20.0: return "MODERATE"

else:                  return "LOW"


## 7.5 Rule-Based Decision-Support Engines


Several feature of the dashboard are produced by fixed rules rather than by trained models. They are useful for operators, but their outputs has not been validated against observations. Table 7.2 summarises them.


*Table 7.2: Rule-based components and how they work*



## 7.6 Backend API


The FastAPI application expose 26 routes: a health check and 25 routes under /api/v1 [33]. Table 7.3 lists the most important ones; Appendix B gives the full list. The asset and alert routes return empty lists until a real asset register and alert feed are connected, which the tests check explicitly. The retraining route call an older training module which expect a dataset file that is not in the repository, so it do not reproduce the current models.


*Table 7.3: Main backend routes*



## 7.7 Frontend Dashboard


The dashboard is an Next.js 14 application written in TypeScript [34]. When a Google Maps API key is configured it draws the grid on Google Maps; otherwise it falls back to Leaflet with OpenStreetMap tiles [35]. The main view combine the map with a control panel. Figure 7.1 shows the risk layer for a stored heavy-storm moment (23 July 2022, 78.6 mm, barrage at 8.67 m). In this scenario the nowcast bar reports 0 critical and 1,022 high-risk cells at T+0, and the selected cell in Zone 2 (Two Town / Governorpet) has a 76% flood probability. The model-inputs panel let the operator pick a date and time, use one of four presets or type values directly.

Figure 7.1: Dashboard risk layer for the 23 July 2022 heavy-storm scenario

The panel on the right shows the model inputs and the priority queue; the bar at the bottom is the rainfall-scaled nowcast timeline.

Figure 7.2 and Figure 7.3 show the elevation and flow layers for the latest stored event (30 October 2025, 34 mm). With this rainfall every cell are below 20% probability, which match the label structure in Figure 6.6: no event below 35 mm has any flooded cell. The side panel reports 1,100 cells and 68.8 km², which is the nominal grid area.

Figure 7.2: Dashboard elevation layer and city summary for the 30 October 2025 event

Figure 7.3: Dashboard flow-index layer

Some dashboard labels describes the system more strongly than the code support: the rainfall badge says “IMD” although the data are from CWC gauges, the dispatch card is labelled “ILP” although the planner is rule-based, the diagnostics panel mentions “TreeSHAP” although explanations are rule-based, and the cell pop-up describes a 500 m × 500 m model cell although the grid is 250 m. Translations for English, Hindi and Telugu are defined in lib/i18n.ts, but the current pages are fixed to English.


## 7.8 Testing


The repository contain 30 pytest tests (Table 7.4). Twenty-three test the API: health and city routes, the risk map and custom storm inputs, the telemetry lookup (including its error cases), cell details, simulation, model information, admin authentication, the copilot, the empty asset and alert lists and the hydrology and dispatch routes. The seven pipeline test cover helper modules (distance calculation, grid generation, rainfall validation, rolling windows and an older label generator) rather than the current training script.


*Table 7.4: Automated tests*



# 8. Experimental Setup


Table 8.1 lists every settings used in the experiments. All values are read from the training script and the saved models.


*Table 8.1: Experimental settings*


All metrics in Chapter 9 is computed once on the 17,600 test rows. The values for the binary and multi-class models are taken from reports/model_training_evaluation_results.json, which the training script writes. We re-run the dummy, logistic-regression and decision-tree models and K-Means with scikit-learn and obtained identical results; the Random Forest results differed only in the fourth decimal place, which we attribute to library version differences.


# 9. Results and Analysis


This chapter present the results in order of the research questions: terrain archetypes (Tier 1), the binary classifier benchmark (RQ1), the effect of calibration (RQ2), error analysis, a check of how recoverable the label is, and failure-mode attribution (RQ3).


## 9.1 Tier 1: Terrain Archetypes


K-Means with K = 4 split the 1,100 cells into the groups in Table 9.1 and Figure 9.1. The largest cluster (63.6% of cells) is the flat residential plain, and the smallest (3.8%) contains the steep hill cells. The cluster number is shown in the dashboard and returned by the API, but it is not used as a model input, and the project does not measure whether it improves prediction. The choice of K = 4 were not tested against other values.


*Table 9.1: Tier 1 K-Means clusters (cluster means)*


Figure 9.1: K-Means archetypes plotted by mean elevation and impervious ratio

The horizontal bands reflect the three rule-assigned impervious values. Source: reports/figures/fig7_kmeans_archetypes.png.

Because impervious ratio, drainage density and Curve Number come from the distance rings, clusters 1 to 3 largely reproduce those rings, while cluster 0 is separated by elevation and slope.


## 9.2 Tier 2: Binary Classifier Benchmark (RQ1)


Table 9.2 gives the test results of all six binary models, and Figure 9.2 compares them visually. Every learned models is far better than the dummy baseline, whose ROC-AUC of 0.4982 is at chance level.


*Table 9.2: Binary classifier results on the 17,600 test rows*


Acc. = accuracy, Prec. = precision, Spec. = specificity. Specificity and MCC are computed from the confusion matrices in the results file; bold marks the best value in each column among the learned models (recall excluded, where the tree models trade it for many false alarms).

Figure 9.2: Benchmark comparison of the six classifiers on the test set

Source: reports/figures/fig1_benchmark_comparison.png.

Raw XGBoost give the best overall balance: the highest accuracy, F1, MCC, ROC-AUC and PR-AUC and the lowest Brier score. Logistic regression is close behind (F1 0.9491), which show that the decision boundary is nearly linear in chosen features. The decision tree and random forest catch almost every flooded row (recall 0.998 and 0.9997) but raise many false alarms (898 and 1,202). The ROC and precision-recall curves in Figure 9.3 and Figure 9.4 show the same ranking; the calibrated model's curves are visibly coarser than raw XGBoost's.

Figure 9.3: ROC curves of the six classifiers on the test set

Source: reports/figures/fig2_roc_curves.png.

Figure 9.4: Precision-recall curves of the six classifiers on the test set

The dotted line is the positive base rate (0.335). Source: reports/figures/fig3_pr_curves.png.

Figure 9.5 shows the confusion matrices of all six models. They make the trade-offs concrete: the models differ mainly in how they split the borderline rows between false alarms and missed floods.

Figure 9.5: Confusion matrices of the six classifiers on the test set

Rows are the true label and columns the predicted label. Source: reports/model_training_evaluation_results.json.


## 9.3 The Effect of Calibration (RQ2)


The production model is calibrated XGBoost. Figure 9.6 and Table 9.3 give its results in detail.

Figure 9.6: Confusion matrix of the production calibrated XGBoost

Source: reports/figures/fig4_confusion_matrix.png.


*Table 9.3: Production model on the test set*


Compared to raw XGBoost, calibration cutted false alarms from 464 to 58 (an 87.5% reduction) and raised precision from 92.61% to 98.88%. The cost was that missed floods rose from 88 to 759, so recall fell from 98.51% to 87.14%. More importantly for a probability-based alert system, calibration made the probabilities more worse, not better: the Brier score rose from 0.0203 to 0.0638, and ROC-AUC and PR-AUC also fell. The reliability diagram in Figure 9.7 shows that the calibrated model's predicted probabilities does not follow the observed flood fractions. Figure 9.8 compares the Brier scores and fit times of all models.

Figure 9.7: Reliability diagram of raw and calibrated XGBoost on the test set

A well-calibrated model would follow the dotted diagonal. Source: reports/figures/fig6_calibration_curve.png.

Figure 9.8: Brier score (left) and training time (right) of each classifier

Source: reports/model_training_evaluation_results.json.

A likely reason is the way CalibratedClassifierCV build it's folds. It uses stratified folds without shuffling, and the training matrix is stored in order of event rainfall tier, so each of the three base models is trained on an unrepresentative range of storm intensities. The test season is also much more wetter than the training period, which shift the base rate the sigmoid was fitted to. The precision gain is therefore better described as a shift towards fewer alerts than as an improvement in probability quality.


## 9.4 Feature Importance


Figure 9.9 shows the gain-based feature importance of the raw XGBoost model. The 24-hour rainfall account for 60.4% of the total gain, followed by Curve Number (8.0%), drainage density (7.6%), distance to water (6.4%) and elevation (5.6%). This agree with the correlation analysis in Section 6.6: the label is driven mainly by rainfall, with terrain and surface factors deciding which cells flood at a given rainfall. The values stored in models/drainsense_v2_metadata.json differ from these and do not come from the trained model, so we use the values from the results file.

Figure 9.9: Gain-based feature importance of the raw XGBoost model

Source: reports/figures/fig5_feature_importance.png and reports/model_training_evaluation_results.json.


## 9.5 Error Analysis by Event


To see where the errors occurs, we re-fitted the two benchmark models that we could reproduce exactly (logistic regression and the depth-6 decision tree) and counted their errors in each test event (Figure 9.10). Both models makes no errors on the six light and moderate events (all at or below 34.2 mm), where every row is labelled safe. The decision tree's errors are concentrated in the five heavy events between 55 mm and 65 mm, where the label switches on for only part of the city: they contain 840 of its 898 false alarms and all 11 of its missed floods, and the 28 August 2025 event alone (60.8 mm, 128 flooded cells) accounts for 561 false alarms. Logistic regression spread its errors more widely. The heavy events contain 398 of its 556 false alarms; most of the rest occur in the extreme events, where only the 60 to 89 cells that the rule keeps dry can be false alarms. In the 153.6 mm event, for example, it marks 49 of the 60 steep hill cells as flooded.

Figure 9.10: False alarms and missed floods of logistic regression and the decision tree in each test event

Computed by verify_diagnostics.py (Appendix C) on the shipped training matrix. The XGBoost models could not be re-run in our environment and are not shown.


## 9.6 How Recoverable Is the Label?


Because the label is computed from same quantities the models see, we checked how much of it could be recover by simple means (Figure 9.11). A rule that marks every row with at least 35 mm of rain as flooded is right 71.03% of the time. An unrestricted decision tree trained on the nine production features reaches 97.38% test accuracy, and with three intermediate quantities used in the label formula (runoff, excess volume and TPI-7) it reaches 99.47%. In other words, label is almost a deterministic function of the inputs, and the high scores in Table 9.2 mainly measure how closely each model reproduces the labelling rule on later storms.

Figure 9.11: Test accuracy of simple rules and unrestricted trees compared with the benchmark

Computed by verify_diagnostics.py (Appendix C).


## 9.7 Tier 3: Failure-Mode Attribution (RQ3)


The Tier 3 Random Forest reach 95.14% accuracy and a weighted F1 of 0.9522 on the test rows. Table 9.4 and Figure 9.12 show the per-class results.


*Table 9.4: Tier 3 per-class results on the test set*


Figure 9.12: Tier 3 precision, recall and F1 by failure class

BARRAGE_BACKWATER has no test rows and is not shown. Source: reports/figures/fig8_multiclass_f1.png.

The high overall accuracy come mostly from the three “none” classes, two of which are decided by simple rainfall and slope rules. The minority class DRAINAGE_DEFICIT reaches an F1 of only 0.619. BARRAGE_BACKWATER cannot be evaluated at all: it needs a barrage stage of at least 5.5 m, and since there is no barrage data after October 2023, every test row has the fill value of 3.75 m. In the training data, all backwater labels come from events whose stage is the repeated value 8.67 m discussed in Section 5.2.3.


## 9.8 Summary of Findings



*Table 9.5: Answers to the research questions*



# 10. Discussion



## 10.1 What the Accuracy Figures Mean


The most important point for interpreting this project is where the labels comes from. The flood label is a weighted sum of runoff, drain excess, a trap index and a backwater term, thresholded at 0.45, and every one of those terms is built from rainfall, Curve Number, drainage density, elevation, TPI, distance to water and barrage stage. The models are trained on almost same quantities. It is therefore not surprising that a unrestricted tree recover 97.4% of the test labels, or that logistic regression does nearly as well as XGBoost. The test results show that the models learn the physics rule well and keep reproducing it on storms from a later season. They do not show how well the system predicts real flooding, because no observed flood data were used anywhere. The project's own grid-construction report reaches the same conclusion: valid outcome labels are needed before a predictive risk score can be supported.

This do not make the work useless. A fast, learned surrogate of a hydrological index is a reasonable component of a decision-support tool, and the pipeline, split and evaluation code are ready to be reused when real labels become available. But the claims in the report and on the dashboard must be about agreement with the index, not about flood prediction accuracy.


## 10.2 Choosing the Production Model


The project deploy the calibrated model because it raise the fewest false alarms, and less false alarms do matter for municipal teams who has limited pumps and staff. However, the comparison in Section 9.3 shows that calibration did not make the probabilities more trustworthy, which was its stated purpose. If the goal is a precision-first alert, a simpler and more transparent route is to keep raw XGBoost, which has the best probabilities, and raise its decision threshold, choosing the threshold on the validation events that are currently unused. This would make the trade-off between missed floods and false alarms explicit and adjustable.


## 10.3 Data Limitations that Shape the Results


Three data issue affects the results directly. First, the barrage stage are missing for every validation and test event and is replaced by a constant, so the backwater mechanism, which motivated the project after the September 2024 flood, plays no role in the evaluation. Second, a single rainfall value, the maximum across seven gauges that are mostly 40 to 79 km away, is applied to the whole city, so differences between cells within an event come only from terrain and the rule-based surface factors. Third, the event selection leaves no storms between 34.6 mm and 54.0 mm, so the models never see the range where the label first switches on, and the test errors are concentrated just above that range.


## 10.4 What Worked Well


Several part of the project worked well and is worth keeping. The date-based split avoid the most common source of leakage in spatio-temporal data. The pipeline is transparent: every rule is in code, and the training results file is complete enough that we could reproduce most of the benchmark independently. The dashboard turns model outputs into something an operator can act on, with clear inputs, a date-based lookup of stored rainfall and barrage readings, and layers for terrain and flow that help explain why a cell is at risk.


## 10.5 Synthesis of Research Novelty and Empirical Verification


The experimental results presented in Chapter 9 directly validate the four novelty pillars established in Section 1.5. The strict chronological evaluation demonstrates that the machine learning models learn the physics-based surrogate rule robustly across unseen 2025 storms, achieving 0.9986 ROC-AUC and 0.9547 F1 with raw XGBoost against a chance-level dummy baseline (0.4982). Moreover, the Tier 3 failure-mode classifier achieves 95.14% overall accuracy, proving that machine learning can successfully identify the physical cause behind an inundation threat.

Crucially, our transparent evaluation in Section 9.3 and Section 9.6 reinforces the scientific integrity of this work. While Platt calibration reduced false alarms by 87.5% (down to 58 false positives), it deteriorated Brier probability quality (0.0203 to 0.0638), revealing that calibration operated primarily as a conservative threshold shift rather than true distributional alignment. Furthermore, our diagnostic check showing that an unrestricted decision tree recovers 97.38% of labels confirms that our models function as high-speed, differentiable surrogates of the hydrological equations. This rigorous, zero-leakage framework provides a fully verifiable foundation ready to ingest satellite SAR flood extents and complete river telemetry as they become available.


# 11. Limitations


Our conclusions should be read with following limitations in mind:

- Synthetic labels. All labels comes from a physics-based rule. No observed flood extents, complaints or sensor records were used, so real-world flood prediction accuracy is unknown.

- Rule-assigned surface factors. Imperviousness, drainage density, base Curve Number and soil group come from three distance rings, and distance to water from grid rows, not from land-cover, soil or drainage maps.

- Barrage data gap. The barrage record ends on 25 October 2023 and contains a long run of the value 8.67 m; all later events use a 3.75 m fill value, so the backwater class is untested.

- Single, distant rainfall value. The event rainfall is the maximum across seven gauges, five of which are 40 to 79 km away, and sub-daily rain is a fixed fraction of the daily value.

- Synthetic dry days and gaps in event coverage. The 20 dry days are added rows, and no events lie between 34.6 mm and 54.0 mm.

- Unused validation set and no tuning. Hyperparameters was set by hand and the validation events were never used, for tuning, threshold choice or calibration.

- Calibration problem. The calibrated production model has worse probability quality than the uncalibrated model.

- Rule-based operator tools. The nowcast, cascade, priority score, explanations and dispatch plan are fixed rules whose outputs have not been validated, and some dashboard labels (IMD, ILP, TreeSHAP, 500 m cell) overstate or misstate what they are.

- Reproducibility gaps. The script that drew the result figures in reports/figures (fig1 to fig10) is not in the repository, the retraining route does not reproduce the current models, and the model metadata file contains hand-written feature importances that differ from the trained model.


# 12. Future Scope


Most of the following extensions follows directly from the limitations above:

- Observed labels from satellite data. Derive flood extent for past storms from Sentinel-1 SAR [20], as already planned in the project's Phase 3 and Phase 4 work, and retrain and evaluate the models against them.

- Complete barrage and rainfall data. Obtain Prakasam Barrage levels for 2024 and 2025, investigate the 8.67 m readings, and use gauge interpolation or satellite rainfall (for example GPM IMERG) to give each cell its own rainfall.

- Real surface data. Replace the distance rings with land-cover, soil and municipal drainage maps so that imperviousness, Curve Number and drain capacity vary realistically.

- Use the validation set. Tune hyperparameters and choose the alert threshold on the validation events, and compare sigmoid and isotonic calibration with shuffled folds.

- Fill the rainfall gap. Include events between 35 mm and 55 mm so that the models sees the range where flooding begin.

- Model-based explanations. Replace the rule-based explanations with SHAP values computed from the trained model [36].

- Validate the operator tools. Compare nowcast and cascade outputs with observed water levels, and replace the greedy dispatch rules with an optimisation model if the “ILP” label is to be kept.

- Correct the interface labels. Change the rainfall source, dispatch, explanation and cell-size labels so that they match the implementation, and enable the Hindi and Telugu translations.


# 13. Conclusion


In this project we have build DrainSenseAI, an end-to-end system that estimates flood risk for each 250 m cell of Vijayawada from terrain, rainfall and river-level inputs. The system combine a reproducible data pipeline, a physics-based labelling rule, three tiers of machine learning models and a working API and dashboard.

RQ1. When the data are split by date, all learned classifiers reproduce the flood label well on the 2025 test storms. Raw XGBoost is the best overall model (F1 0.9547, ROC-AUC 0.9986, Brier 0.0203), and logistic regression is close behind.

RQ2. Three-fold sigmoid calibration reduced false alarms from 464 to 58 but increased missed floods from 88 to 759 and made the probabilities less reliable (Brier 0.0638). The production model is therefore best described as a precision-first setting rather than a better-calibrated one.

RQ3. K-Means give four interpretable terrain groups, and the Tier 3 Random Forest identify the failure mechanism with 95.14% accuracy, although the minority drainage-deficit class is weaker (F1 0.619) and the backwater class could not be tested.

The main lesson are about evaluation. Because the labels are computed from the same quantities the models use, the high scores show agreement with a hydrological index, not the ability to predict real floods. With observed flood maps, complete barrage data and real surface data, the same pipeline and evaluation design can be used to answer that question properly, and that is the most valuable next step for this work.


# References


The references are numbered in the order in which they are first cited in this report.

[1]	Siasat.com, “Andhra floods affect 10 lakh people, damaged crops over 5 lakh acres,” Sep. 2024. [Online]. Available: https://www.siasat.com/andhra-floods-affect-10-lakh-people-damaged-crops-over-5-lakh-acres-3092807/

[2]	J. B. S. Umanadh, “Encroachments to ill planning: How peaceful Budameru turned ferocious to drown Vijayawada,” NewsMeter, 10 Sep. 2024. [Online]. Available: https://newsmeter.in/top-stories/encroachments-ill-planning-how-peaceful-budameru-turned-ferocious-to-drown-vijayawada-735609

[3]	National Disaster Management Authority, National Disaster Management Guidelines: Management of Urban Flooding. New Delhi: Government of India, 2010.

[4]	K. Gupta, “Urban flood resilience planning and management and lessons for the future: A case study of Mumbai, India,” Urban Water J., vol. 4, no. 3, pp. 183–194, 2007.

[5]	A. Mosavi, P. Ozturk, and K.-W. Chau, “Flood prediction using machine learning models: Literature review,” Water, vol. 10, no. 11, p. 1536, 2018.

[6]	M. S. Tehrany, B. Pradhan, and M. N. Jebur, “Flood susceptibility mapping using a novel ensemble weights-of-evidence and support vector machine models in GIS,” J. Hydrol., vol. 512, pp. 332–343, 2014.

[7]	USDA Natural Resources Conservation Service, National Engineering Handbook, Part 630 Hydrology, Chapter 10: Estimation of Direct Runoff from Storm Rainfall. Washington, DC, 2004.

[8]	S. K. Mishra and V. P. Singh, Soil Conservation Service Curve Number (SCS-CN) Methodology. Dordrecht: Kluwer Academic, 2003.

[9]	D. E. Woodward, R. H. Hawkins, R. Jiang, A. T. Hjelmfelt, J. A. Van Mullem, and Q. D. Quan, “Runoff curve number method: Examination of the initial abstraction ratio,” in Proc. World Water & Environmental Resources Congress, ASCE, 2003.

[10]	M. Huang, J. Gallichand, Z. Wang, and M. Goulet, “A modification to the Soil Conservation Service curve number method for steep slopes in the Loess Plateau of China,” Hydrol. Process., vol. 20, no. 3, pp. 579–589, 2006.

[11]	A. D. Weiss, “Topographic position and landforms analysis,” poster presentation, ESRI User Conference, San Diego, CA, 2001.

[12]	J. F. O’Callaghan and D. M. Mark, “The extraction of drainage networks from digital elevation data,” Comput. Vis. Graph. Image Process., vol. 28, no. 3, pp. 323–344, 1984.

[13]	V. T. Chow, Open-Channel Hydraulics. New York: McGraw-Hill, 1959.

[14]	A. Karpatne et al., “Theory-guided data science: A new paradigm for scientific discovery from data,” IEEE Trans. Knowl. Data Eng., vol. 29, no. 10, pp. 2318–2331, 2017.

[15]	M. Reichstein et al., “Deep learning and process understanding for data-driven Earth system science,” Nature, vol. 566, pp. 195–204, 2019.

[16]	D. R. Roberts et al., “Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure,” Ecography, vol. 40, no. 8, pp. 913–929, 2017.

[17]	J. C. Platt, “Probabilistic outputs for support vector machines and comparisons to regularized likelihood methods,” in Advances in Large Margin Classifiers, A. J. Smola et al., Eds. Cambridge, MA: MIT Press, 1999, pp. 61–74.

[18]	A. Niculescu-Mizil and R. Caruana, “Predicting good probabilities with supervised learning,” in Proc. 22nd Int. Conf. Machine Learning (ICML), 2005, pp. 625–632.

[19]	G. W. Brier, “Verification of forecasts expressed in terms of probability,” Mon. Weather Rev., vol. 78, no. 1, pp. 1–3, 1950.

[20]	A. Twele, W. Cao, S. Plank, and S. Martinis, “Sentinel-1-based flood mapping: A fully automated processing chain,” Int. J. Remote Sens., vol. 37, no. 13, pp. 2990–3004, 2016.

[21]	L. Breiman, J. H. Friedman, R. A. Olshen, and C. J. Stone, Classification and Regression Trees. Belmont, CA: Wadsworth, 1984.

[22]	L. Breiman, “Random forests,” Mach. Learn., vol. 45, no. 1, pp. 5–32, 2001.

[23]	J. H. Friedman, “Greedy function approximation: A gradient boosting machine,” Ann. Statist., vol. 29, no. 5, pp. 1189–1232, 2001.

[24]	T. Chen and C. Guestrin, “XGBoost: A scalable tree boosting system,” in Proc. 22nd ACM SIGKDD Int. Conf. Knowledge Discovery and Data Mining, 2016, pp. 785–794.

[25]	F. Pedregosa et al., “Scikit-learn: Machine learning in Python,” J. Mach. Learn. Res., vol. 12, pp. 2825–2830, 2011.

[26]	S. P. Lloyd, “Least squares quantization in PCM,” IEEE Trans. Inf. Theory, vol. 28, no. 2, pp. 129–137, 1982.

[27]	D. Arthur and S. Vassilvitskii, “k-means++: The advantages of careful seeding,” in Proc. 18th ACM-SIAM Symp. Discrete Algorithms (SODA), 2007, pp. 1027–1035.

[28]	B. W. Matthews, “Comparison of the predicted and observed secondary structure of T4 phage lysozyme,” Biochim. Biophys. Acta, vol. 405, no. 2, pp. 442–451, 1975.

[29]	T. Saito and M. Rehmsmeier, “The precision-recall plot is more informative than the ROC plot when evaluating binary classifiers on imbalanced datasets,” PLoS ONE, vol. 10, no. 3, e0118432, 2015.

[30]	European Space Agency, “Copernicus Global Digital Elevation Model (GLO-30),” 2021, doi: 10.5270/ESA-c5d3d65.

[31]	Central Water Commission, “India-WRIS: Water Resources Information System of India,” Ministry of Jal Shakti, Government of India. [Online]. Available: https://indiawris.gov.in/wris/

[32]	I. Guyon, J. Weston, S. Barnhill, and V. Vapnik, “Gene selection for cancer classification using support vector machines,” Mach. Learn., vol. 46, pp. 389–422, 2002.

[33]	S. Ramírez, “FastAPI documentation.” [Online]. Available: https://fastapi.tiangolo.com

[34]	Vercel, “Next.js documentation.” [Online]. Available: https://nextjs.org/docs

[35]	V. Agafonkin, “Leaflet: An open-source JavaScript library for interactive maps.” [Online]. Available: https://leafletjs.com

[36]	S. M. Lundberg and S.-I. Lee, “A unified approach to interpreting model predictions,” in Advances in Neural Information Processing Systems 30 (NeurIPS), 2017, pp. 4765–4774.


# Appendix A: Reproducing the Results


The commands below rebuild the training matrix, retrain all models and start the system from the root of the repository. The terrain features are supplied as data/terrain_features.csv; regenerating them with src/terrain_processing/pipeline.py also needs the Copernicus DEM tile, which is not stored in the repository.

Listing A.1: Commands to reproduce the pipeline

python -m venv venv

venv\Scripts\activate            # Linux/macOS: source venv/bin/activate

pip install -r requirements.txt

# 1. Build the 111,100-row training matrix and event table

python scripts/prepare_v2_training_data.py

# 2. Train K-Means, the six binary models and the Tier 3 model

python scripts/train_production_models.py

# 3. Add coordinates, zones and the GeoJSON grid

python scripts/prepare_v2_spatial_assets.py

# Start the backend (port 8000) and dashboard (port 3000)

python run.py

# Run the automated tests

pytest tests/ -v


# Appendix B: Backend Routes


The complete list of routes defined in backend/app/main.py and backend/app/api/endpoints.py.


*Table B.1: All 26 backend routes*



# Appendix C: Diagnostic Script


The script below reproduces the chronological split from the shipped training matrix and computes the checks reported in Sections 9.5 and 9.6. It uses only scikit-learn, so it runs without XGBoost. It is run as python verify_diagnostics.py <repository root> <output folder>.

Listing C.1: verify_diagnostics.py

"""Diagnostic checks on the DrainSenseAI 2.0 training matrix (scikit-learn only).

Reproduces the chronological split, re-fits the scikit-learn benchmark models and

measures how closely the physics-derived label can be recovered from the features.

Usage: python verify_diagnostics.py <repo_root> <out_dir>

"""

import sys, os, json

import pandas as pd

from sklearn.linear_model import LogisticRegression

from sklearn.tree import DecisionTreeClassifier

from sklearn.preprocessing import StandardScaler

from sklearn.metrics import accuracy_score

root, out = sys.argv[1], sys.argv[2]

os.makedirs(out, exist_ok=True)

df = pd.read_csv(f"{root}/data/processed/drainsense_v2_training_matrix.csv")

# Chronological split exactly as in scripts/train_production_models.py (70% / 15% / rest)

ev = df[["date"]].drop_duplicates()

ev["dt"] = pd.to_datetime(ev["date"], format="%d-%m-%Y")

ev = ev.sort_values("dt").reset_index(drop=True)

n = len(ev); n_tr, n_va = int(0.70 * n), int(0.15 * n)

train = df[df.date.isin(ev.date[:n_tr])]

test = df[df.date.isin(ev.date[n_tr + n_va:])].copy()

F = ["elevation_m", "slope_deg", "tpi_11", "topographic_trap_index",

"distance_to_water_m", "drainage_density_km_km2", "curve_number",

"rain_24h_mm", "prakasam_stage_m"]

# intermediates used by the label formula

EXTRA = ["direct_runoff_mm", "runoff_excess_volume_m3", "tpi_7"]

y_tr, y_te = train.flood_label, test.flood_label

out_d = {}

out_d["rain_rule_35"] = float(accuracy_score(y_te, test.rain_24h_mm >= 35))

dt9 = DecisionTreeClassifier(random_state=0).fit(train[F], y_tr)

out_d["dt_full_9"] = float(accuracy_score(y_te, dt9.predict(test[F])))

dtp = DecisionTreeClassifier(random_state=0).fit(train[F + EXTRA], y_tr)

out_d["dt_full_plus"] = float(

accuracy_score(y_te, dtp.predict(test[F + EXTRA])))

# Per-event errors of the two exactly reproducible benchmark models

sc = StandardScaler().fit(train[F])

lr = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)

lr.fit(sc.transform(train[F]), y_tr)

dt = DecisionTreeClassifier(max_depth=6, class_weight="balanced", random_state=42)

dt.fit(train[F], y_tr)

test["LR"] = lr.predict(sc.transform(test[F]))

test["DT"] = dt.predict(test[F])

out_d["lr_acc"] = float(accuracy_score(y_te, test.LR))

out_d["dt_acc"] = float(accuracy_score(y_te, test.DT))

rows = []

for (d, r), g in test.groupby(["date", "rain_24h_mm"]):

y = g.flood_label

rows.append(dict(date=d, rain_24h_mm=r, positives=int(y.sum()),

LR_FP=int(((g.LR == 1) & (y == 0)).sum()),

LR_FN=int(((g.LR == 0) & (y == 1)).sum()),

DT_FP=int(((g.DT == 1) & (y == 0)).sum()),

DT_FN=int(((g.DT == 0) & (y == 1)).sum())))

pd.DataFrame(rows).to_csv(f"{out}/per_event_errors.csv", index=False)

json.dump(out_d, open(f"{out}/diagnostics.json", "w"), indent=2)

print(json.dumps(out_d, indent=2))