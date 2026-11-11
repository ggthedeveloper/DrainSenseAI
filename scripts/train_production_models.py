"""
DrainSenseAI Production Model Training Pipeline.
Executes:
1. Tier 1: Unsupervised K-Means Clustering on Spatial Surface Features.
2. Tier 2: Supervised Binary Classification Benchmarking:
   - Dummy Classifier (Baseline)
   - Logistic Regression (Balanced)
   - Decision Tree Classifier
   - Random Forest Classifier
   - Calibrated XGBoost Classifier (Production Candidate)
3. Tier 3: Multi-Class Mechanistic Root Cause Attribution (XGBoost).
4. Full Evaluation on Chronological Test Holdout (2025 Storms).
"""

import os
import json
import time
import joblib
import pandas as pd
import numpy as np

from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, brier_score_loss,
    confusion_matrix, classification_report
)
from xgboost import XGBClassifier

def train_and_benchmark_all():
    print("=== [1/4] Loading Preprocessed Spatiotemporal Matrix ===")
    data_path = 'data/processed/drainsense_v2_training_matrix.csv'
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df):,} samples across {df.shape[1]} columns.")

    # ---------------------------------------------------------
    # 1. TIER 1: UNSUPERVISED URBAN SURFACE CLUSTERING (K-MEANS)
    # ---------------------------------------------------------
    print("\n=== [2/4] Tier 1: Unsupervised Urban Surface Characterisation ===")
    spatial_df = pd.read_csv('data/processed/vijayawada_grid_static_factors.csv')
    spatial_features = [
        'elevation_m', 'slope_deg', 'tpi_11', 'topographic_trap_index',
        'distance_to_water_m', 'impervious_ratio', 'drainage_density_km_km2', 'curve_number'
    ]
    X_spatial = spatial_df[spatial_features].copy()
    scaler_spatial = StandardScaler()
    X_spatial_scaled = scaler_spatial.fit_transform(X_spatial)

    k_clusters = 4
    kmeans = KMeans(n_clusters=k_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_spatial_scaled)
    spatial_df['surface_archetype_cluster'] = cluster_labels

    cluster_summaries = {}
    for k in range(k_clusters):
        subset = spatial_df[spatial_df['surface_archetype_cluster'] == k]
        cluster_summaries[f"Archetype_{k}"] = {
            "count": len(subset),
            "pct": round(len(subset) / len(spatial_df) * 100, 1),
            "mean_elevation_m": round(float(subset['elevation_m'].mean()), 2),
            "mean_slope_deg": round(float(subset['slope_deg'].mean()), 2),
            "mean_tpi_11": round(float(subset['tpi_11'].mean()), 2),
            "mean_impervious_ratio": round(float(subset['impervious_ratio'].mean()), 2),
            "mean_curve_number": round(float(subset['curve_number'].mean()), 2)
        }
        print(f"  Cluster {k}: {len(subset)} cells ({cluster_summaries[f'Archetype_{k}']['pct']}%) - "
              f"Elev: {cluster_summaries[f'Archetype_{k}']['mean_elevation_m']}m, "
              f"Slope: {cluster_summaries[f'Archetype_{k}']['mean_slope_deg']} deg, "
              f"Imp: {cluster_summaries[f'Archetype_{k}']['mean_impervious_ratio']}")

    # Save cluster-annotated spatial grid
    os.makedirs('models', exist_ok=True)
    joblib.dump(kmeans, 'models/kmeans_surface_archetypes.joblib')
    spatial_df.to_csv('data/processed/vijayawada_grid_with_archetypes.csv', index=False)
    print("Saved K-Means model to models/kmeans_surface_archetypes.joblib")

    # ---------------------------------------------------------
    # 2. CHRONOLOGICAL DATA SPLIT (ZERO DATA LEAKAGE)
    # ---------------------------------------------------------
    print("\n=== [3/4] Partitioning Chronological Events (Zero Leakage) ===")
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

    train_mask = df['date'].isin(train_dates)
    val_mask = df['date'].isin(val_dates)
    test_mask = df['date'].isin(test_dates)

    train_df = df[train_mask].copy()
    val_df = df[val_mask].copy()
    test_df = df[test_mask].copy()

    # The 9 Optimal Production Features
    FEATURE_COLS = [
        'elevation_m', 'slope_deg', 'tpi_11', 'topographic_trap_index',
        'distance_to_water_m', 'drainage_density_km_km2', 'curve_number',
        'rain_24h_mm', 'prakasam_stage_m'
    ]

    TARGET_BINARY = 'flood_label'
    TARGET_MULTICLASS = 'dominant_risk_factor'

    X_train_raw = train_df[FEATURE_COLS]
    y_train_bin = train_df[TARGET_BINARY].values

    X_val_raw = val_df[FEATURE_COLS]
    y_val_bin = val_df[TARGET_BINARY].values

    X_test_raw = test_df[FEATURE_COLS]
    y_test_bin = test_df[TARGET_BINARY].values

    # Scale strictly on train
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw)
    X_val_scaled = scaler.transform(X_val_raw)
    X_test_scaled = scaler.transform(X_test_raw)

    joblib.dump(scaler, 'models/production_scaler.joblib')

    # Class weight ratio
    pos_train = int(y_train_bin.sum())
    neg_train = len(y_train_bin) - pos_train
    scale_pos = neg_train / max(1, pos_train)
    print(f"Train samples: {len(X_train_raw):,} (Pos: {pos_train:,}, Neg: {neg_train:,}, Scale Pos Weight: {scale_pos:.2f})")
    print(f"Val samples:   {len(X_val_raw):,}")
    print(f"Test samples:  {len(X_test_raw):,} (Strict Holdout late 2025 storms)")

    # ---------------------------------------------------------
    # 3. TIER 2: SUPERVISED BINARY CLASSIFICATION BENCHMARK
    # ---------------------------------------------------------
    print("\n=== Training & Benchmarking Candidate Models ===")
    
    candidate_models = {
        "Dummy Baseline": DummyClassifier(strategy="stratified", random_state=42),
        "Logistic Regression": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=6, class_weight="balanced", random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=120, max_depth=8, class_weight="balanced", n_jobs=-1, random_state=42),
        "XGBoost (Raw)": XGBClassifier(
            n_estimators=100, max_depth=6, learning_rate=0.08,
            scale_pos_weight=scale_pos, eval_metric="logloss", random_state=42
        )
    }

    benchmark_results = {}
    fitted_candidates = {}

    for name, model in candidate_models.items():
        print(f"\n--- Fitting {name} ---")
        t0 = time.time()
        # Scale for Logistic Regression, raw features for Trees
        if name == "Logistic Regression":
            model.fit(X_train_scaled, y_train_bin)
            X_eval = X_test_scaled
        else:
            model.fit(X_train_raw, y_train_bin)
            X_eval = X_test_raw

        train_time = round(time.time() - t0, 3)
        fitted_candidates[name] = model

        # Predict on Test Holdout
        y_pred = model.predict(X_eval)
        y_prob = model.predict_proba(X_eval)[:, 1] if hasattr(model, "predict_proba") else np.zeros(len(y_test_bin))

        acc = float(accuracy_score(y_test_bin, y_pred))
        p = float(precision_score(y_test_bin, y_pred, zero_division=0))
        r = float(recall_score(y_test_bin, y_pred, zero_division=0))
        f1 = float(f1_score(y_test_bin, y_pred, zero_division=0))
        roc = float(roc_auc_score(y_test_bin, y_prob)) if len(np.unique(y_test_bin)) > 1 else 0.5
        pr_auc = float(average_precision_score(y_test_bin, y_prob)) if len(np.unique(y_test_bin)) > 1 else 0.0
        brier = float(brier_score_loss(y_test_bin, y_prob))
        cm = confusion_matrix(y_test_bin, y_pred).tolist()

        benchmark_results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(p, 4),
            "recall": round(r, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc, 4),
            "pr_auc": round(pr_auc, 4),
            "brier_score": round(brier, 4),
            "train_time_sec": train_time,
            "confusion_matrix": cm
        }
        print(f"  {name} Test Results -> ROC-AUC: {roc:.4f}, PR-AUC: {pr_auc:.4f}, F1: {f1:.4f}, Precision: {p:.4f}, Recall: {r:.4f}")

    # Production Model: Calibrated XGBoost with 3-Fold Cross-Validation
    print("\n--- Fitting Production Model: Calibrated XGBoost (Sigmoid) ---")
    base_xgb = XGBClassifier(
        n_estimators=100, max_depth=6, learning_rate=0.08,
        scale_pos_weight=scale_pos, eval_metric="logloss", random_state=42
    )
    t0 = time.time()
    calibrated_xgb = CalibratedClassifierCV(estimator=base_xgb, method="sigmoid", cv=3)
    calibrated_xgb.fit(X_train_raw, y_train_bin)
    train_time_cal = round(time.time() - t0, 3)

    cal_prob = calibrated_xgb.predict_proba(X_test_raw)[:, 1]
    cal_pred = (cal_prob >= 0.50).astype(int)

    acc = float(accuracy_score(y_test_bin, cal_pred))
    p = float(precision_score(y_test_bin, cal_pred, zero_division=0))
    r = float(recall_score(y_test_bin, cal_pred, zero_division=0))
    f1 = float(f1_score(y_test_bin, cal_pred, zero_division=0))
    roc = float(roc_auc_score(y_test_bin, cal_prob))
    pr_auc = float(average_precision_score(y_test_bin, cal_prob))
    brier = float(brier_score_loss(y_test_bin, cal_prob))

    benchmark_results["Calibrated XGBoost (Production)"] = {
        "accuracy": round(acc, 4),
        "precision": round(p, 4),
        "recall": round(r, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "train_time_sec": train_time_cal,
        "confusion_matrix": confusion_matrix(y_test_bin, cal_pred).tolist()
    }
    print(f"  Calibrated XGBoost Test Results -> ROC-AUC: {roc:.4f}, PR-AUC: {pr_auc:.4f}, F1: {f1:.4f}, Brier Score: {brier:.4f}")

    # Save Production Binary Model
    joblib.dump(calibrated_xgb, 'models/drainsense_v2_xgb_calibrated.joblib')
    print("Saved production binary classifier to models/drainsense_v2_xgb_calibrated.joblib")

    # Feature Importance from base XGBoost
    fitted_base_xgb = fitted_candidates["XGBoost (Raw)"]
    importances = fitted_base_xgb.feature_importances_
    feat_imp = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in sorted(zip(FEATURE_COLS, importances), key=lambda x: x[1], reverse=True)
    ]
    print("\nFeature Importances (Production XGBoost):")
    for item in feat_imp:
        print(f"  {item['feature']:26}: {item['importance']*100:.2f}%")

    # ---------------------------------------------------------
    # 4. TIER 3: MULTI-CLASS ROOT CAUSE ATTRIBUTION MODEL
    # ---------------------------------------------------------
    print("\n=== [4/4] Tier 3: Multi-Class Mechanistic Root Cause Attribution ===")
    le = LabelEncoder()
    y_train_multi = le.fit_transform(train_df[TARGET_MULTICLASS])
    y_test_multi = le.transform(test_df[TARGET_MULTICLASS])
    class_names = list(le.classes_)

    multiclass_model = RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42)
    multiclass_model.fit(X_train_raw, y_train_multi)

    y_pred_multi = multiclass_model.predict(X_test_raw)
    report = classification_report(
        y_test_multi, y_pred_multi,
        labels=list(range(len(class_names))),
        target_names=class_names,
        output_dict=True,
        zero_division=0
    )
    print("\nMulti-Class Test Holdout Report:")
    for cname in class_names:
        metrics = report[cname]
        print(f"  {cname:22}: Precision={metrics['precision']:.3f}, Recall={metrics['recall']:.3f}, F1={metrics['f1-score']:.3f}")

    joblib.dump(multiclass_model, 'models/drainsense_v2_multiclass_attribution.joblib')
    joblib.dump(le, 'models/multiclass_label_encoder.joblib')
    print("Saved multi-class model to models/drainsense_v2_multiclass_attribution.joblib")

    # Final Combined Output
    final_output = {
        "model_version": "2.0",
        "training_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset_reference": data_path,
        "n_samples": len(df),
        "split_summary": {
            "train_samples": len(train_df),
            "val_samples": len(val_df),
            "test_samples": len(test_df)
        },
        "feature_columns": FEATURE_COLS,
        "tier_1_unsupervised_clusters": cluster_summaries,
        "tier_2_binary_benchmarking": benchmark_results,
        "production_model": "Calibrated XGBoost (Production)",
        "feature_importances": feat_imp,
        "tier_3_multiclass_attribution": {
            "classes": class_names,
            "overall_accuracy": round(float(accuracy_score(y_test_multi, y_pred_multi)), 4),
            "weighted_f1": round(float(report['weighted avg']['f1-score']), 4),
            "per_class": {cname: report[cname] for cname in class_names}
        }
    }

    with open('reports/model_training_evaluation_results.json', 'w') as f:
        json.dump(final_output, f, indent=2)
    print("\n=== Training & Evaluation Complete! Saved to reports/model_training_evaluation_results.json ===")

if __name__ == '__main__':
    train_and_benchmark_all()
