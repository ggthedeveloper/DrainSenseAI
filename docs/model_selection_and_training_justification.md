# DrainSenseAI — Model Selection, Justification & Benchmarking Architecture

**Document Version:** 1.0  
**Target Environment:** Vijayawada Catchment (1,100 Spatial Cells, 111,100 Spatiotemporal Matrix Rows)  
**Evaluated Dataset:** [`data/processed/drainsense_v2_training_matrix.csv`](file:///C:/A/PROJECT/DrainSenseAI/data/processed/drainsense_v2_training_matrix.csv)  
**Execution Environment:** Python 3.10 (`scikit-learn 1.7.2`, `xgboost 3.2.0`, `scipy 1.15.3`)

---

## 1. High-Level Modeling Architecture

To build a scientifically rigorous, defensible, and publishable ML system, we do not train just one model in isolation. We train a **hierarchical suite of models across 3 distinct paradigms**:
1. **Unsupervised Spatial Archetyping (Clustering)**: Discovering distinct physical urban surface types without human bias.
2. **Supervised Binary Inundation Classification**: Predicting calibrated flood probability ($P(\text{flood}) \in [0.0, 1.0]$).
3. **Supervised Multi-Class Mechanistic Attribution**: Classifying the dominant cause of failure (`SURFACE_RUNOFF_CHOKE`, `DEPRESSION_TRAP`, `BARRAGE_BACKWATER`, `DRAINAGE_DEFICIT`).

```
                              [drainsense_v2_training_matrix.csv]
                                               │
                       ┌───────────────────────┼───────────────────────┐
                       ▼                       ▼                       ▼
            [1. UNSUPERVISED]         [2. BINARY RISK]       [3. MULTI-CLASS CAUSE]
             K-Means / HDBSCAN         Candidate Benchmark     Multi-Class XGBoost / RF
             Surface Archetypes        - Dummy Baseline        (Explains failure mode
             (Topography + Pavement)   - Logistic Regression    for municipal dispatch)
                                       - Decision Tree
                                       - Random Forest
                                       - Calibrated XGBoost
```

---

## 2. Exhaustive Model Catalog: What We Will Train & Why

---

### Tier 1: Unsupervised Learning (Surface Characterisation)

#### 1. K-Means Clustering (+ PCA for Visualization)
* **What it is:** A centroid-based unsupervised clustering algorithm that partitions $N$ spatial cells into $K$ distinct clusters based on geometric Euclidean distance.
* **Why We Train It:**
  - **Objective Discovery of Urban Archetypes:** Rather than arbitrarily declaring *"Zone A is high risk"*, K-Means groups Vijayawada's 1,100 cells into distinct physical surface archetypes using static factors (`elevation_m`, `slope_deg`, `tpi_11`, `topographic_trap_index`, `impervious_ratio`, `drainage_density_km_km2`, `curve_number`).
  - **Identifies Real Physical Archetypes:**
    1. *Low-lying Impervious Basin* (e.g., Ajit Singh Nagar / Budameru floodplain).
    2. *Paved Elevated Commercial Core* (e.g., Benz Circle / Governorpet).
    3. *Steep Bare Rock Ridge* (e.g., Indrakeeladri Hills).
    4. *Permeable Peri-Urban Agricultural Buffer* (e.g., Outer Krishna floodplain).
* **Role in Research:** Directly satisfies the core research question in our project plan: *"Can representing urban surfaces as distinct archetypes improve localized flood prediction?"*

---

### Tier 2: Supervised Binary Classification Candidates (Predicting Flood: Yes/No & Probability)

We train 5 competing candidate models on identical **chronological event splits (70% Train, 15% Val, 15% Test)** to prove progression from simple baselines to state-of-the-art tree ensembles.

#### 2. Dummy Classifier (Stratified & Majority Baseline)
* **What it is:** A trivial non-learning heuristic baseline that predicts classes based purely on target class distributions (e.g., guessing negative 79% of the time).
* **Why We Train It:**
  - **Sanity Check Benchmark:** In imbalanced machine learning (21% flooded vs 79% non-flooded), an untrained model that always guesses "No Flood" gets 79% raw accuracy. The Dummy Classifier proves that our subsequent ML models are learning true physical relationships rather than capitalizing on class imbalance.

---

#### 3. Logistic Regression (L2 Regularized with Class Weighting)
* **What it is:** A generalized linear model that estimates the log-odds of inundation as a linear combination of normalized input features passed through a sigmoid function:
  $$P(\text{flood}) = \frac{1}{1 + e^{-(\mathbf{w}^T \mathbf{x} + b)}}$$
* **Why We Train It:**
  - **Linear Baseline & Odds-Ratio Interpretability:** The trained coefficients ($\mathbf{w}$) provide immediate, direct interpretations of feature importance (e.g., for every $+1\sigma$ increase in 24h rainfall, the odds of flooding multiply by $e^{w_{\text{rain}}}$).
  - **Proves the Need for Non-Linear Ensembles:** By comparing Logistic Regression against tree ensembles, we quantify exactly how much accuracy is lost if non-linear interactions (e.g., flat slope *combined* with high rain *combined* with high river stage) are ignored.

---

#### 4. Decision Tree Classifier (CART Algorithm)
* **What it is:** A single non-parametric tree that recursively splits the feature space using Gini impurity or entropy thresholds.
* **Why We Train It:**
  - **Human-Readable Municipal Decision Rules:** A pruned decision tree produces explicit `IF-THEN` rules that municipal engineers can print on paper (e.g., `IF rain_24h > 80mm AND elevation < 18m AND tpi_11 < -2.0 THEN Flood = YES`).
  - **Identifies Critical Physical Tipping Points:** Exposes the exact physical cutoff thresholds where a cell transitions from safe to inundated.

---

#### 5. Random Forest Classifier (Bagging Ensemble of 150 Trees)
* **What it is:** An ensemble of de-correlated decision trees trained on bootstrap samples with random feature subsampling.
* **Why We Train It:**
  - **Variance Reduction & Resilience to Outliers:** Unlike a single decision tree that easily overfits, Random Forest averages across hundreds of trees, providing robust generalization against localized sensor noise in rainfall observations.
  - **Out-of-Bag (OOB) Generalization:** Provides internal validation without requiring separate validation splits.

---

#### 6. XGBoost Classifier (Extreme Gradient Boosting with Sigmoid Calibration) — *Production Model*
* **What it is:** A sequential boosting ensemble where each subsequent tree fits the negative gradient (residuals) of the loss function, equipped with second-order Taylor expansion and L1/L2 regularization, combined with 3-Fold Platt Sigmoid Probability Calibration.
* **Why We Train It:**
  - **State-of-the-Art on Tabular Geospatial Data:** Consistently outperforms neural networks on structured tabular datasets.
  - **Captures Complex High-Order Interactions:** Naturally models three-way physical compound hazards:
    $$\text{High River Stage} \times \text{Waterway Proximity} \times \text{Heavy Antecedent Precipitation}$$
  - **Strict Probability Calibration (Brier Score Optimization):** Raw tree models output uncalibrated rank scores. By calibrating XGBoost with a Sigmoid cross-validation layer, a predicted probability of $0.70$ means that historically, out of 100 cells with this forecast, exactly 70 experienced inundation. Essential for municipal flood warning sirens.

---

### Tier 3: Supervised Multi-Class Attribution Model

#### 7. Multi-Class XGBoost / Random Forest (Dominant Failure Mode Classifier)
* **What it is:** A multi-class classifier predicting one of the discrete physical failure mechanisms:
  1. `SURFACE_RUNOFF_CHOKE` (Pavement exceeds pipe capacity).
  2. `DEPRESSION_TRAP` (Water trapped in topographic bowl).
  3. `BARRAGE_BACKWATER` (River surge blocking canal outfall).
  4. `DRAINAGE_DEFICIT` (High density with inadequate drains).
  5. `NONE_SAFE` / `NONE_DRY` / `NONE_STEEP_SLOPE`.
* **Why We Train It:**
  - **Actionable Decision-Support for Municipal Responders:** A city commissioner doesn't just need to know *if* a ward will flood; they need to know *what to do*:
    - If `SURFACE_RUNOFF_CHOKE` $\to$ Deploy high-capacity mobile dewatering pumps.
    - If `BARRAGE_BACKWATER` $\to$ Close river outfall flap gates and reinforce earthen bunds.
    - If `DEPRESSION_TRAP` $\to$ Evacuate low-lying basement parking and underpasses.

---

## 3. Summary Comparison Table

| Model | Paradigm | Input Vector | Output Target | Primary Scientific Justification |
| :--- | :--- | :--- | :--- | :--- |
| **K-Means** | Unsupervised | 7 Static Factors | 4 Urban Archetype Clusters | Discovers natural urban surface types without human bias. |
| **Dummy Baseline** | Heuristic | Target distribution | `flood_label` ($0/1$) | Proves models beat trivial class-imbalance guessing. |
| **Logistic Regression**| Linear Supervised | 9 Scaled Features | `flood_label` & Prob | Direct coefficient interpretability & linear baseline. |
| **Decision Tree** | Non-Linear Single | 9 Features | `flood_label` | Transparent municipal `IF-THEN` rule extraction. |
| **Random Forest** | Bagging Ensemble | 9 Features | `flood_label` & Prob | Low-variance ensemble benchmark; robust against noise. |
| **Calibrated XGBoost**| Gradient Boosting | 9 Features | Calibrated $P(\text{flood})$ | **Primary production model**: Top tabular ROC-AUC, captures 3-way interactions, calibrated probabilities. |
| **Multi-Class XGBoost**| Multi-Class Boosting| 9 Features | `dominant_risk_factor` | **Operational dispatch**: Identifies root cause (Runoff, Basin Trap, River Backwater). |

