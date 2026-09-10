"use client";

import React, { useState, useEffect } from "react";
import { askAICopilot } from "../lib/api";
import { AICopilotResponse } from "../types";
import { 
  Bot, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Wrench, 
  Truck, 
  Compass, 
  CheckCircle2, 
  Activity,
  Zap,
  Building2,
  RefreshCw
} from "lucide-react";

interface AICopilotProps {
  cityId: string;
  currentRainfall24h?: number;
}

const CITY_NAME_LOOKUP: Record<string, string> = {
  VJA: "Vijayawada / Amaravati",
  CHE: "Chennai",
  BOM: "Mumbai",
  BLR: "Bengaluru",
  DEL: "Delhi NCR",
  HYD: "Hyderabad",
  CCU: "Kolkata",
  AMD: "Ahmedabad",
  PNQ: "Pune",
  COK: "Kochi",
  GAU: "Guwahati",
  PAT: "Patna"
};

export const AICopilot: React.FC<AICopilotProps> = ({ cityId, currentRainfall24h = 145.0 }) => {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<AICopilotResponse | null>(null);

  const cityName = CITY_NAME_LOOKUP[cityId] || cityId;

  // Auto-generate situation summary whenever cityId changes
  useEffect(() => {
    handleRunQuery("Generate comprehensive urban flood situational assessment, tactical dewatering plan, and priority alert dispatch.");
  }, [cityId]);

  const handleRunQuery = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await askAICopilot(cityId, q, currentRainfall24h);
      setResponse(res);
      if (!customQuery) setQuery("");
    } catch (e) {
      console.error("AI Copilot error:", e);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "What is the pump deployment strategy for the next 6 hours?",
    "Identify critical underpasses and subways requiring road closure.",
    "Draft emergency citizen advisory for low-lying residential wards.",
    "Evaluate backflow vulnerability for primary river sluice gates."
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-blue-900/40 backdrop-blur shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              AI Flood Incident Commander • Multi-City Intelligence
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Autonomous Urban Flood Copilot ({cityName})
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Synthesizes real-time ERA5/IMD storm telemetry, NASA SRTM 30m terrain topography, USDA SCS Curve Number runoff mechanics, and municipal response priorities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Sector</div>
              <div className="text-sm font-bold text-blue-300 font-mono">{cityId} Catchment</div>
            </div>
            <button
              onClick={() => handleRunQuery("Refresh comprehensive situation assessment and tactical asset deployment.")}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Re-Assess
            </button>
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunQuery();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Bot className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask DrainSense AI about ${cityName} (e.g. pump allocations, traffic diversions, sluice gate operations)...`}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            <Send className="w-3.5 h-3.5" />
            Dispatch
          </button>
        </form>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-500 font-medium py-0.5">Recommended Prompts:</span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleRunQuery(p)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-blue-300 hover:border-slate-700 transition"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Copilot Intelligence Cards */}
      {response && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Situation Assessment */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Real-Time AI Situational Synthesis
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {response.risk_level_summary}
                </span>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 font-normal">
                {response.ai_situation_assessment}
              </p>

              {/* Tactical Recommendations */}
              <div className="pt-2">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Tactical Asset Deployment & Pumping Orders
                </div>
                <div className="space-y-2">
                  {response.tactical_recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Critical Infrastructure Watch */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Critical Urban Infrastructure Threat Assessment
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {response.critical_infrastructure_alerts.map((inf, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 leading-relaxed">
                    ⚠️ {inf}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Advisory & Confidence */}
          <div className="space-y-6">
            {/* Evacuation & Traffic Alerts */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-rose-900/30 backdrop-blur space-y-4">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Citizen Safety & Commuter Routing Advisories
              </div>
              <div className="space-y-2.5">
                {response.evacuation_and_traffic_advisories.map((adv, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-200">
                    📢 {adv}
                  </div>
                ))}
              </div>
            </div>

            {/* Model Confidence & Telemetry Card */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase flex items-center justify-between">
                <span>Model Calibration Confidence</span>
                <span className="text-emerald-400 font-mono">{(response.model_confidence_score * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${response.model_confidence_score * 100}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                Calibrated against {cityName}&apos;s historic storms via Isotonic Regression on XGBoost tree ensembles (Brier score &lt; 0.05).
              </div>
            </div>

            {/* Scientific Guardrail */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              ⚖️ <strong>Municipal Standard Note:</strong> This copilot serves operational decision-support only under National Disaster Management Authority (NDMA) guidelines. Always cross-verify with local civic ground telemetry.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
