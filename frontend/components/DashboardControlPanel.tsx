"use client";

import React, { useState, useEffect } from "react";
import { 
  RiskSummary, 
  ZoneDetail, 
  PriorityZoneItem, 
  PhysicsAuditResponse,
  CascadeTraceResponse
} from "../types";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { fetchObservationAt, fetchPhysicsAudit, fetchTelemetryCoverage } from "../lib/api";
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Sparkles,
  Compass,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Droplets,
  Building2,
  MapPin,
  X,
  ArrowRight,
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
  onCalculate: (rain: number | null, stage: number | null) => Promise<void>;
  calculating?: boolean;
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
  onCalculate,
  calculating = false,
  healthStatus,
  onTriggerCascade,
  onOpenFleetOptimizer,
  activeCascadePath,
  onClearCascade
}) => {
  const t = getTranslation(currentLang);

  const situations = [
    { id: "latest", label: "Latest telemetry", date: "2025-10-30", rain: null as number | null, stage: null as number | null },
    { id: "dry", label: "Dry baseline", date: "2023-01-01", rain: 0, stage: 3.4 },
    { id: "heavy", label: "Heavy storm", date: "2022-08-06", rain: 78.6, stage: 8.67 },
    { id: "extreme", label: "Extreme storm", date: "2024-09-01", rain: 240.6, stage: 3.75 },
  ];
  const [rainInput, setRainInput] = useState("");
  const [stageInput, setStageInput] = useState("");
  const [activeSample, setActiveSample] = useState("latest");
  const [calcError, setCalcError] = useState<string | null>(null);
  const [momentAt, setMomentAt] = useState("2022-07-23T09:00");
  const [momentNote, setMomentNote] = useState<string | null>(null);
  const [coverageEnd, setCoverageEnd] = useState("2023-09-28T23:59");

  useEffect(() => {
    fetchTelemetryCoverage()
      .then((span) => {
        if (span.overlap_end) setCoverageEnd(`${span.overlap_end}T23:59`);
      })
      .catch(() => undefined);
  }, []);

  const showMoment = async () => {
    setCalcError(null);
    setMomentNote(null);
    try {
      const moment = await fetchObservationAt(momentAt);
      setRainInput(String(moment.rain_24h_mm));
      setStageInput(String(moment.prakasam_stage_m));
      setActiveSample("moment");
      const offset = moment.stage_offset_hours === 0
        ? "at the time you picked"
        : `${moment.stage_offset_hours} h from the time you picked`;
      setMomentNote(
        `Rain is the ${moment.rain_date} daily gauge maximum. Prakasam stage ${moment.prakasam_stage_m} m was read at ${moment.stage_observed_at.replace("T", " ")}, ${offset}.`
      );
      await runCalculation(moment.rain_24h_mm, moment.prakasam_stage_m);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "That time has no paired rainfall and stage record.");
    }
  };

  useEffect(() => {
    if (activeSample !== "latest" || !summary) return;
    setRainInput(String(summary.current_rainfall_24h_mm ?? ""));
    setStageInput(String(summary.current_prakasam_stage_m ?? ""));
  }, [activeSample, summary]);

  const runCalculation = async (rain: number | null, stage: number | null) => {
    setCalcError(null);
    try {
      await onCalculate(rain, stage);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "The model did not score this input.");
    }
  };

  const applySample = (sample: (typeof situations)[number]) => {
    setActiveSample(sample.id);
    if (sample.rain == null || sample.stage == null) {
      void runCalculation(null, null);
      return;
    }
    setRainInput(String(sample.rain));
    setStageInput(String(sample.stage));
    void runCalculation(sample.rain, sample.stage);
  };

  const calculateEdited = () => {
    const rain = Number(rainInput);
    const stage = Number(stageInput);
    if (!Number.isFinite(rain) || rain < 0 || !Number.isFinite(stage) || stage < 0) {
      setCalcError("Enter a rainfall of 0 mm or more and a barrage stage of 0 m or more.");
      return;
    }
    setActiveSample("custom");
    void runCalculation(rain, stage);
  };

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
                : "Custom model input"}
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

      <div className="bg-[#FBFDFC] border border-[#D5E2E0] rounded-2xl p-3.5 shadow-sm shrink-0 space-y-2.5">
        <div>
          <h4 className="text-xs font-bold text-[#12262A] uppercase tracking-wider">
            Model inputs
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-[#4C5E62]">
            Pick a date and time. The score uses that day’s rainfall total and the Prakasam reading nearest to the clock. Both records overlap from 22 Feb 2021 through 28 Sep 2023. Terrain stays on each cell.
          </p>
        </div>
        <label className="block text-[11px] font-medium text-[#12262A]">
          Date and time
          <input
            type="datetime-local"
            value={momentAt}
            min="2021-02-22T00:00"
            max={coverageEnd}
            onChange={(event) => setMomentAt(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#D5E2E0] bg-white px-2 py-1.5 font-mono text-sm text-[#12262A]"
          />
        </label>
        <button
          type="button"
          onClick={() => void showMoment()}
          disabled={calculating || !momentAt}
          className="w-full rounded-lg border border-[#115E59] bg-[#E6F3F1] py-2 text-xs font-semibold text-[#115E59] disabled:opacity-60"
        >
          {calculating ? "Calculating…" : "Show this moment"}
        </button>
        {momentNote ? <p className="text-[11px] leading-relaxed text-[#4C5E62]">{momentNote}</p> : null}
        <div className="grid grid-cols-2 gap-1.5">
          {situations.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={calculating}
              onClick={() => applySample(sample)}
              className={`rounded-lg border px-2 py-1.5 text-left text-[11px] disabled:opacity-60 ${
                activeSample === sample.id
                  ? "border-[#115E59] bg-[#E6F3F1] text-[#115E59]"
                  : "border-[#D5E2E0] bg-[#F3F7F6] text-[#12262A]"
              }`}
            >
              <span className="block font-semibold">{sample.label}</span>
              <span className="font-mono text-[10px] text-[#4C5E62]">
                {sample.rain == null ? "Server file" : `${sample.rain} mm · ${sample.stage} m`}
              </span>
            </button>
          ))}
        </div>
        <label className="block text-[11px] font-medium text-[#12262A]">
          24-hour rainfall (mm)
          <input
            type="number"
            min="0"
            step="0.1"
            value={rainInput}
            onChange={(event) => {
              setRainInput(event.target.value);
              setActiveSample("custom");
            }}
            className="mt-1 w-full rounded-lg border border-[#D5E2E0] bg-white px-2 py-1.5 font-mono text-sm text-[#12262A]"
          />
        </label>
        <label className="block text-[11px] font-medium text-[#12262A]">
          Prakasam barrage stage (m)
          <input
            type="number"
            min="0"
            step="0.01"
            value={stageInput}
            onChange={(event) => {
              setStageInput(event.target.value);
              setActiveSample("custom");
            }}
            className="mt-1 w-full rounded-lg border border-[#D5E2E0] bg-white px-2 py-1.5 font-mono text-sm text-[#12262A]"
          />
        </label>
        <button
          type="button"
          onClick={calculateEdited}
          disabled={calculating}
          className="w-full rounded-lg bg-[#115E59] py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {calculating ? "Calculating…" : "Calculate"}
        </button>
        {calcError ? <p className="text-xs text-[#B42318]">{calcError}</p> : null}
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
