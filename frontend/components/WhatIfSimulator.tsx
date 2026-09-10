"use client";

import React, { useState, useEffect } from "react";
import { SimulationResult } from "../types";
import { runSimulation } from "../lib/api";
import { 
  Sliders, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Sparkles,
  Info
} from "lucide-react";

interface WhatIfSimulatorProps {
  cityId: string;
  onApplyScenarioToMap?: (multiplier: number) => void;
}

const CITY_PRESETS: Record<string, Array<{ label: string; mult: number; rain: number; desc: string }>> = {
  VJA: [
    { label: "Nominal Baseline", mult: 1.0, rain: 145.0, desc: "Monsoon baseline (145mm)" },
    { label: "+25% Heavy Shower", mult: 1.25, rain: 181.2, desc: "Convective burst (+25%)" },
    { label: "+50% Krishna Depression", mult: 1.50, rain: 217.5, desc: "August 2019 depression analog" },
    { label: "+100% 2024 Budameru Surge", mult: 2.00, rain: 290.0, desc: "Historic September 2024 event" }
  ],
  CHE: [
    { label: "Monsoon Shower", mult: 1.0, rain: 120.0, desc: "NE Monsoon baseline (120mm)" },
    { label: "+35% Adyar Surge", mult: 1.35, rain: 162.0, desc: "Cooum/Adyar canal overflow" },
    { label: "+100% Cyclone Michaung", mult: 2.00, rain: 240.0, desc: "December 2023 Michaung analog" },
    { label: "+150% 2015 Deluge", mult: 2.50, rain: 300.0, desc: "Historic December 2015 cloudburst" }
  ],
  BOM: [
    { label: "High Tide Baseline", mult: 1.0, rain: 150.0, desc: "Standard monsoon rain + 4.2m tide" },
    { label: "+30% Mithi Swell", mult: 1.30, rain: 195.0, desc: "BKC & Kurla low-lying choking" },
    { label: "+60% Subway Inundation", mult: 1.60, rain: 240.0, desc: "Milan & Andheri subway flooding" },
    { label: "+120% 2005 Cloudburst", mult: 2.20, rain: 330.0, desc: "July 26 944mm cloudburst scale" }
  ],
  BLR: [
    { label: "Urban Baseline", mult: 1.0, rain: 60.0, desc: "Evening convective rain (60mm)" },
    { label: "+40% Tech Corridor Surge", mult: 1.40, rain: 84.0, desc: "Outer Ring Road Rajakaluve choke" },
    { label: "+80% EcoSpace Inundation", mult: 1.80, rain: 108.0, desc: "September 2022 tech park flood" },
    { label: "+120% Rainbow Drive Deluge", mult: 2.20, rain: 132.0, desc: "Sarjapur luxury villa breach" }
  ],
  DEL: [
    { label: "Monsoon Baseline", mult: 1.0, rain: 80.0, desc: "Standard monsoon rain (80mm)" },
    { label: "+40% Minto Bridge Inundation", mult: 1.40, rain: 112.0, desc: "Central Delhi subway waterlogging" },
    { label: "+80% Najafgarh Basin Swell", mult: 1.80, rain: 144.0, desc: "Arterial drain overflow" },
    { label: "+120% 2023 Yamuna Peak", mult: 2.20, rain: 176.0, desc: "Historic 208.66m flood analog" }
  ],
  HYD: [
    { label: "Deccan Baseline", mult: 1.0, rain: 75.0, desc: "Evening storm baseline (75mm)" },
    { label: "+50% Tolichowki Sump Flow", mult: 1.50, rain: 112.5, desc: "Nadeem colony waterlogging" },
    { label: "+100% Begumpet Nala Choke", mult: 2.00, rain: 150.0, desc: "Brahmanwadi breach" },
    { label: "+150% 2020 Cloudburst", mult: 2.50, rain: 187.5, desc: "October 2020 324mm event analog" }
  ],
  CCU: [
    { label: "Gangetic Baseline", mult: 1.0, rain: 90.0, desc: "Monsoon baseline (90mm)" },
    { label: "+40% Thanthania Choking", mult: 1.40, rain: 126.0, desc: "North Kolkata sump waterlogging" },
    { label: "+80% Behala Inundation", mult: 1.80, rain: 162.0, desc: "South Kolkata canal tailback" },
    { label: "+120% Cyclone Amphan Scale", mult: 2.20, rain: 198.0, desc: "May 2020 Hooghly surge analog" }
  ],
  AMD: [
    { label: "Semi-Arid Baseline", mult: 1.0, rain: 65.0, desc: "Monsoon rain baseline (65mm)" },
    { label: "+40% Underpass Closure", mult: 1.40, rain: 91.0, desc: "Akhbarnagar & Mithakhali sumps" },
    { label: "+80% Kharicut Canal Surge", mult: 1.80, rain: 117.0, desc: "Vatva & Isanpur industrial flood" },
    { label: "+130% July 2022 Cloudburst", mult: 2.30, rain: 149.5, desc: "220mm multi-underpass deluge" }
  ],
  PNQ: [
    { label: "Ghats Baseline", mult: 1.0, rain: 70.0, desc: "Deccan plateau baseline (70mm)" },
    { label: "+45% Deccan Gymkhana Surge", mult: 1.45, rain: 101.5, desc: "Pulachi Wadi riverfront submergence" },
    { label: "+90% Ambil Odha Overflow", mult: 1.90, rain: 133.0, desc: "Sinhagad Road residential breach" },
    { label: "+140% September 2019 Deluge", mult: 2.40, rain: 168.0, desc: "Historic 212mm flash cloudburst" }
  ],
  COK: [
    { label: "Coastal Baseline", mult: 1.0, rain: 110.0, desc: "SW Monsoon baseline (110mm)" },
    { label: "+35% Kaloor Stadium Sump", mult: 1.35, rain: 148.5, desc: "Edappally canal tailback" },
    { label: "+75% High Tide Backflow", mult: 1.75, rain: 192.5, desc: "Vembanad lake barrier overflow" },
    { label: "+120% 2018 Century Flood", mult: 2.20, rain: 242.0, desc: "Historic Periyar 310mm deluge" }
  ],
  GAU: [
    { label: "Brahmaputra Baseline", mult: 1.0, rain: 85.0, desc: "Pre-monsoon shower (85mm)" },
    { label: "+40% Anil Nagar Lake-State", mult: 1.40, rain: 119.0, desc: "Bharalu river sluice lockup" },
    { label: "+80% Zoo Road Flash Flood", mult: 1.80, rain: 153.0, desc: "Rukminigaon lowland basin" },
    { label: "+120% June 2022 Surge", mult: 2.20, rain: 187.0, desc: "Historic Bharalu urban submergence" }
  ],
  PAT: [
    { label: "Ganga Plains Baseline", mult: 1.0, rain: 80.0, desc: "Gangetic monsoon rain (80mm)" },
    { label: "+45% Kankarbagh Drainage Choke", mult: 1.45, rain: 116.0, desc: "Outfall sump pump overload" },
    { label: "+85% Ganga Sluice Backflow", mult: 1.85, rain: 148.0, desc: "Punpun river flood alert" },
    { label: "+140% 2019 Rajendra Nagar Sump", mult: 2.40, rain: 192.0, desc: "Historic 245mm deluge scale" }
  ]
};

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ cityId, onApplyScenarioToMap }) => {
  const [multiplier, setMultiplier] = useState<number>(1.25);
  const [baseRainfall, setBaseRainfall] = useState<number>(145.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const presets = CITY_PRESETS[cityId] || CITY_PRESETS["VJA"];

  const handleSimulate = async (mult: number = multiplier) => {
    setLoading(true);
    try {
      const res = await runSimulation(cityId, mult, baseRainfall);
      setResult(res);
      if (onApplyScenarioToMap) {
        onApplyScenarioToMap(mult);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const defaultBase = presets[0]?.rain || 145.0;
    setBaseRainfall(defaultBase);
    handleSimulate(1.25);
  }, [cityId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Sliders className="w-4 h-4" />
              Hydrological What-If Scenario Modeler ({cityId})
            </div>
            <h2 className="text-xl font-bold text-slate-100">Simulate Storm Precipitation Escalation</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Project how spatial waterlogging susceptibility expands across urban cells when storm precipitation surges above baseline levels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
              City: {cityId}
            </span>
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setMultiplier(p.mult);
                handleSimulate(p.mult);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                multiplier === p.mult
                  ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-md"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <div className="text-xs font-bold text-slate-100">{p.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
              <div className="text-xs font-mono font-semibold text-blue-400 mt-2">
                {Math.round(baseRainfall * p.mult)} mm
              </div>
            </button>
          ))}
        </div>

        {/* Custom Slider */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs font-medium mb-2">
            <span className="text-slate-300">Rainfall Multiplier:</span>
            <span className="text-sm font-bold text-amber-400">
              +{Math.round((multiplier - 1.0) * 100)}% ({Math.round(baseRainfall * multiplier)} mm / 24h)
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.5"
            step="0.05"
            value={multiplier}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setMultiplier(val);
              handleSimulate(val);
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Baseline (1.0x)</span>
            <span>+50% (1.5x)</span>
            <span>+100% (2.0x)</span>
            <span>+150% (2.5x)</span>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-rose-900/40 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-300 font-semibold uppercase tracking-wider">Critical Risk Delta</span>
                <TrendingUp className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-200 mt-2">
                +{result.impact_deltas.new_critical_zones} Zones
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                From {result.baseline_summary.critical_zones} to {result.scenario_summary.critical_zones} critical cells
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-amber-900/40 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Newly Escalated Grids</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-200 mt-2">
                {result.impact_deltas.total_newly_escalated_zones} Cells
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {(result.impact_deltas.total_newly_escalated_zones * 0.25).toFixed(1)} km² newly at high/critical risk
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-blue-900/40 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-300 font-semibold uppercase tracking-wider">Scenario Peak Rainfall</span>
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-200 mt-2">
                {result.simulation_scenario.scenario_rainfall_24h_mm} mm
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Baseline was {result.simulation_scenario.baseline_rainfall_24h_mm} mm
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-3">
              <Layers className="w-4 h-4 text-blue-400" />
              Sectors Breaching Inundation Threshold Under Scenario ({cityId})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {result.impact_deltas.newly_escalated_grid_ids.map((gid, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-blue-400 font-bold">{gid}</span>
                    <div className="text-xs font-medium text-slate-200 mt-0.5">Low-Lying Waterway Basin</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold">
                    BREACH
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{result.scientific_note}</span>
          </div>
        </div>
      )}
    </div>
  );
};
