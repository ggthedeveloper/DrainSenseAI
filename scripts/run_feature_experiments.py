"""
DrainSenseAI Feature Selection & Data Leakage Prevention Experiments.
- Experiment 1: Filter-based selection (Variance, Pearson/Spearman, Mutual Information)
- Experiment 2: Wrapper-based selection (Forward, Backward, RFECV)
- Temporal Event Splitting & Scaling Metadata
"""

import json
import os
import pandas as pd
import numpy as np
from sklearn.feature_selection import (
    VarianceThreshold, mutual_info_classif, RFECV,
    SequentialFeatureSelector
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold
from scipy.stats import spearmanr

def run_experiments():
    print("=== Loading Matrix for Experiments ===")
    df = pd.read_csv('data/processed/drainsense_v2_training_matrix.csv')
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns.")
    
    # -------------------------------------------------------------
    # 1. TEMPORAL EVENT SPLITTING (Zero Data Leakage)
    # -------------------------------------------------------------
    print("\n[Step 1] Executing Temporal Event Splitting...")
    # Extract unique event dates and sort chronologically
    events = df[['date', 'storm_tier']].drop_duplicates().copy()
    events['year'] = events['date'].apply(lambda d: int(d.split('-')[2]))
    events['month'] = events['date'].apply(lambda d: int(d.split('-')[1]))
    events['day'] = events['date'].apply(lambda d: int(d.split('-')[0]))
    events = events.sort_values(by=['year', 'month', 'day']).reset_index(drop=True)
    
    n_events = len(events)
    n_train = int(0.70 * n_events)
    n_val = int(0.15 * n_events)
    
    train_dates = set(events.iloc[:n_train]['date'])
    val_dates = set(events.iloc[n_train:n_train + n_val]['date'])
    test_dates = set(events.iloc[n_train + n_val:]['date'])
    
    print(f"Total Unique Storm Events: {n_events}")
    print(f"  Train Events (70%): {len(train_dates)} (From {events.iloc[0]['date']} to {events.iloc[n_train-1]['date']})")
    print(f"  Val Events   (15%): {len(val_dates)} (From {events.iloc[n_train]['date']} to {events.iloc[n_train+n_val-1]['date']})")
    print(f"  Test Events  (15%): {len(test_dates)} (From {events.iloc[n_train+n_val]['date']} to {events.iloc[-1]['date']})")
    
    train_mask = df['date'].isin(train_dates)
    val_mask = df['date'].isin(val_dates)
    test_mask = df['date'].isin(test_dates)
    
    train_df = df[train_mask].copy()
    val_df = df[val_mask].copy()
    test_df = df[test_mask].copy()
    
    print(f"Data Samples Split: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
    
    # Feature candidate list (15 candidate physical features)
    CANDIDATE_FEATURES = [
        'elevation_m', 'slope_deg', 'tpi_3', 'tpi_7', 'tpi_11',
        'topographic_trap_index', 'distance_to_water_m',
        'impervious_ratio', 'drainage_density_km_km2', 'curve_number',
        'potential_retention_s_mm',
        'rain_24h_mm', 'rain_6h_mm', 'rain_3h_mm', 'rain_1h_mm',
        'prakasam_stage_m', 'barrage_backwater_risk'
    ]
    
    TARGET = 'flood_label'
    
    X_train_raw = train_df[CANDIDATE_FEATURES].copy()
    y_train = train_df[TARGET].values
    
    X_test_raw = test_df[CANDIDATE_FEATURES].copy()
    y_test = test_df[TARGET].values
    
    # Scale strictly on train split to prevent leakage
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train_raw), columns=CANDIDATE_FEATURES)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test_raw), columns=CANDIDATE_FEATURES)
    
    # Store scaling parameters for documentation
    scaling_meta = {
        col: {"mean": float(scaler.mean_[i]), "std": float(scaler.scale_[i])}
        for i, col in enumerate(CANDIDATE_FEATURES)
    }
    
    # -------------------------------------------------------------
    # 2. EXPERIMENT 1: Filter-based Feature Selection
    # -------------------------------------------------------------
    print("\n[Step 2] Running Experiment 1: Filter-Based Selection...")
    
    # A. Variance Threshold
    selector_var = VarianceThreshold(threshold=0.01)
    selector_var.fit(X_train_raw)
    variances = X_train_raw.var()
    low_variance_cols = list(variances[variances < 0.01].index)
    print(f"  1A. Low Variance Features (<0.01): {low_variance_cols if low_variance_cols else 'None'}")
    
    # B. Pearson and Spearman Correlation
    print("  1B. Computing Pearson & Spearman Correlations with Target...")
    corr_results = []
    for col in CANDIDATE_FEATURES:
        pearson_val = float(X_train_raw[col].corr(train_df[TARGET]))
        spearman_val = float(spearmanr(X_train_raw[col], y_train).statistic)
        corr_results.append({
            'feature': col,
            'pearson': round(pearson_val, 4),
            'spearman': round(spearman_val, 4),
            'abs_spearman': round(abs(spearman_val), 4)
        })
    corr_df = pd.DataFrame(corr_results).sort_values(by='abs_spearman', ascending=False)
    
    # Inter-feature correlation (Collinearity Check: |r| > 0.85)
    corr_matrix = X_train_raw.corr().abs()
    high_collinear_pairs = []
    for i in range(len(CANDIDATE_FEATURES)):
        for j in range(i + 1, len(CANDIDATE_FEATURES)):
            c1, c2 = CANDIDATE_FEATURES[i], CANDIDATE_FEATURES[j]
            r_val = corr_matrix.loc[c1, c2]
            if r_val > 0.85:
                high_collinear_pairs.append({'feat1': c1, 'feat2': c2, 'r': round(r_val, 4)})
                
    print(f"  High Collinear Feature Pairs (|r| > 0.85): {len(high_collinear_pairs)}")
    for p in high_collinear_pairs:
        print(f"    - {p['feat1']} <-> {p['feat2']} (r = {p['r']})")
        
    # C. Mutual Information (MI)
    print("  1C. Calculating Mutual Information...")
    # Use 10k stratified subsample for fast robust MI computation
    sub_idx = np.random.RandomState(42).choice(len(X_train_raw), size=12000, replace=False)
    mi_scores = mutual_info_classif(X_train_raw.iloc[sub_idx], y_train[sub_idx], random_state=42)
    mi_results = [
        {'feature': col, 'mutual_info': round(float(score), 4)}
        for col, score in zip(CANDIDATE_FEATURES, mi_scores)
    ]
    mi_df = pd.DataFrame(mi_results).sort_values(by='mutual_info', ascending=False)
    
    # -------------------------------------------------------------
    # 3. EXPERIMENT 2: Wrapper-based Feature Selection
    # -------------------------------------------------------------
    print("\n[Step 3] Running Experiment 2: Wrapper-Based Selection...")
    # Estimator for wrapper: Logistic Regression with balanced weights
    base_estimator = LogisticRegression(class_weight='balanced', max_iter=500, random_state=42)
    
    # Subsample for wrapper methods to ensure stability and efficiency
    wrapper_sub_idx = np.random.RandomState(42).choice(len(X_train_scaled), size=8000, replace=False)
    X_wrap = X_train_scaled.iloc[wrapper_sub_idx]
    y_wrap = y_train[wrapper_sub_idx]
    
    # 2A. Forward Selection (k=8)
    print("  2A. Sequential Forward Selection (target k=8)...")
    sfs_forward = SequentialFeatureSelector(
        base_estimator, n_features_to_select=8, direction='forward', cv=3, scoring='f1', n_jobs=-1
    )
    sfs_forward.fit(X_wrap, y_wrap)
    forward_features = list(np.array(CANDIDATE_FEATURES)[sfs_forward.get_support()])
    print(f"    Selected by Forward Selection: {forward_features}")
    
    # 2B. Backward Elimination (k=8)
    print("  2B. Sequential Backward Elimination (target k=8)...")
    sfs_backward = SequentialFeatureSelector(
        base_estimator, n_features_to_select=8, direction='backward', cv=3, scoring='f1', n_jobs=-1
    )
    sfs_backward.fit(X_wrap, y_wrap)
    backward_features = list(np.array(CANDIDATE_FEATURES)[sfs_backward.get_support()])
    print(f"    Selected by Backward Elimination: {backward_features}")
    
    # 2C. Recursive Feature Elimination with Cross-Validation (RFECV)
    print("  2C. Recursive Feature Elimination with Cross-Validation (RFECV)...")
    rfecv = RFECV(
        estimator=base_estimator,
        step=1,
        cv=StratifiedKFold(3),
        scoring='f1',
        min_features_to_select=5,
        n_jobs=-1
    )
    rfecv.fit(X_wrap, y_wrap)
    rfecv_features = list(np.array(CANDIDATE_FEATURES)[rfecv.get_support()])
    print(f"    Optimal Feature Count by RFECV: {rfecv.n_features_}")
    print(f"    Selected by RFECV: {rfecv_features}")
    
    # Compile All Findings
    findings = {
        "temporal_splits": {
            "n_train_events": len(train_dates),
            "n_val_events": len(val_dates),
            "n_test_events": len(test_dates),
            "train_samples": len(train_df),
            "val_samples": len(val_df),
            "test_samples": len(test_df)
        },
        "scaling_metadata": scaling_meta,
        "experiment_1_filter": {
            "low_variance": low_variance_cols,
            "correlations": corr_df.to_dict(orient='records'),
            "collinear_pairs": high_collinear_pairs,
            "mutual_information": mi_df.to_dict(orient='records')
        },
        "experiment_2_wrapper": {
            "forward_selection": forward_features,
            "backward_elimination": backward_features,
            "rfecv_optimal_count": int(rfecv.n_features_),
            "rfecv_features": rfecv_features,
            "rfecv_grid_scores": [round(float(s), 4) for s in rfecv.cv_results_['mean_test_score']]
        }
    }
    
    with open('reports/feature_selection_experiments.json', 'w') as f:
        json.dump(findings, f, indent=2)
    print("\nSaved all experimental findings to: reports/feature_selection_experiments.json")
    return findings

if __name__ == '__main__':
    run_experiments()
