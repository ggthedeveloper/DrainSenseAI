"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  RiskSummary, 
  ZoneDetail, 
  PriorityZoneItem, 
  SimulationResult 
} from "../types";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { runSimulation } from "../lib/api";
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Layers,
  Sparkles,
  Compass,
  TrendingUp,
  TrendingDown,
  Clock,
  SlidersHorizontal,
  CheckCircle2,
  RefreshCw,
  Droplets,
  Building2,
  MapPin,
  X,
  ArrowRight,
  Info,
  Maximize2,
  RotateCcw,
  Zap,
  ChevronRight
} from "lucide-react";

interface DashboardControlPanelProps {
  cityId: string;
  cityName: string;
  summary: RiskSummary | null;
  selectedGridId: string | null;
  zoneDetail: ZoneDetail | null;
  priorityZones: PriorityZoneItem[];
  currentLang: SupportedLanguage;
  onSelectGrid: (gridId: string) => void;
  onClearSelectedGrid: () => void;
  onApplyScenarioToMap?: (multiplier: number) => void;
  onResetScenarioOnMap?: () => void;
  healthStatus?: { status: string; model_version: string };
}

export const DashboardControlPanel: React.FC<DashboardControlPanelProps> = ({
  cityId,
  cityName,
  summary,
  selectedGridId,
  zoneDetail,
  priorityZones,
  currentLang,
  onSelectGrid,
  onClearSelectedGrid,
  onApplyScenarioToMap,
  onResetScenarioOnMap,
  healthStatus
}) => {
  const t = getTranslation(currentLang);

  // What-If Simulator state
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [scenarioActive, setScenarioActive] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Run simulation on multiplier change
  const handleMultiplierChange = (val: number) => {
    setMultiplier(val);
    if (val === 1.0) {
      setSimResult(null);
      setScenarioActive(false);
      if (onResetScenarioOnMap) onResetScenarioOnMap();
      return;
    }

    setSimLoading(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await runSimulation(cityId, val);
        setSimResult(res);
        setScenarioActive(true);
      } catch (e) {
        console.error("Simulation error:", e);
      } finally {
        setSimLoading(false);
      }
    }, 250);
  };

  const handleApplyToMap = () => {
    if (onApplyScenarioToMap && multiplier > 1.0) {
      onApplyScenarioToMap(multiplier);
      setScenarioActive(true);
    }
  };

  const handleResetScenario = () => {
    setMultiplier(1.0);
    setSimResult(null);
    setScenarioActive(false);
    if (onResetScenarioOnMap) onResetScenarioOnMap();
  };

  // Reset what-if state when city changes
  useEffect(() => {
    setMultiplier(1.0);
    setSimResult(null);
    setScenarioActive(false);
  }, [cityId]);

  // Overall Posture
  const isRedAlert = (summary?.critical_zones || 0) > 50;
  const isOrangeAlert = (summary?.critical_zones || 0) > 0;

  return (
    <div className="w-full h-full flex flex-col space-y-4 text-slate-100 overflow-y-auto pr-1 select-text scroll-smooth">
      {/* SECTION A: Live Status & Incident Posture */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <span>Municipal Control Unit</span>
                <span>•</span>
                <span className="font-mono text-emerald-400">Telemetry Live</span>
              </div>
              <h3 className="text-sm font-extrabold text-white tracking-tight mt-0.5">
                {cityName}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono uppercase inline-flex items-center gap-1 ${
              isRedAlert 
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30" 
                : isOrangeAlert 
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30" 
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            }`}>
              {isRedAlert ? "RED ALERT" : isOrangeAlert ? "ORANGE WATCH" : "STABLE MONITORING"}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Updated: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: Municipal Flood KPIs */}
      {summary && (
        <div className="grid grid-cols-2 gap-2.5 shrink-0">
          {/* Critical Risk */}
          <div className="bg-slate-900/80 border border-rose-900/40 rounded-xl p-3 shadow-lg relative overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center justify-between">
              <span>{t.kpiCriticalRisk}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="text-xl font-black text-rose-200 mt-1 font-mono">
              {summary.critical_zones}
              <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">Zones</span>
            </div>
            <div className="text-[10px] text-rose-400/80 mt-0.5 font-medium">&gt;80% Inundation Score</div>
          </div>

          {/* Elevated / High */}
          <div className="bg-slate-900/80 border border-amber-900/40 rounded-xl p-3 shadow-lg relative overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              <span>{t.kpiElevatedHigh}</span>
            </div>
            <div className="text-xl font-black text-amber-200 mt-1 font-mono">
              {summary.high_risk_zones + summary.elevated_zones}
              <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">Zones</span>
            </div>
            <div className="text-[10px] text-amber-400/80 mt-0.5 font-medium">40% - 80% Probability</div>
          </div>

          {/* 24h Rain */}
          <div className="bg-slate-900/80 border border-blue-900/40 rounded-xl p-3 shadow-lg relative overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span>{t.kpiCurrentRain}</span>
            </div>
            <div className="text-xl font-black text-blue-200 mt-1 font-mono">
              {summary.current_rainfall_24h_mm}
              <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">mm</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">ERA5 IMD Telemetry</div>
          </div>

          {/* Safe Uplands */}
          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-3 shadow-lg relative overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              <span>{t.kpiSafeGround}</span>
            </div>
            <div className="text-xl font-black text-emerald-200 mt-1 font-mono">
              {summary.low_zones}
              <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">Zones</span>
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5 font-medium">Safe Drainage Ridges</div>
          </div>
        </div>
      )}

      {/* SECTION C: Selected Zone Details & TreeSHAP (In-Panel Inspection) */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl shrink-0">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Zone Hydrological Inspection
            </h4>
          </div>
          {selectedGridId && (
            <button
              onClick={onClearSelectedGrid}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
              title="Clear selection"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {zoneDetail ? (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Header: Name & Risk Level */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono text-blue-400 font-semibold flex items-center gap-1.5">
                  <span>{zoneDetail.grid_id}</span>
                  <span>•</span>
                  <span>Lead Time: {zoneDetail.prediction_horizon_hours || 3}h</span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5 leading-tight">
                  {zoneDetail.zone_name}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border font-mono ${
                  zoneDetail.risk_level === "CRITICAL"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : zoneDetail.risk_level === "HIGH"
                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                    : zoneDetail.risk_level === "ELEVATED"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}>
                  {zoneDetail.risk_level} • {zoneDetail.risk_score}%
                </span>
              </div>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center">
              <div>
                <div className="text-[9px] text-slate-400 uppercase font-medium">Elevation</div>
                <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">{zoneDetail.terrain?.elevation_m ?? "--"}m AMSL</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 uppercase font-medium">Slope</div>
                <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">{zoneDetail.terrain?.slope_deg ?? "--"}°</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 uppercase font-medium">Flow Acc</div>
                <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">{zoneDetail.terrain?.flow_accumulation ?? "--"}/100</div>
              </div>
            </div>

            {/* TreeSHAP Explainability Factors */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                <span>Model Causal Attribution (TreeSHAP)</span>
                <span className="text-[9px] text-blue-400 font-mono">Calibrated XGBoost</span>
              </div>
              
              <div className="space-y-1.5 text-xs">
                {zoneDetail.top_factors && zoneDetail.top_factors.length > 0 ? (
                  zoneDetail.top_factors.map((f, i) => {
                    const isEscalating = f.direction === "escalating";
                    return (
                      <div key={i} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/60">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            {isEscalating ? (
                              <TrendingUp className="w-3 h-3 text-rose-400 shrink-0" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0" />
                            )}
                            {f.factor}
                          </span>
                          <span className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                            isEscalating ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {f.impact}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{f.explanation}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[11px] text-slate-400 italic">Computing local feature attributions...</div>
                )}
              </div>
            </div>

            {/* Tactical Recommended Action */}
            {zoneDetail.recommended_actions && zoneDetail.recommended_actions.length > 0 && (
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs">
                <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Action Directive
                </div>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  {zoneDetail.recommended_actions.map((act, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-5 px-3 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-slate-700/50">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">No Zone Selected</div>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Click any 500m grid cell on the map or pick a priority hotspot below to inspect localized TreeSHAP drivers and dewatering orders.
              </p>
            </div>

            {/* Quick Hotspot Suggestions */}
            {priorityZones && priorityZones.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                  High-Threat Hotspots:
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {priorityZones.slice(0, 2).map((pz) => (
                    <button
                      key={pz.grid_id}
                      onClick={() => onSelectGrid(pz.grid_id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300 hover:bg-rose-900/50 hover:text-white transition cursor-pointer flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span className="truncate max-w-[140px]">{pz.zone_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION D: What-If Rainfall Scenario Simulator */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              What-If Stress Simulator
            </h4>
          </div>
          {multiplier > 1.0 && (
            <button
              onClick={handleResetScenario}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 transition cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Reset
            </button>
          )}
        </div>

        {/* Multiplier Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Precipitation Surge:</span>
            <span className="font-mono font-bold text-amber-300">
              {multiplier === 1.0 ? "Baseline (1.0×)" : `+${Math.round((multiplier - 1) * 100)}% Surge (${multiplier.toFixed(2)}×)`}
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.5"
            step="0.05"
            value={multiplier}
            onChange={(e) => handleMultiplierChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>1.0× (Baseline)</span>
            <span>1.5× (+50%)</span>
            <span>2.0× (+100%)</span>
            <span>2.5× (+150%)</span>
          </div>
        </div>

        {/* Quick Multiplier Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "1.0×", val: 1.0 },
            { label: "+25%", val: 1.25 },
            { label: "+50%", val: 1.50 },
            { label: "+100%", val: 2.0 }
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => handleMultiplierChange(b.val)}
              className={`py-1 rounded-lg text-xs font-semibold font-mono transition cursor-pointer border ${
                multiplier === b.val
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                  : "bg-slate-950/80 hover:bg-slate-800 text-slate-400 border-slate-800"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Simulation Output */}
        {simLoading ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Calculating hydrodynamic runoff deltas...</span>
          </div>
        ) : simResult ? (
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">New Critical Inundation Sectors:</span>
              <span className="font-mono font-bold text-rose-400">
                +{simResult.impact_deltas.new_critical_zones} Zones
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Total Escalated Sectors:</span>
              <span className="font-mono font-bold text-amber-300">
                +{simResult.impact_deltas.total_newly_escalated_zones} Zones
              </span>
            </div>

            <button
              onClick={handleApplyToMap}
              className="w-full py-1.5 mt-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-600/20"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Project Scenario onto Map</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* SECTION E: Municipal Priority Response Queue */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl shrink-0 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Priority Response Queue
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-semibold">
            {priorityZones.length} Sectors Ranked
          </span>
        </div>

        <div className="space-y-2">
          {priorityZones.slice(0, 4).map((pz, idx) => (
            <div
              key={pz.grid_id}
              onClick={() => onSelectGrid(pz.grid_id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                selectedGridId === pz.grid_id
                  ? "bg-blue-950/40 border-blue-500/60 shadow-md shadow-blue-500/10"
                  : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                  idx === 0 
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                    : idx === 1 
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                    : "bg-slate-800 text-slate-400"
                }`}>
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                    {pz.zone_name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {pz.reason || "Lowland Sump Convergence"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono">
                  {pz.risk_score}%
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectGrid(pz.grid_id);
                  }}
                  className="p-1 rounded-md text-slate-400 group-hover:text-blue-400 hover:bg-slate-800 transition"
                  title="Inspect on Map"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
