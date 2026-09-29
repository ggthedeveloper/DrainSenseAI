"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Truck, 
  ShieldAlert, 
  Fuel, 
  Users, 
  Waves, 
  FileText, 
  CheckCircle2, 
  Download, 
  Copy, 
  Printer, 
  Loader2,
  AlertTriangle,
  SendHorizontal
} from "lucide-react";
import { DispatchOptimizationResponse } from "../types";
import { fetchOptimizeDispatch } from "../lib/api";

interface ResourceOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityId: string;
  cityName: string;
  officerName?: string;
}

export const ResourceOptimizerModal: React.FC<ResourceOptimizerModalProps> = ({
  isOpen,
  onClose,
  cityId,
  cityName,
  officerName = "Gaurav (Administrator)"
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"allocations" | "memorandum">("allocations");
  const [loading, setLoading] = useState<boolean>(true);
  const [dispatchData, setDispatchData] = useState<DispatchOptimizationResponse | null>(null);
  const [isMobilizing, setIsMobilizing] = useState<boolean>(false);
  const [mobilizeSuccess, setMobilizeSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setMobilizeSuccess(false);
      fetchOptimizeDispatch(cityId, undefined, officerName)
        .then((data) => {
          setDispatchData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, cityId, officerName]);

  if (!isOpen) return null;

  const handleCopyMemo = () => {
    if (dispatchData?.ndma_memo_text) {
      navigator.clipboard.writeText(dispatchData.ndma_memo_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMemo = () => {
    if (!dispatchData) return;
    const blob = new Blob([dispatchData.ndma_memo_text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dispatchData.memorandum_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && dispatchData) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${dispatchData.memorandum_id}</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; font-size: 11px; padding: 24px; color: #111; }
            </style>
          </head>
          <body>${dispatchData.ndma_memo_text}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleMobilize = () => {
    setIsMobilizing(true);
    setTimeout(() => {
      setIsMobilizing(false);
      setMobilizeSuccess(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300">
                  Operations Research Engine
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {cityId} Flood Command
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-0.5">
                Autonomous Municipal Fleet & Dewatering Dispatch Optimizer
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
            <span className="text-xs font-mono text-slate-400">
              Solving Constrained Multi-Objective Integer Dispatch Algorithm...
            </span>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && dispatchData && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Top KPI Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Mitigated Discharge</div>
                  <div className="text-sm font-bold font-mono text-blue-300">
                    {dispatchData.summary.total_dewatering_capacity_m3h.toLocaleString()} m³/h
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Population Shielded</div>
                  <div className="text-sm font-bold font-mono text-emerald-300">
                    ~{dispatchData.summary.total_population_protected.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Crew Deployed</div>
                  <div className="text-sm font-bold font-mono text-purple-300">
                    {dispatchData.summary.total_personnel_deployed} Officers
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Fuel Burn Rate</div>
                  <div className="text-sm font-bold font-mono text-amber-300">
                    {dispatchData.summary.total_fuel_lph.toFixed(0)} L/hour
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-3 bg-slate-900">
              <button
                onClick={() => setActiveSubTab("allocations")}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeSubTab === "allocations"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Sectoral Fleet Allocations ({dispatchData.allocations.length} Sectors)
              </button>

              <button
                onClick={() => setActiveSubTab("memorandum")}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeSubTab === "memorandum"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Official NDMA Disaster Directive Memorandum
              </button>
            </div>

            {/* Tab 1: Allocations Table */}
            {activeSubTab === "allocations" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {dispatchData.allocations.map((a, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          {a.dispatch_priority}
                        </span>
                        <h4 className="text-xs font-bold text-slate-100">
                          {a.zone_name} <span className="font-mono text-slate-400 font-normal">({a.grid_id})</span>
                        </h4>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {a.elevation_m}m AMSL
                        </span>
                      </div>

                      <div className="space-y-1 mt-2">
                        {a.assigned_assets.map((asset, aIdx) => (
                          <div key={aIdx} className="text-xs text-blue-300 flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            {asset}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Rate</div>
                        <div className="text-blue-300 font-bold">{a.dewatering_capacity_m3h} m³/h</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Personnel</div>
                        <div className="text-purple-300 font-bold">{a.personnel_deployed} Crew</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Shielded</div>
                        <div className="text-emerald-300 font-bold">~{a.estimated_population_shielded.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: NDMA Directive Document */}
            {activeSubTab === "memorandum" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-mono">
                    Format: National Disaster Management Authority (NDMA) Form D-4
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyMemo}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? "Copied!" : "Copy Text"}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </button>
                    <button
                      onClick={handleDownloadMemo}
                      className="px-2.5 py-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 transition-colors shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Directive
                    </button>
                  </div>
                </div>

                <pre className="flex-1 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
                  {dispatchData.ndma_memo_text}
                </pre>
              </div>
            )}

            {/* Modal Footer / Mobilization Trigger */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mobilizeSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Directive Transmitted to Municipal Wireless VHF Network & Field Depots!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Authorization requires Senior Municipal Disaster Officer credential.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleMobilize}
                  disabled={isMobilizing || mobilizeSuccess}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isMobilizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Broadcasting Directive...
                    </>
                  ) : mobilizeSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Fleet Mobilized
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="w-4 h-4" />
                      Authorize & Mobilize Response Fleet
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
