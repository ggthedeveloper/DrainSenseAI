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
  Sparkles
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-md">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Monitored Area</div>
              <div className="text-lg font-black text-slate-100 mt-0.5 font-mono">{summary.monitored_area_sqkm} km²</div>
              <div className="text-[10px] text-slate-400">{summary.total_grids} Grids (500m²)</div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-rose-900/50 shadow-md">
              <div className="text-[10px] text-rose-400 uppercase font-semibold">Critical Risk</div>
              <div className="text-lg font-black text-rose-300 mt-0.5 font-mono">{summary.critical_zones} Zones</div>
              <div className="text-[10px] text-slate-400">Score &gt; 80%</div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-900/50 shadow-md">
              <div className="text-[10px] text-amber-400 uppercase font-semibold">Elevated / High</div>
              <div className="text-lg font-black text-amber-300 mt-0.5 font-mono">{summary.high_risk_zones + summary.elevated_zones} Zones</div>
              <div className="text-[10px] text-slate-400">Score 40% - 80%</div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-900/50 shadow-md">
              <div className="text-[10px] text-emerald-400 uppercase font-semibold">Low / Safe</div>
              <div className="text-lg font-black text-emerald-300 mt-0.5 font-mono">{summary.low_zones} Zones</div>
              <div className="text-[10px] text-slate-400">High ground / ridges</div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-md">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Current 24h Rain</div>
              <div className="text-lg font-black text-blue-400 mt-0.5 font-mono">{summary.current_rainfall_24h_mm} mm</div>
              <div className="text-[10px] text-slate-400">{currentMeta.rainRegion}</div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-md">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Peak Threat Sector</div>
              <div className="text-xs font-bold text-slate-200 mt-1 truncate">{currentMeta.threatSector}</div>
              <div className="text-[10px] text-rose-400 font-medium truncate">{currentMeta.breachCorridor}</div>
            </div>
          </div>
        )}

        {/* Tab Switching Body */}
        {activeTab === "map" && (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 h-[650px]">
              {/* Left Map View */}
              <div className="flex-1 h-full">
                <RiskMap
                  cityId={selectedCity}
                  mapData={mapData}
                  onSelectGrid={handleSelectGrid}
                  selectedGridId={selectedGridId}
                />
              </div>

              {/* Right Side Quick Inspector (When no full drawer is opened) */}
              {!zoneDetail && (
                <div className="hidden lg:flex w-80 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase">
                      <Sparkles className="w-4 h-4" />
                      Interactive Inspector ({selectedCity})
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 mt-1">Select Any 500m Grid Cell</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Click any colored polygon on the map to inspect its terrain elevation, flow accumulation, antecedent rainfall, TreeSHAP explainability attributions, and suggested municipal response.
                    </p>

                    <div className="mt-5 space-y-2">
                      <div className="text-xs font-semibold text-slate-300">Quick Case Study Highlights:</div>
                      <button
                        onClick={() => handleSelectGrid(currentMeta.sampleCritical)}
                        className="w-full text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                      >
                        <div className="text-xs font-bold text-slate-200">{currentMeta.threatSector}</div>
                        <div className="text-[10px] text-rose-400 mt-0.5">High Waterlogging Risk Sector</div>
                      </button>
                      <button
                        onClick={() => handleSelectGrid(currentMeta.sampleLow)}
                        className="w-full text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                      >
                        <div className="text-xs font-bold text-slate-200">High Elevation Ridge Sector</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">Low Risk • Uplands / Ridges</div>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong>Scientific Note:</strong> Estimates zone-level waterlogging susceptibility. Decision support only.
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
