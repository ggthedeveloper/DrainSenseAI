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

  const importanceColors = ["#115E59", "#3E63DD", "#E15759", "#F28E2B", "#067647", "#175CD3", "#8A6116", "#B54708", "#4C5E62"];
  const longestFeatureLabel = Array.isArray(report?.feature_importances)
    ? report.feature_importances.reduce(
        (longest: number, row: { feature?: string }) => Math.max(longest, String(row.feature ?? "").length),
        0
      )
    : 0;
  const yAxisWidth = Math.max(96, Math.ceil(longestFeatureLabel * 7.2) + 18);
  const featureData: Array<{ name: string; importance: number; fill: string }> = Array.isArray(report?.feature_importances)
    ? report.feature_importances.map((row: { feature: string; importance: number }, index: number) => ({
        name: row.feature,
        importance: Math.round(row.importance * 1000) / 10,
        fill: importanceColors[index % importanceColors.length],
      }))
    : [];

  const calibrationData = Array.isArray(report?.calibration_curve)
    ? report.calibration_curve.map((row: { predicted_mean_prob: number; observed_positive_rate: number }) => ({
        bin: Number(row.predicted_mean_prob).toFixed(2),
        predicted: row.predicted_mean_prob,
        observed: row.observed_positive_rate,
        ideal: row.predicted_mean_prob,
      }))
    : [];

  const modelComparison: Array<Record<string, string | number | boolean>> = Array.isArray(report?.benchmarks)
    ? report.benchmarks
    : [];
  const confusion = report?.confusion_matrix;

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
              Metrics and feature-gain weights come from the 11 Nov 2026 training report.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium font-mono">
              {report?.training_timestamp ? `Calibrated model ${report.training_timestamp}` : "Calibrated model"}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">ROC-AUC Score</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{report?.roc_auc ?? "n/a"}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">High real terrain discrimination</div>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">PR-AUC (Avg Precision)</div>
          <div className="text-2xl font-black text-blue-400 mt-1 font-mono">{report?.pr_auc ?? "n/a"}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Precision-Recall on positive flood class</div>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">Brier Calibration Score</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{report?.brier_score ?? "n/a"}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">3-Fold Sigmoid Calibrated</div>
        </div>
        <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">Holdout Test Records</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{report?.evaluation_samples ?? "n/a"}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Holdout test rows</div>
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

          <div className="h-72 w-full min-w-0">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureData} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} unit="%" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={yAxisWidth}
                    interval={0}
                    stroke="#8AA0A4"
                    tick={{ fontSize: 11, fill: "#12262A" }}
                  />
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
            Weights are the gain shares in the 11 Nov 2026 training report.
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
            <span className="text-[10px] text-emerald-400 font-mono font-bold">Brier: {report?.brier_score ?? "n/a"}</span>
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
              Holdout comparison ({report?.evaluation_samples ?? "n/a"} test rows)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Each row is a model from the 11 Nov 2026 training report.
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
            Holdout
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
              {modelComparison.length === 0 && (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={7}>The evaluation response has no model comparison.</td>
                </tr>
              )}
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
              Production confusion matrix ({report?.evaluation_samples ?? "n/a"} rows)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Threshold P ≥ 0.50</span>
          </div>

          {confusion ? (
          <div className="grid grid-cols-2 gap-3 text-center my-3">
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-emerald-300">True Negatives (TN)</div>
              <div className="text-xl font-black text-emerald-200 mt-1 font-mono">{confusion.tn}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">False Positives (FP)</div>
              <div className="text-xl font-black text-slate-300 mt-1 font-mono">{confusion.fp}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">False Negatives (FN)</div>
              <div className="text-xl font-black text-slate-300 mt-1 font-mono">{confusion.fn}</div>
            </div>
            <div className="bg-blue-950/40 border border-blue-800/60 p-3 rounded-lg">
              <div className="text-[10px] uppercase font-bold text-blue-300">True Positives (TP)</div>
              <div className="text-xl font-black text-blue-200 mt-1 font-mono">{confusion.tp}</div>
            </div>
          </div>
          ) : (
            <p className="my-3 text-[11px] text-slate-400">The evaluation response has no confusion matrix.</p>
          )}
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
                <span><strong>Class weight:</strong> The trainer sets a positive-class weight from the training labels. This screen does not reprint a weight that is absent from the evaluation report.</span>
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
