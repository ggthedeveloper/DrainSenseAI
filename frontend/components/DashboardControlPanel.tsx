"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  RiskSummary, 
  ZoneDetail, 
  PriorityZoneItem, 
  SimulationResult,
  PhysicsAuditResponse,
  CascadeTraceResponse
} from "../types";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { runSimulation, fetchPhysicsAudit } from "../lib/api";
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
  RotateCcw,
  Zap,
  ChevronRight,
  Truck,
  CornerDownRight,
  Atom,
  Scale,
  Loader2
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
  onTriggerCascade?: (gridId: string) => void;
  onOpenFleetOptimizer?: () => void;
  activeCascadePath?: CascadeTraceResponse | null;
  onClearCascade?: () => void;
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
  healthStatus,
  onTriggerCascade,
  onOpenFleetOptimizer,
  activeCascadePath,
  onClearCascade
}) => {
  const t = getTranslation(currentLang);

  // What-If Simulator state
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [scenarioActive, setScenarioActive] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Physics SCS-CN audit state
  const [physicsAudit, setPhysicsAudit] = useState<PhysicsAuditResponse | null>(null);
  const [physicsLoading, setPhysicsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedGridId) {
      setPhysicsLoading(true);
      fetchPhysicsAudit(selectedGridId, summary?.current_rainfall_24h_mm)
        .then((res) => {
          setPhysicsAudit(res);
          setPhysicsLoading(false);
        })
        .catch(() => setPhysicsLoading(false));
    } else {
      setPhysicsAudit(null);
    }
  }, [selectedGridId, summary?.current_rainfall_24h_mm]);

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
    }, 200);
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

  useEffect(() => {
    setMultiplier(1.0);
    setSimResult(null);
    setScenarioActive(false);
  }, [cityId]);

  const isRedAlert = (summary?.critical_zones || 0) > 50;
  const isOrangeAlert = (summary?.critical_zones || 0) > 0;

  return (
    <div className="w-full h-full flex flex-col space-y-3.5 text-slate-100 overflow-y-auto pr-1 select-text scroll-smooth">
      {/* 1. Basin Status Card */}
      <div className="bg-[#0B1220]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 shadow-xl shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Active River Basin
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {cityName}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono uppercase inline-flex items-center gap-1 ${
              isRedAlert 
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30" 
                : isOrangeAlert 
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30" 
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            }`}>
              {isRedAlert ? "RED ALERT" : isOrangeAlert ? "ORANGE WATCH" : "MONITORING"}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Copernicus 30m DEM &amp; ERA5 Live
          </span>
          <span className="text-slate-400 font-mono">
            {summary?.monitored_area_sqkm || 202.5} km² • {summary?.total_grids || 810} cells
          </span>
        </div>
      </div>

      {/* 2. Key Flood Indicators */}
      {summary && (
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <div className="bg-[#0B1220]/90 border border-rose-900/40 rounded-xl p-2.5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center justify-between">
              <span>Critical Zones</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="text-lg font-black text-rose-200 mt-0.5 font-mono">
              {summary.critical_zones}
              <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">Sectors</span>
            </div>
            <div className="text-[9px] text-rose-300/70 mt-0.5 font-mono">&gt;80% Inundation Probability</div>
          </div>

          <div className="bg-[#0B1220]/90 border border-amber-900/40 rounded-xl p-2.5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-amber-400">
              <span>Elevated Risk</span>
            </div>
            <div className="text-lg font-black text-amber-200 mt-0.5 font-mono">
              {summary.high_risk_zones + summary.elevated_zones}
              <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">Sectors</span>
            </div>
            <div className="text-[9px] text-amber-300/70 mt-0.5 font-mono">40%–80% Probability</div>
          </div>

          <div className="bg-[#0B1220]/90 border border-blue-900/40 rounded-xl p-2.5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span>24h Rainfall</span>
            </div>
            <div className="text-lg font-black text-blue-200 mt-0.5 font-mono">
              {summary.current_rainfall_24h_mm}
              <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">mm</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 font-mono">ERA5 Observation Feed</div>
          </div>

          <div className="bg-[#0B1220]/90 border border-emerald-900/40 rounded-xl p-2.5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-emerald-400">
              <span>Safe Uplands</span>
            </div>
            <div className="text-lg font-black text-emerald-200 mt-0.5 font-mono">
              {summary.low_zones}
              <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">Sectors</span>
            </div>
            <div className="text-[9px] text-emerald-300/70 mt-0.5 font-mono">&lt;20% Low Probability</div>
          </div>
        </div>
      )}

      {/* 3. Autonomous Fleet Optimizer Action Banner */}
      {onOpenFleetOptimizer && (
        <button
          onClick={onOpenFleetOptimizer}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 hover:border-blue-400 text-xs font-bold text-blue-200 transition-all cursor-pointer shadow-sm active:scale-[0.99] group"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-white text-xs font-bold flex items-center gap-1.5">
                Autonomous Fleet Dispatch
                <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">ILP</span>
              </div>
              <div className="text-[10px] text-slate-400 font-normal">Generate NDMA Form D-4 Equipment Plan</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* 4. Selected Zone Hydrological Inspection */}
      <div className="bg-[#0B1220]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 shadow-xl shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Zone Diagnostics
            </h4>
          </div>
          {selectedGridId && (
            <button
              onClick={onClearSelectedGrid}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 transition cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {zoneDetail ? (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Header: Name & Risk Level */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono text-blue-400 font-semibold">
                  {zoneDetail.grid_id} • Lead Time: {zoneDetail.prediction_horizon_hours || 3}h
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {zoneDetail.zone_name}
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${
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

            {/* Metrics Matrix */}
            <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-[#050A14] border border-slate-800 text-center font-mono">
              <div>
                <div className="text-[8px] text-slate-500 uppercase font-sans">Elevation</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{zoneDetail.terrain?.elevation_m ?? "--"}m</div>
              </div>
              <div>
                <div className="text-[8px] text-slate-500 uppercase font-sans">Slope</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{zoneDetail.terrain?.slope_deg ?? "--"}°</div>
              </div>
              <div>
                <div className="text-[8px] text-slate-500 uppercase font-sans">Flow Acc</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{zoneDetail.terrain?.flow_accumulation ?? "--"}/100</div>
              </div>
            </div>

            {/* Causal Factors (TreeSHAP) */}
            {zoneDetail.top_factors && zoneDetail.top_factors.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Key Risk Drivers (TreeSHAP)
                </div>
                <div className="space-y-1">
                  {zoneDetail.top_factors.slice(0, 3).map((f, i) => {
                    const isEscalating = f.direction === "escalating";
                    return (
                      <div key={i} className="p-1.5 rounded-lg bg-[#050A14] border border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                          {isEscalating ? (
                            <TrendingUp className="w-3 h-3 text-rose-400 shrink-0" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0" />
                          )}
                          {f.factor}
                        </span>
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isEscalating ? "text-rose-400 bg-rose-500/10" : "text-emerald-400 bg-emerald-500/10"
                        }`}>
                          {f.impact}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Physics Guardrail (SCS-CN) */}
            {physicsAudit && (
              <div className="p-2.5 rounded-xl bg-[#050A14] border border-indigo-900/40 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                  <span className="text-indigo-400 flex items-center gap-1">
                    <Atom className="w-3 h-3" /> SCS-CN Mass Balance
                  </span>
                  <span className={`font-mono px-1.5 py-0.2 rounded text-[9px] ${
                    physicsAudit.concordance_pct >= 75
                      ? "text-emerald-300 bg-emerald-500/15"
                      : "text-amber-300 bg-amber-500/15"
                  }`}>
                    HCI: {physicsAudit.concordance_pct}%
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                  <div className="p-1 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[8px] text-slate-500 font-sans">CN</div>
                    <div className="text-white font-bold">{physicsAudit.scs_metrics.curve_number}</div>
                  </div>
                  <div className="p-1 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[8px] text-slate-500 font-sans">Ret S</div>
                    <div className="text-white font-bold">{physicsAudit.scs_metrics.potential_retention_mm}mm</div>
                  </div>
                  <div className="p-1 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[8px] text-slate-500 font-sans">Runoff Q</div>
                    <div className="text-blue-300 font-bold">{physicsAudit.scs_metrics.runoff_depth_mm}mm</div>
                  </div>
                  <div className="p-1 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[8px] text-slate-500 font-sans">Peak qp</div>
                    <div className="text-purple-300 font-bold">{physicsAudit.scs_metrics.peak_discharge_m3s}m³/s</div>
                  </div>
                </div>
              </div>
            )}

            {/* Cascade Routing Trigger */}
            {onTriggerCascade && (
              <div>
                {activeCascadePath && activeCascadePath.origin_grid_id === zoneDetail.grid_id ? (
                  <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold">Cascade: </span>
                      <span className="font-mono text-[11px]">{activeCascadePath.total_cascade_hops} hops • +{activeCascadePath.terminal_arrival_minutes}m</span>
                    </div>
                    {onClearCascade && (
                      <button
                        onClick={onClearCascade}
                        className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => onTriggerCascade(zoneDetail.grid_id)}
                    className="w-full py-1.5 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Trace Downstream Flood Cascade (DAHG)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 px-2 text-slate-400 text-xs">
            <Compass className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
            <div className="font-semibold text-slate-300">No Zone Selected</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Click any grid cell on the map to inspect terrain &amp; TreeSHAP metrics.</div>
          </div>
        )}
      </div>

      {/* 5. What-If Rainfall Scenario Simulator */}
      <div className="bg-[#0B1220]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 shadow-xl shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Stress Simulator
            </h4>
          </div>
          {multiplier > 1.0 && (
            <button
              onClick={handleResetScenario}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Reset
            </button>
          )}
        </div>

        {/* Quick Multiplier Buttons */}
        <div className="grid grid-cols-4 gap-1">
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
                  : "bg-[#050A14] hover:bg-slate-800 text-slate-400 border-slate-800"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Multiplier Slider */}
        <input
          type="range"
          min="1.0"
          max="2.5"
          step="0.05"
          value={multiplier}
          onChange={(e) => handleMultiplierChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />

        {/* Simulation Output */}
        {simLoading ? (
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#050A14] text-xs text-slate-400">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>Computing deltas...</span>
          </div>
        ) : simResult ? (
          <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-900/30 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Escalated Sectors:</span>
              <span className="font-mono font-bold text-rose-400">
                +{simResult.impact_deltas.new_critical_zones} Critical
              </span>
            </div>

            <button
              onClick={handleApplyToMap}
              className="w-full py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-sm"
            >
              <Layers className="w-3 h-3" />
              <span>Project on Map</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* 6. Priority Response Queue */}
      <div className="bg-[#0B1220]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3.5 shadow-xl shrink-0 space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Priority Queue
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {priorityZones.length} Ranked
          </span>
        </div>

        <div className="space-y-1.5">
          {priorityZones.slice(0, 3).map((pz, idx) => (
            <div
              key={pz.grid_id}
              onClick={() => onSelectGrid(pz.grid_id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                selectedGridId === pz.grid_id
                  ? "bg-blue-950/40 border-blue-500/50"
                  : "bg-[#050A14] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-4 h-4 rounded text-[9px] font-bold font-mono flex items-center justify-center bg-slate-800 text-slate-300 shrink-0">
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {pz.zone_name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {pz.reason || "Lowland Sump Convergence"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-mono">
                  {pz.risk_score}%
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
