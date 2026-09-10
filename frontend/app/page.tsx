"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { RiskMap } from "../components/RiskMap";
import { ZoneDrawer } from "../components/ZoneDrawer";
import { WhatIfSimulator } from "../components/WhatIfSimulator";
import { PriorityList } from "../components/PriorityList";
import { HistoricalEvents } from "../components/HistoricalEvents";
import { ModelAnalytics } from "../components/ModelAnalytics";
import { DataHealth } from "../components/DataHealth";
import { JuryDemoModal } from "../components/JuryDemoModal";
import { AICopilot } from "../components/AICopilot";

import { RiskMapGeoJSON, RiskSummary, ZoneDetail } from "../types";
import { fetchCurrentRiskMap, fetchZoneDetail, fetchHealthStatus } from "../lib/api";

import { 
  ShieldAlert, 
  MapPin, 
  CloudRain, 
  Layers, 
  AlertTriangle, 
  Activity, 
  Calendar,
  Sparkles,
  SlidersHorizontal
} from "lucide-react";

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState<string>("VJA");
  const [activeTab, setActiveTab] = useState<string>("map");
  const [mapData, setMapData] = useState<RiskMapGeoJSON | null>(null);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<{ status: string; model_version: string }>({
    status: "HEALTHY",
    model_version: "v1.0 (Calibrated XGBoost)"
  });

  // Load risk map whenever selectedCity changes
  useEffect(() => {
    fetchCurrentRiskMap(selectedCity)
      .then((res) => {
        setMapData(res.geojson);
        setSummary(res.summary);
      })
      .catch((err) => console.error("Error loading map:", err));
  }, [selectedCity]);

  // Load initial health status once
  useEffect(() => {
    fetchHealthStatus()
      .then((h) => {
        if (h) {
          setHealthStatus({
            status: h.status,
            model_version: h.model_version || "v1.0"
          });
        }
      })
      .catch((err) => console.error("Health fetch error:", err));
  }, []);

  // When a grid is clicked, fetch its zone detail
  const handleSelectGrid = async (gridId: string) => {
    setSelectedGridId(gridId);
    try {
      const detail = await fetchZoneDetail(gridId, summary?.current_rainfall_24h_mm || 145.0);
      setZoneDetail(detail);
    } catch (e) {
      console.error("Error loading zone detail:", e);
    }
  };

  const cityIdToName = (cid: string) => {
    const map: Record<string, string> = {
      VJA: "Vijayawada / Amaravati (AP)",
      CHE: "Chennai (TN)",
      BOM: "Mumbai (MH)",
      BLR: "Bengaluru (KA)",
      DEL: "Delhi NCR (DL)",
      HYD: "Hyderabad (TG)",
      CCU: "Kolkata (WB)",
      AMD: "Ahmedabad (GJ)",
      PNQ: "Pune (MH)",
      COK: "Kochi (KL)",
      GAU: "Guwahati (AS)",
      PAT: "Patna (BR)"
    };
    return map[cid] || cid;
  };

  const cityCatchmentLabels: Record<string, { rainRegion: string; threatSector: string; breachCorridor: string; sampleCritical: string; sampleLow: string }> = {
    VJA: {
      rainRegion: "Prakasam Catchment",
      threatSector: "Ajit Singh Nagar",
      breachCorridor: "Budameru Inundation Corridor",
      sampleCritical: "VJA_0036",
      sampleLow: "VJA_0001"
    },
    CHE: {
      rainRegion: "Adyar/Cooum Basin",
      threatSector: "Velachery & Kotturpuram",
      breachCorridor: "Adyar River Overflow Corridor",
      sampleCritical: "CHE_0110",
      sampleLow: "CHE_0001"
    },
    BOM: {
      rainRegion: "Mithi River Catchment",
      threatSector: "Kurla & Milan Subway",
      breachCorridor: "BKC/Mithi Lowland Sump",
      sampleCritical: "BOM_0120",
      sampleLow: "BOM_0001"
    },
    BLR: {
      rainRegion: "Bellandur Valley Basin",
      threatSector: "Rainbow Drive & EcoSpace",
      breachCorridor: "Outer Ring Road Rajakaluve",
      sampleCritical: "BLR_0140",
      sampleLow: "BLR_0001"
    },
    DEL: {
      rainRegion: "Yamuna Floodplain Catchment",
      threatSector: "Yamuna Bazar & ITO Ring Road",
      breachCorridor: "Najafgarh Drain Outfall",
      sampleCritical: "DEL_0050",
      sampleLow: "DEL_0001"
    },
    HYD: {
      rainRegion: "Musi River & Hussain Sagar",
      threatSector: "Moosarambagh & Begumpet Nala",
      breachCorridor: "Tolichowki / Nadeem Colony Sump",
      sampleCritical: "HYD_0045",
      sampleLow: "HYD_0001"
    },
    CCU: {
      rainRegion: "Hooghly Tidal Basin",
      threatSector: "Thanthania & Behala",
      breachCorridor: "Circular Canal Outfall",
      sampleCritical: "CCU_0035",
      sampleLow: "CCU_0001"
    },
    AMD: {
      rainRegion: "Sabarmati Riverfront Catchment",
      threatSector: "Akhbarnagar Underpass & Vatva",
      breachCorridor: "Kharicut Canal Tailback",
      sampleCritical: "AMD_0040",
      sampleLow: "AMD_0001"
    },
    PNQ: {
      rainRegion: "Mula-Mutha Basin",
      threatSector: "Ambil Odha & Sinhagad Road",
      breachCorridor: "Pulachi Wadi Riverfront Sump",
      sampleCritical: "PNQ_0030",
      sampleLow: "PNQ_0001"
    },
    COK: {
      rainRegion: "Periyar & Vembanad Estuary",
      threatSector: "Kaloor Stadium Sump & Aluva",
      breachCorridor: "Edappally Canal Choke",
      sampleCritical: "COK_0025",
      sampleLow: "COK_0001"
    },
    GAU: {
      rainRegion: "Brahmaputra Valley Basin",
      threatSector: "Anil Nagar & Bharalu Rivulet",
      breachCorridor: "Deepor Beel Catchment",
      sampleCritical: "GAU_0020",
      sampleLow: "GAU_0001"
    },
    PAT: {
      rainRegion: "Ganga & Punpun Confluence",
      threatSector: "Rajendra Nagar & Kankarbagh",
      breachCorridor: "Badshahi Nala Sump",
      sampleCritical: "PAT_0030",
      sampleLow: "PAT_0001"
    }
  };

  const currentMeta = cityCatchmentLabels[selectedCity] || cityCatchmentLabels["VJA"];

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCity={selectedCity}
        onSelectCity={(cityId) => {
          setSelectedCity(cityId);
          setSelectedGridId(null);
          setZoneDetail(null);
        }}
        onLaunchDemo={() => setIsDemoModalOpen(true)}
        healthStatus={healthStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Overview Banner */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="group relative overflow-hidden bg-slate-900/70 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg hover:shadow-blue-500/5">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500/80 to-blue-400"></div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Monitored Area</div>
              <div className="text-xl font-extrabold text-slate-100 mt-1 font-mono tracking-tight">{summary.monitored_area_sqkm} <span className="text-xs text-slate-400 font-sans font-normal">km²</span></div>
              <div className="text-[10px] text-blue-400 font-medium mt-1 flex items-center gap-1">
                <span>{summary.total_grids.toLocaleString()}</span> Grids (500m²)
              </div>
            </div>

            <div className="group relative overflow-hidden bg-slate-900/70 backdrop-blur-md p-3.5 rounded-xl border border-rose-900/40 hover:border-rose-700/60 transition-all shadow-lg hover:shadow-rose-500/5">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-rose-600 to-rose-400"></div>
              <div className="text-[10px] text-rose-400 uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Critical Risk</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              </div>
              <div className="text-xl font-extrabold text-rose-300 mt-1 font-mono tracking-tight">{summary.critical_zones} <span className="text-xs text-rose-400/80 font-sans font-normal">Zones</span></div>
              <div className="text-[10px] text-rose-400/80 font-medium mt-1">Probability &gt; 80%</div>
            </div>

            <div className="group relative overflow-hidden bg-slate-900/70 backdrop-blur-md p-3.5 rounded-xl border border-amber-900/40 hover:border-amber-700/60 transition-all shadow-lg hover:shadow-amber-500/5">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400"></div>
              <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Elevated / High</div>
              <div className="text-xl font-extrabold text-amber-300 mt-1 font-mono tracking-tight">{summary.high_risk_zones + summary.elevated_zones} <span className="text-xs text-amber-400/80 font-sans font-normal">Zones</span></div>
              <div className="text-[10px] text-amber-400/80 font-medium mt-1">Probability 40% – 80%</div>
            </div>

            <div className="group relative overflow-hidden bg-slate-900/70 backdrop-blur-md p-3.5 rounded-xl border border-emerald-900/40 hover:border-emerald-700/60 transition-all shadow-lg hover:shadow-emerald-500/5">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
              <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Low / Safe Ground</div>
              <div className="text-xl font-extrabold text-emerald-300 mt-1 font-mono tracking-tight">{summary.low_zones} <span className="text-xs text-emerald-400/80 font-sans font-normal">Zones</span></div>
              <div className="text-[10px] text-emerald-400/80 font-medium mt-1">Ridges & Uplands</div>
            </div>

            <div className="group relative overflow-hidden bg-slate-900/70 backdrop-blur-md p-3.5 rounded-xl border border-blue-900/40 hover:border-blue-700/60 transition-all shadow-lg hover:shadow-blue-500/5">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Current 24h Rain</div>
              <div className="text-xl font-extrabold text-blue-300 mt-1 font-mono tracking-tight">{summary.current_rainfall_24h_mm} <span className="text-xs text-blue-400/80 font-sans font-normal">mm</span></div>
              <div className="text-[10px] text-slate-400 font-medium mt-1 truncate">{currentMeta.rainRegion}</div>
            </div>

            <div className="group relative overflow-hidden bg-slate-900/70 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Peak Threat Sector</div>
              <div className="text-sm font-bold text-slate-200 mt-1 truncate tracking-tight">{currentMeta.threatSector}</div>
              <div className="text-[10px] text-rose-400 font-semibold mt-1 truncate">{currentMeta.breachCorridor}</div>
            </div>
          </div>
        )}

        {/* Tab Switching Body */}
        {activeTab === "map" && (
          <div className="space-y-3.5">
            {/* Map Mission Sub-Bar */}
            <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-slate-200">
                  {currentMeta.rainRegion}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono">
                  {summary?.total_grids || 0} Deterministic Grids (500m × 500m)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("whatif")}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test +25% Surge</span>
                </button>
                <button
                  onClick={() => setActiveTab("copilot")}
                  className="px-2.5 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-100 transition-all text-xs flex items-center gap-1.5 cursor-pointer border border-blue-500/40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>AI Copilot Brief</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 h-[650px]">
              {/* Left Map View */}
              <div className="flex-1 h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
                <RiskMap
                  cityId={selectedCity}
                  mapData={mapData}
                  onSelectGrid={handleSelectGrid}
                  selectedGridId={selectedGridId}
                />
              </div>

              {/* Right Side Quick Inspector (When no full drawer is opened) */}
              {!zoneDetail && (
                <div className="hidden lg:flex w-84 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      Spatial Grid Inspector
                    </div>
                    <h3 className="text-base font-extrabold text-slate-100 mt-1 tracking-tight">
                      {cityIdToName(selectedCity)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Click any 500m colored grid polygon on the map to inspect its terrain elevation (NASA SRTM), runoff flow index, antecedence rainfall, and TreeSHAP risk factors.
                    </p>

                    {/* Quick Comparative Case Studies */}
                    <div className="mt-5 space-y-2.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Comparative Benchmarks:
                      </div>

                      <button
                        onClick={() => handleSelectGrid(currentMeta.sampleCritical)}
                        className="w-full text-left p-3 rounded-xl bg-slate-950/80 border border-rose-900/40 hover:border-rose-600/70 hover:bg-slate-900/80 transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                            {currentMeta.threatSector}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                            CRITICAL
                          </span>
                        </div>
                        <div className="text-[11px] text-rose-400/90 mt-1 flex items-center justify-between font-medium">
                          <span>Lowland Floodplain Sump</span>
                          <span className="text-slate-500 font-mono">18m AMSL</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSelectGrid(currentMeta.sampleLow)}
                        className="w-full text-left p-3 rounded-xl bg-slate-950/80 border border-emerald-900/40 hover:border-emerald-600/70 hover:bg-slate-900/80 transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                            High Elevation Ridge
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                            LOW RISK
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center justify-between font-medium">
                          <span>Natural Drainage Escarpment</span>
                          <span className="text-slate-500 font-mono">110m AMSL</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => setActiveTab("copilot")}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask AI Flood Copilot</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-2.5 leading-relaxed">
                      💡 Estimates zone-level waterlogging susceptibility. Decision support only.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "copilot" && (
          <AICopilot
            cityId={selectedCity}
            currentRainfall24h={summary?.current_rainfall_24h_mm || 145.0}
          />
        )}

        {activeTab === "whatif" && (
          <WhatIfSimulator
            cityId={selectedCity}
            onApplyScenarioToMap={(mult) => {
              if (summary) {
                fetchCurrentRiskMap(selectedCity, Math.round(summary.current_rainfall_24h_mm * mult))
                  .then((res) => setMapData(res.geojson));
              }
            }}
          />
        )}

        {activeTab === "priority" && (
          <PriorityList
            cityId={selectedCity}
            onSelectZone={(gid) => {
              setActiveTab("map");
              handleSelectGrid(gid);
            }}
          />
        )}

        {activeTab === "historical" && <HistoricalEvents cityId={selectedCity} />}

        {activeTab === "analytics" && <ModelAnalytics />}

        {activeTab === "health" && <DataHealth />}
      </main>

      {/* Zone Detail Sliding Drawer */}
      <ZoneDrawer
        zone={zoneDetail}
        onClose={() => {
          setZoneDetail(null);
          setSelectedGridId(null);
        }}
      />

      {/* Jury Demo Guided Walkthrough Modal */}
      <JuryDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        setActiveTab={setActiveTab}
        onSelectGrid={handleSelectGrid}
      />
    </div>
  );
}
