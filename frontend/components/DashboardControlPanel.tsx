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
  Loader2,
  Target
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
  const [simError, setSimError] = useState<string | null>(null);
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
    setSimError(null);
    setSimResult(null);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const baseRain = summary?.current_rainfall_24h_mm;
        if (baseRain == null) {
          throw new Error("Live rainfall is not loaded, so the scenario was not run.");
        }
        const res = await runSimulation(cityId, val, baseRain);
        setSimResult(res);
        setScenarioActive(true);
      } catch (e) {
        setSimResult(null);
        setScenarioActive(false);
        setSimError(e instanceof Error ? e.message : "The scenario was not run.");
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
    <div className="w-full h-full flex flex-col space-y-3.5 text-[#12262A] overflow-y-auto pr-1 select-text scroll-smooth">
      {/* 1. Basin Status Card */}
      <div className="bg-[#FBFDFC] border border-[#D5E2E0] rounded-2xl p-3.5 shadow-sm shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {summary ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              ) : null}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${summary ? "bg-emerald-500" : "bg-slate-400"}`}></span>
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#4C5E62] tracking-wider">
                Active River Basin
              </div>
              <h3 className="text-sm font-bold text-[#12262A] tracking-tight">
                {cityName}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-mono uppercase inline-flex items-center gap-1 shadow-2xs ${
              isRedAlert 
                ? "bg-rose-100 text-rose-800 border-rose-300" 
                : isOrangeAlert 
                ? "bg-amber-100 text-amber-800 border-amber-300" 
                : "bg-emerald-100 text-emerald-800 border-emerald-300"
            }`}>
              {!summary ? "NO FEED" : isRedAlert ? "RED ALERT" : isOrangeAlert ? "ORANGE WATCH" : "MONITORING"}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#E6EFEB] flex items-center justify-between text-[11px]">
          <span className="text-[#4C5E62] font-medium">
            {summary ? "Grid loaded from the risk service" : "Waiting for the risk service"}
          </span>
          <span className="text-[#12262A] font-semibold font-mono">
            {summary ? `${summary.monitored_area_sqkm} km² • ${summary.total_grids} cells` : "n/a"}
          </span>
        </div>
      </div>

      {/* 2. Key Flood Indicators */}
      {summary && (
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <div className="bg-rose-50/80 border border-rose-200/90 rounded-xl p-2.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-rose-700 flex items-center justify-between">
              <span>Critical Zones</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="text-lg font-black text-rose-900 mt-0.5 font-mono">
              {summary.critical_zones}
              <span className="text-[11px] font-sans font-medium text-rose-700 ml-1">Sectors</span>
            </div>
            <div className="text-[10px] text-rose-700 font-mono font-medium mt-0.5">&gt;80% Inundation Probability</div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-2.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-amber-800">
              <span>Elevated Risk</span>
            </div>
            <div className="text-lg font-black text-amber-900 mt-0.5 font-mono">
              {summary.high_risk_zones + summary.elevated_zones}
              <span className="text-[11px] font-sans font-medium text-amber-800 ml-1">Sectors</span>
            </div>
            <div className="text-[10px] text-amber-800 font-mono font-medium mt-0.5">40%–80% Probability</div>
          </div>

          <div className="bg-sky-50/80 border border-sky-200/90 rounded-xl p-2.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-sky-800 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-sky-600" />
              <span>24h Rainfall</span>
            </div>
            <div className="text-lg font-black text-sky-900 mt-0.5 font-mono">
              {summary.current_rainfall_24h_mm}
              <span className="text-[11px] font-sans font-medium text-sky-800 ml-1">mm</span>
            </div>
            <div className="text-[10px] text-sky-800 font-mono font-medium mt-0.5">
              {summary.rainfall_observed_on
                ? `Telemetry ${summary.rainfall_observed_on}`
                : "From the risk summary"}
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-2.5 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-emerald-800">
              <span>Safe Uplands</span>
            </div>
            <div className="text-lg font-black text-emerald-900 mt-0.5 font-mono">
              {summary.low_zones}
              <span className="text-[11px] font-sans font-medium text-emerald-800 ml-1">Sectors</span>
            </div>
            <div className="text-[10px] text-emerald-800 font-mono font-medium mt-0.5">&lt;20% Low Probability</div>
          </div>
        </div>
      )}

      {/* 3. Autonomous Fleet Optimizer Action Banner */}
      {onOpenFleetOptimizer && (
        <button
          onClick={onOpenFleetOptimizer}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-teal-50 via-emerald-50 to-[#FBFDFC] border border-teal-200 hover:border-teal-400 hover:shadow-sm text-xs font-bold text-[#12262A] transition-all cursor-pointer shadow-2xs active:scale-[0.99] group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#115E59] text-white flex items-center justify-center shadow-2xs">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[#12262A] text-xs font-bold flex items-center gap-1.5">
                Autonomous Fleet Dispatch
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-mono font-bold">ILP</span>
              </div>
              <div className="text-[10px] text-[#4C5E62] font-medium">Generate NDMA Form D-4 Equipment Plan</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-teal-700 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* 4. Selected Zone Hydrological Inspection */}
      <div className="bg-[#FBFDFC] border border-[#D5E2E0] rounded-2xl p-3.5 shadow-sm shrink-0">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E6EFEB]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#115E59]" />
            <h4 className="text-xs font-bold text-[#12262A] uppercase tracking-wider">
              Zone Diagnostics
            </h4>
          </div>
          {selectedGridId && (
            <button
              onClick={onClearSelectedGrid}
              className="text-[10px] text-[#4C5E62] hover:text-[#12262A] flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F3F7F6] border border-[#D5E2E0] transition cursor-pointer font-medium"
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
                <div className="text-[10px] font-mono text-[#115E59] font-bold">
                  {zoneDetail.grid_id} • Lead Time: {zoneDetail.prediction_horizon_hours || 3}h
                </div>
                <h3 className="text-sm font-bold text-[#12262A] mt-0.5">
                  {zoneDetail.zone_name}
                </h3>
                {zoneDetail.failure_mode && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      Cause: {zoneDetail.failure_mode}
                    </span>
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono shadow-2xs ${
                zoneDetail.risk_level === "CRITICAL"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : zoneDetail.risk_level === "HIGH"
                  ? "bg-red-100 text-red-800 border-red-300"
                  : zoneDetail.risk_level === "ELEVATED"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}>
                {zoneDetail.risk_level} • {zoneDetail.risk_score}%
              </span>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-[#F3F7F6] border border-[#D5E2E0] text-center font-mono">
              <div>
                <div className="text-[9px] text-[#4C5E62] uppercase font-sans font-semibold">Elevation</div>
                <div className="text-xs font-bold text-[#12262A] mt-0.5">{zoneDetail.terrain?.elevation_m ?? "--"}m</div>
              </div>
              <div>
                <div className="text-[9px] text-[#4C5E62] uppercase font-sans font-semibold">Slope</div>
                <div className="text-xs font-bold text-[#12262A] mt-0.5">{zoneDetail.terrain?.slope_deg ?? "--"}°</div>
              </div>
              <div>
                <div className="text-[9px] text-[#4C5E62] uppercase font-sans font-semibold">Flow Acc</div>
                <div className="text-xs font-bold text-[#12262A] mt-0.5">{zoneDetail.terrain?.flow_accumulation ?? "--"}/100</div>
              </div>
            </div>

            {/* Causal Factors (TreeSHAP) */}
            {zoneDetail.top_factors && zoneDetail.top_factors.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#4C5E62] tracking-wider">
                  Key Risk Drivers (TreeSHAP)
                </div>
                <div className="space-y-1">
                  {zoneDetail.top_factors.slice(0, 3).map((f, i) => {
                    const isEscalating = f.direction === "escalating";
                    return (
                      <div key={i} className="p-1.5 rounded-lg bg-[#F3F7F6] border border-[#D5E2E0] flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-[#12262A] flex items-center gap-1.5">
                          {isEscalating ? (
                            <TrendingUp className="w-3 h-3 text-rose-600 shrink-0" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-emerald-600 shrink-0" />
                          )}
                          {f.factor}
                        </span>
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          isEscalating 
                            ? "text-rose-800 bg-rose-100 border-rose-200" 
                            : "text-emerald-800 bg-emerald-100 border-emerald-200"
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
              <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                  <span className="text-teal-900 flex items-center gap-1 font-bold">
                    <Atom className="w-3.5 h-3.5 text-teal-700" /> SCS-CN Mass Balance
                  </span>
                  <span className={`font-mono px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                    physicsAudit.concordance_pct >= 75
                      ? "text-emerald-800 bg-emerald-100 border-emerald-200"
                      : "text-amber-800 bg-amber-100 border-amber-200"
                  }`}>
                    HCI: {physicsAudit.concordance_pct}%
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                  <div className="p-1 rounded bg-[#FBFDFC] border border-teal-200/80">
                    <div className="text-[8px] text-[#4C5E62] font-sans font-semibold">CN</div>
                    <div className="text-[#12262A] font-bold">{physicsAudit.scs_metrics.curve_number}</div>
                  </div>
                  <div className="p-1 rounded bg-[#FBFDFC] border border-teal-200/80">
                    <div className="text-[8px] text-[#4C5E62] font-sans font-semibold">Ret S</div>
                    <div className="text-[#12262A] font-bold">{physicsAudit.scs_metrics.potential_retention_mm}mm</div>
                  </div>
                  <div className="p-1 rounded bg-[#FBFDFC] border border-teal-200/80">
                    <div className="text-[8px] text-[#4C5E62] font-sans font-semibold">Runoff Q</div>
                    <div className="text-teal-800 font-bold">{physicsAudit.scs_metrics.runoff_depth_mm}mm</div>
                  </div>
                  <div className="p-1 rounded bg-[#FBFDFC] border border-teal-200/80">
                    <div className="text-[8px] text-[#4C5E62] font-sans font-semibold">Peak qp</div>
                    <div className="text-teal-800 font-bold">{physicsAudit.scs_metrics.peak_discharge_m3s}m³/s</div>
                  </div>
                </div>
              </div>
            )}

            {/* Cascade Routing Trigger */}
            {onTriggerCascade && (
              <div>
                {activeCascadePath && activeCascadePath.origin_grid_id === zoneDetail.grid_id ? (
                  <div className="p-2 rounded-xl bg-teal-100/80 border border-teal-300 text-xs text-teal-900 flex items-center justify-between font-medium">
                    <div>
                      <span className="font-bold">Cascade: </span>
                      <span className="font-mono text-[11px] font-semibold">{activeCascadePath.total_cascade_hops} hops • +{activeCascadePath.terminal_arrival_minutes}m</span>
                    </div>
                    {onClearCascade && (
                      <button
                        onClick={onClearCascade}
                        className="text-[10px] text-[#4C5E62] hover:text-[#12262A] px-1.5 py-0.5 rounded bg-white border border-[#D5E2E0] cursor-pointer font-semibold shadow-2xs"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => onTriggerCascade(zoneDetail.grid_id)}
                    className="w-full py-2 px-3 rounded-xl bg-[#115E59] hover:bg-[#0D4844] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-[0.99]"
                  >
                    <CornerDownRight className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Trace Downstream Flood Cascade (DAHG)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-5 px-2 text-[#4C5E62] text-xs">
            <Compass className="w-7 h-7 text-[#4C5E62] mx-auto mb-2 opacity-80" />
            <div className="font-bold text-[#12262A] text-sm">No Zone Selected</div>
            <div className="text-[11px] text-[#4C5E62] mt-1 font-medium leading-relaxed">
              Click any grid cell on the map to inspect terrain &amp; TreeSHAP metrics.
            </div>
          </div>
        )}
      </div>

      {/* 5. What-If Rainfall Scenario Simulator */}
      <div className="bg-[#FBFDFC] border border-[#D5E2E0] rounded-2xl p-3.5 shadow-sm shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
            <h4 className="text-xs font-bold text-[#12262A] uppercase tracking-wider">
              Stress Simulator
            </h4>
          </div>
          {multiplier > 1.0 && (
            <button
              onClick={handleResetScenario}
              className="text-[10px] font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 cursor-pointer shadow-2xs"
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
                  ? "bg-[#115E59] text-white border-[#115E59] font-bold shadow-2xs"
                  : "bg-[#F3F7F6] hover:bg-slate-200 text-[#12262A] border-[#D5E2E0]"
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
          className="w-full h-1.5 bg-[#D5E2E0] rounded-lg appearance-none cursor-pointer accent-[#115E59]"
        />

        {/* Simulation Output */}
        {simLoading ? (
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#F3F7F6] text-xs text-[#4C5E62] font-medium">
            <RefreshCw className="w-3 h-3 animate-spin text-[#115E59]" />
            <span>Computing deltas...</span>
          </div>
        ) : simError ? (
          <p className="text-xs text-rose-700 font-medium">{simError}</p>
        ) : simResult ? (
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#4C5E62] font-semibold">Escalated Sectors:</span>
              <span className="font-mono font-bold text-rose-700">
                +{simResult.impact_deltas.new_critical_zones} Critical
              </span>
            </div>

            <button
              onClick={handleApplyToMap}
              className="w-full py-1.5 bg-[#115E59] hover:bg-[#0D4844] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Project on Map</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* 6. Priority Response Queue */}
      <div className="bg-[#FBFDFC] border border-[#D5E2E0] rounded-2xl p-3.5 shadow-sm shrink-0 space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E6EFEB]">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <h4 className="text-xs font-bold text-[#12262A] uppercase tracking-wider">
              Priority Queue
            </h4>
          </div>
          <span className="text-[10px] text-[#4C5E62] font-mono font-semibold">
            {priorityZones.length} Ranked
          </span>
        </div>

        <div className="space-y-1.5">
          {priorityZones.slice(0, 3).map((pz, idx) => (
            <div
              key={pz.grid_id}
              onClick={() => onSelectGrid(pz.grid_id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
                selectedGridId === pz.grid_id
                  ? "bg-teal-50 border-[#115E59]"
                  : "bg-[#F3F7F6] border-[#D5E2E0] hover:border-teal-400 hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-4 h-4 rounded text-[9px] font-bold font-mono flex items-center justify-center bg-[#D5E2E0] text-[#12262A] shrink-0">
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#12262A] truncate">
                    {pz.zone_name}
                  </div>
                  <div className="text-[10px] text-[#4C5E62] font-medium truncate">
                    {pz.reason || "Lowland Sump Convergence"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-mono border border-rose-200">
                  {pz.risk_score}%
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#4C5E62]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
