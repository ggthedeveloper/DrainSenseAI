"use client";

import React, { useEffect, useState } from "react";
import { fetchEvaluationReport } from "../lib/api";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from "recharts";
import { 
  Cpu, 
  TrendingUp, 
  Target, 
  Award, 
  CheckCircle2, 
  Activity,
  Layers,
  HelpCircle
} from "lucide-react";

export const ModelAnalytics: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    fetchEvaluationReport()
      .then((data) => setReport(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const featureData = [
    { name: "24h Rain", feature: "rain_24h_mm", importance: 58.1, fill: "#3b82f6" },
    { name: "Elevation", feature: "elevation_m", importance: 30.4, fill: "#06b6d4" },
    { name: "Flow Accum.", feature: "flow_accumulation", importance: 3.7, fill: "#a855f7" },
    { name: "Terrain Slope", feature: "slope_deg", importance: 2.0, fill: "#eab308" },
    { name: "Impervious", feature: "impervious_ratio", importance: 1.8, fill: "#f97316" },
    { name: "Drainage", feature: "drainage_density", importance: 1.6, fill: "#10b981" },
    { name: "Road Density", feature: "road_density", importance: 1.3, fill: "#64748b" },
    { name: "Water Dist.", feature: "distance_to_water", importance: 0.65, fill: "#6366f1" }
  ];

  const calibrationData = [
    { bin: "0-10%", predicted: 0.05, observed: 0.048, ideal: 0.05 },
    { bin: "10-20%", predicted: 0.15, observed: 0.146, ideal: 0.15 },
    { bin: "20-40%", predicted: 0.30, observed: 0.292, ideal: 0.30 },
    { bin: "40-60%", predicted: 0.50, observed: 0.485, ideal: 0.50 },
    { bin: "60-80%", predicted: 0.70, observed: 0.694, ideal: 0.70 },
    { bin: "80-100%", predicted: 0.95, observed: 0.938, ideal: 0.95 }
  ];

  const modelComparison = [
    { name: "DrainSense Calibrated XGBoost", roc_auc: "0.9823", pr_auc: "0.9346", f1: "0.8508", precision: "81.5%", recall: "89.0%", brier: "0.0446", highlight: true },
    { name: "Uncalibrated XGBoost (v1.0)", roc_auc: "0.9824", pr_auc: "0.9350", f1: "0.8281", precision: "73.4%", recall: "95.0%", brier: "0.0553", highlight: false },
    { name: "Random Forest (100 Trees)", roc_auc: "0.9805", pr_auc: "0.9270", f1: "0.8199", precision: "72.2%", recall: "94.9%", brier: "0.0576", highlight: false },
    { name: "Stratified Dummy Baseline", roc_auc: "0.4981", pr_auc: "0.1973", f1: "0.1952", precision: "19.5%", recall: "19.5%", brier: "0.3190", highlight: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
              <Cpu className="w-4 h-4" />
              Machine Learning Model Validation
            </div>
            <h2 className="text-xl font-bold text-slate-100">Model Evaluation & Explainability Governance</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Verification of calibrated XGBoost classifier on 155,378 holdout spatio-temporal test records across Budameru 2024 and Michaung 2023 deluge seasons.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium font-mono">
              drainsense_xgb_v1.0 (Calibrated)
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">ROC-AUC Score</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">0.9823</div>
          <div className="text-[10px] text-slate-400 mt-0.5">High real terrain discrimination</div>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">PR-AUC (Avg Precision)</div>
          <div className="text-2xl font-black text-blue-400 mt-1 font-mono">0.9346</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Precision-Recall on positive flood class</div>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">Brier Calibration Score</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">0.0446</div>
          <div className="text-[10px] text-slate-400 mt-0.5">3-Fold Sigmoid Calibrated</div>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">Holdout Test Records</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">155,378</div>
          <div className="text-[10px] text-slate-400 mt-0.5">20% Stratified test slice</div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recharts BarChart: Feature Importances */}
        <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Feature Importance (Gini Gain %)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Relative model decision tree contribution</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">XGBoost Gain</span>
          </div>

          <div className="h-64 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} unit="%" />
                  <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 10, fill: "#cbd5e1" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px", color: "#f8fafc" }}
                    formatter={(val: any) => [`${val}%`, "Importance"]}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {featureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <strong>Key Insight:</strong> Rainfall volume (58.1%) and ground elevation (30.4%) account for 88.5% of model predictive variance.
          </div>
        </div>

        {/* Recharts LineChart: Probability Calibration Curve */}
        <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Reliability & Probability Calibration Curve
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Predicted risk probability vs observed flood fraction</p>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">Brier: 0.0446</span>
          </div>

          <div className="h-64 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={calibrationData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px", color: "#f8fafc" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Line type="monotone" dataKey="ideal" stroke="#64748b" strokeDasharray="4 4" name="Perfect Calibration" dot={false} />
                  <Line type="monotone" dataKey="observed" stroke="#10b981" strokeWidth={2.5} name="Calibrated XGBoost" dot={{ r: 4, fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <strong>Calibration Protocol:</strong> Sigmoid cross-validation ensures that a 70% model risk score accurately corresponds to a 70% empirical flood frequency.
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table for Evaluators */}
      <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Machine Learning Benchmark Comparison (N = 155,378 Holdout Test Records)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Empirical validation across baseline, ensemble tree, and calibrated architectures on real Copernicus DEM and ERA5 telemetry.
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
            5-Fold Stratified CV
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-sans">
                <th className="pb-2 font-semibold">Model Architecture</th>
                <th className="pb-2 font-semibold">ROC-AUC</th>
                <th className="pb-2 font-semibold">PR-AUC</th>
                <th className="pb-2 font-semibold">F1-Score</th>
                <th className="pb-2 font-semibold">Precision</th>
                <th className="pb-2 font-semibold">Recall</th>
                <th className="pb-2 font-semibold">Brier Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {modelComparison.map((m, idx) => (
                <tr 
                  key={idx} 
                  className={m.highlight ? "bg-blue-950/30 text-white font-bold" : "text-slate-300 hover:bg-slate-800/40"}
                >
                  <td className="py-2.5 font-sans flex items-center gap-2">
                    {m.highlight && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                    <span>{m.name}</span>
                    {m.highlight && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                        Active In Production
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-emerald-400">{m.roc_auc}</td>
                  <td className="py-2.5 text-blue-400">{m.pr_auc}</td>
                  <td className="py-2.5 text-purple-300">{m.f1}</td>
                  <td className="py-2.5 text-slate-300">{m.precision}</td>
                  <td className="py-2.5 text-emerald-300">{m.recall}</td>
                  <td className="py-2.5 text-amber-300">{m.brier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix & Guardrails Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Holdout Confusion Matrix (N = 155,378)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Threshold P ≥ 0.50</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center my-3">
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-emerald-300">True Negatives (TN)</div>
              <div className="text-xl font-black text-emerald-200 mt-1 font-mono">118,402</div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">Dry/Safe cells correctly identified (95.0%)</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">False Positives (FP)</div>
              <div className="text-xl font-black text-slate-300 mt-1 font-mono">6,229</div>
              <div className="text-[10px] text-slate-400 mt-0.5">False alarms (FPR: 5.0%)</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">False Negatives (FN)</div>
              <div className="text-xl font-black text-slate-300 mt-1 font-mono">3,373</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Missed deluge alerts (FNR: 10.97%)</div>
            </div>
            <div className="bg-blue-950/40 border border-blue-800/60 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-blue-300">True Positives (TP)</div>
              <div className="text-xl font-black text-blue-200 mt-1 font-mono">27,374</div>
              <div className="text-[10px] text-blue-400/80 mt-0.5">Inundation zones detected (Recall: 89.03%)</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Sensitivity / Recall on extreme flood events is <strong>89.03%</strong> with a specificity of <strong>95.00%</strong> and precision of <strong>81.46%</strong> (F1-Score: <strong>0.8508</strong>).
          </div>
        </div>

        {/* Model Governance Checklist */}
        <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-400" />
              Scientific Positioning & Model Governance
            </h3>
            <ul className="space-y-2.5 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Zero Future Lookahead:</strong> Rolling rainfall windows strictly aggregate backward in time (1h to 72h antecedent).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>No Post-Event Inundation Leakage:</strong> Historical flood frequency only includes events prior to the evaluation period.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Class Weight Balancing:</strong> XGBoost tuned with `scale_pos_weight = 8.55` to address flood class imbalance without artificial data inflation.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            ⚠️ <strong>Disclaimer:</strong> Decision-support estimation only; not an official statutory warning system.
          </div>
        </div>
      </div>
    </div>
  );
};
