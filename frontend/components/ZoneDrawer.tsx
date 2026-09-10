"use client";

import React from "react";
import { ZoneDetail } from "../types";
import { 
  X, 
  AlertOctagon, 
  Clock, 
  CloudRain, 
  Mountain, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from "lucide-react";

interface ZoneDrawerProps {
  zone: ZoneDetail | null;
  onClose: () => void;
}

export const ZoneDrawer: React.FC<ZoneDrawerProps> = ({ zone, onClose }) => {
  if (!zone) return null;

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-rose-950/80 text-rose-300 border-rose-600/50 shadow-rose-900/30";
      case "HIGH": return "bg-red-950/80 text-red-300 border-red-600/50 shadow-red-900/30";
      case "ELEVATED": return "bg-amber-950/80 text-amber-300 border-amber-600/50 shadow-amber-900/30";
      case "MODERATE": return "bg-yellow-950/80 text-yellow-300 border-yellow-600/50 shadow-yellow-900/30";
      default: return "bg-emerald-950/80 text-emerald-300 border-emerald-600/50 shadow-emerald-900/30";
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900/98 backdrop-blur-md border-l border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col transition-all">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold">
              {zone.grid_id}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Lead Time: {zone.prediction_horizon_hours}h
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">{zone.zone_name}</h2>
          <p className="text-xs text-slate-400">Vijayawada Municipal Corporation Monitoring Grid</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-6 flex-1">
        {/* Risk Score Highlight Card */}
        <div className={`p-4 rounded-xl border shadow-lg ${getBadgeStyle(zone.risk_level)} flex items-center justify-between`}>
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider opacity-80">Waterlogging Susceptibility</div>
            <div className="text-3xl font-black mt-0.5 tracking-tight flex items-baseline gap-2">
              <span>{zone.risk_score}%</span>
              <span className="text-sm font-bold uppercase tracking-normal">[{zone.risk_level}]</span>
            </div>
            <div className="text-[11px] opacity-75 mt-0.5">Model Calibrated P(Inundation) = {zone.risk_probability}</div>
          </div>
          <AlertOctagon className="w-10 h-10 opacity-80 shrink-0" />
        </div>

        {/* Antecedent Rainfall Panel */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
            <CloudRain className="w-4 h-4 text-blue-400" />
            Antecedent Rainfall Telemetry
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">1-Hour</div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">{zone.rainfall_summary.rain_1h_mm} mm</div>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">3-Hour</div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">{zone.rainfall_summary.rain_3h_mm} mm</div>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">6-Hour</div>
              <div className="text-sm font-bold text-slate-100 mt-0.5">{zone.rainfall_summary.rain_6h_mm} mm</div>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400">24-Hour</div>
              <div className="text-sm font-bold text-blue-400 mt-0.5">{zone.rainfall_summary.rain_24h_mm} mm</div>
            </div>
          </div>
        </div>

        {/* Topographic & Hydrological Features */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
            <Mountain className="w-4 h-4 text-emerald-400" />
            Topographic & Hydrological Attributes
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-400">Elevation:</span>
              <span className="font-semibold text-slate-200">{zone.terrain.elevation_m} m AMSL</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-400">Terrain Slope:</span>
              <span className="font-semibold text-slate-200">{zone.terrain.slope_deg}°</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-400">Flow Accumulation:</span>
              <span className="font-semibold text-slate-200">{zone.terrain.flow_accumulation}/100</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5">
              <span className="text-slate-400">Water Proximity:</span>
              <span className="font-semibold text-slate-200">{zone.terrain.distance_to_water_m} m</span>
            </div>
          </div>
        </div>

        {/* Explainability / Top Factors */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Explainable AI: Key Contributing Factors
            </span>
            <span className="text-[10px] text-slate-400">TreeSHAP Rationale</span>
          </div>

          <div className="space-y-2">
            {zone.top_factors.map((f, i) => {
              const isEscalating = f.direction === "escalating";
              return (
                <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-200 flex items-center gap-1.5">
                      {isEscalating ? (
                        <TrendingUp className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      {f.factor}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isEscalating ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {f.impact}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{f.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Municipal Response Checklist */}
        <div className="bg-blue-950/20 p-4 rounded-xl border border-blue-900/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Decision-Support Recommended Actions
          </div>
          <ul className="space-y-2">
            {zone.recommended_actions.map((act, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Scientific Disclaimer Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-500 text-center">
        ⚠️ Decision-support estimation based on ML feature models. Not an official statutory disaster warning.
      </div>
    </div>
  );
};
