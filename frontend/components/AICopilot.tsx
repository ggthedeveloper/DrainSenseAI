"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { askAICopilot } from "../lib/api";
import { AICopilotResponse } from "../types";
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Wrench,
  Truck,
  CheckCircle2,
  Activity,
  Building2,
  RefreshCw,
  Trash2,
  AlertCircle,
  ChevronDown,
  Zap,
  Waves,
  Users,
  Radio,
  Hospital,
  Construction
} from "lucide-react";

interface AICopilotProps {
  cityId: string;
  currentRainfall24h?: number;
}

interface ChatEntry {
  id: string;
  query: string;
  response: AICopilotResponse;
  timestamp: string;
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
  PAT: "Patna",
};

const SAMPLE_PROMPTS = [
  { label: "Pump Deployment", query: "What is the pump deployment strategy for the next 6 hours?", icon: Waves },
  { label: "Road Closures", query: "Identify critical underpasses and subways requiring road closure.", icon: Construction },
  { label: "Citizen Advisory", query: "Draft emergency citizen advisory for all low-lying residential wards.", icon: Users },
  { label: "Sluice Gates", query: "Evaluate backflow vulnerability for primary river sluice gates.", icon: Radio },
  { label: "Hospitals", query: "What must hospitals and medical facilities do during the flood?", icon: Hospital },
  { label: "Power Grid", query: "Electrical grid risk — should we isolate transformers in flood zones?", icon: Zap },
];

const getPostureBadgeStyle = (posture: string) => {
  if (posture.includes("SEVERE") || posture.includes("RED"))
    return "bg-rose-500/20 text-rose-300 border-rose-500/40";
  if (posture.includes("ELEVATED") || posture.includes("ORANGE"))
    return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
};

export const AICopilot: React.FC<AICopilotProps> = ({ cityId, currentRainfall24h = 145.0 }) => {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);

  const cityName = CITY_NAME_LOOKUP[cityId] || cityId;
  const requestIdRef = useRef<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to latest message whenever history grows
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleRunQuery = useCallback(
    async (customQuery?: string) => {
      const q = (customQuery || query).trim();
      if (!q) return;

      // Race-condition guard: each request gets a unique ID
      const reqId = `${Date.now()}-${Math.random()}`;
      requestIdRef.current = reqId;

      setLoading(true);
      setErrorMsg(null);
      if (!customQuery) setQuery(""); // Clear input only for typed queries

      try {
        const res = await askAICopilot(cityId, q, currentRainfall24h);

        // If a newer request started, discard this stale response
        if (requestIdRef.current !== reqId) return;

        const entry: ChatEntry = {
          id: reqId,
          query: q,
          response: res,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
        setChatHistory((prev) => [...prev, entry]);
      } catch (e: any) {
        if (requestIdRef.current !== reqId) return;
        const msg =
          e?.message?.includes("422") || e?.message?.includes("empty")
            ? "Please type a question before dispatching."
            : e?.message || "AI Copilot is temporarily unavailable. Check backend connection.";
        setErrorMsg(msg);
      } finally {
        if (requestIdRef.current === reqId) setLoading(false);
      }
    },
    [cityId, currentRainfall24h, query]
  );

  // Auto-load situation report when city changes
  useEffect(() => {
    setChatHistory([]); // Reset history on city switch
    setErrorMsg(null);
    handleRunQuery("Generate comprehensive urban flood situational assessment, tactical dewatering plan, and priority alert dispatch.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-blue-900/40 backdrop-blur shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              AI Flood Incident Commander · {cityName}
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              DrainSense AI Urban Copilot
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Synthesises ERA5/IMD storm telemetry, NASA SRTM terrain data, SCS Curve Number runoff mechanics and real-time ML risk grids to generate city-specific, query-aware tactical intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Sector</div>
              <div className="text-sm font-bold text-blue-300 font-mono">{cityId} — {currentRainfall24h}mm/24h</div>
            </div>
            {chatHistory.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Clear all chat history?")) {
                    setChatHistory([]);
                    setErrorMsg(null);
                  }
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/30 border border-slate-700 text-slate-400 hover:text-rose-400 transition text-xs flex items-center gap-1 cursor-pointer"
                title="Clear history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() =>
                handleRunQuery(
                  "Refresh comprehensive situation assessment and tactical asset deployment."
                )
              }
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
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
            if (!query.trim()) {
              setErrorMsg("Please type a question before dispatching.");
              inputRef.current?.focus();
              return;
            }
            handleRunQuery();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Bot className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={`Ask about ${cityName} — pumps, underpasses, evacuation, sluice gates, hospitals, power...`}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Dispatch
          </button>
        </form>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-500 font-semibold py-1 self-center">Quick Dispatch:</span>
          {SAMPLE_PROMPTS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setQuery(p.query);
                  handleRunQuery(p.query);
                }}
                disabled={loading}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-blue-300 hover:border-blue-700/50 transition cursor-pointer disabled:opacity-50 font-medium"
              >
                <Icon className="w-3 h-3" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading skeleton — shown only when no history yet */}
      {loading && chatHistory.length === 0 && (
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur animate-pulse space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              AI analysing {cityName} — generating situational intelligence...
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-800 rounded w-full" />
            <div className="h-3 bg-slate-800 rounded w-4/5" />
            <div className="h-3 bg-slate-800 rounded w-3/5" />
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/70 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Chat History — newest at bottom */}
      {chatHistory.map((entry, idx) => (
        <div key={entry.id} className="space-y-4">
          {/* Query bubble */}
          <div className="flex justify-end">
            <div className="max-w-2xl bg-blue-600/15 border border-blue-600/30 rounded-2xl rounded-tr-sm px-4 py-3">
              <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Bot className="w-3 h-3" /> Operator Query · {entry.timestamp}
              </div>
              <p className="text-sm text-slate-200 font-medium">{entry.query}</p>
            </div>
          </div>

          {/* Response cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2/3 — Situational Assessment + Tactical */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wide">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Real-Time AI Situational Synthesis
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${getPostureBadgeStyle(
                      entry.response.risk_level_summary
                    )}`}
                  >
                    {entry.response.risk_level_summary}
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                  {entry.response.ai_situation_assessment}
                </p>

                {/* Tactical Recommendations */}
                <div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Tactical Asset Deployment &amp; Operational Orders
                  </div>
                  <div className="space-y-2">
                    {entry.response.tactical_recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Critical Infrastructure */}
              <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Critical Urban Infrastructure Threat Assessment
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {entry.response.critical_infrastructure_alerts.map((inf, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 leading-relaxed"
                    >
                      ⚠️ {inf}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1/3 — Evacuation + Confidence */}
            <div className="space-y-4">
              <div className="bg-slate-900/70 p-5 rounded-2xl border border-rose-900/30 backdrop-blur space-y-4">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  Citizen Safety &amp; Commuter Advisories
                </div>
                <div className="space-y-2.5">
                  {entry.response.evacuation_and_traffic_advisories.map((adv, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-200"
                    >
                      📢 {adv}
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Confidence */}
              <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase">
                  <span>Model Calibration</span>
                  <span className="text-emerald-400 font-mono">
                    {(entry.response.model_confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${entry.response.model_confidence_score * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Calibrated via Isotonic Regression on XGBoost tree ensembles against {entry.response.city_name}&apos;s historic flood catalog.
                </p>
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                ⚖️{" "}
                <strong>NDMA Guideline:</strong> This copilot is operational decision-support only. Cross-verify with local civic telemetry before issuing official orders.
              </div>
            </div>
          </div>

          {/* Divider between messages (not after last one) */}
          {idx < chatHistory.length - 1 && (
            <div className="border-t border-slate-800/40 pt-2 flex items-center justify-center gap-2">
              <ChevronDown className="w-3 h-3 text-slate-700" />
              <span className="text-[10px] text-slate-600">Earlier dispatch</span>
              <ChevronDown className="w-3 h-3 text-slate-700" />
            </div>
          )}
        </div>
      ))}

      {/* Loading indicator when already have history (subsequent queries) */}
      {loading && chatHistory.length > 0 && (
        <div className="flex items-center justify-center gap-3 py-4 text-xs text-blue-400 font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Generating query-specific intelligence for {cityName}...
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={chatBottomRef} />
    </div>
  );
};
