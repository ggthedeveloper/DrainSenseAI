"use client";

import React, { useState } from "react";
import { 
  Building2,
  Menu,
  ChevronDown,
  Check,
  Compass,
  Radio,
  ExternalLink,
  Shield,
  Activity
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCity: string;
  onSelectCity: (cityId: string) => void;
  healthStatus: {
    status: string;
    model_version: string;
  };
  onToggleMobileMenu?: () => void;
  onOpenLanding?: () => void;
}

const CITIES = [
  { 
    id: "VJA", 
    name: "Vijayawada / Amaravati", 
    state: "AP", 
    river: "Krishna & Budameru Corridor",
    grids: "810 cells • 202.5 km²",
    dataset: "Copernicus 30m DEM • ERA5 513.7mm Deluge"
  },
  { 
    id: "CHE", 
    name: "Chennai", 
    state: "TN", 
    river: "Adyar, Cooum & Buckingham Canal",
    grids: "1,485 cells • 371.25 km²",
    dataset: "Copernicus 30m DEM • Michaung 434.8mm"
  },
  { 
    id: "BOM", 
    name: "Mumbai", 
    state: "MH", 
    river: "Mithi River & Mahim Creek Basin",
    grids: "1,768 cells • 442 km²",
    dataset: "Copernicus 30m DEM • July 2023 Deluge"
  },
  { 
    id: "BLR", 
    name: "Bengaluru", 
    state: "KA", 
    river: "Bellandur-Varthur & Vrishabhavathi Valley",
    grids: "1,764 cells • 441 km²",
    dataset: "Copernicus 30m DEM • Sept 2022 Cloudburst"
  }
];

export const Navbar: React.FC<NavbarProps> = ({
  selectedCity,
  onSelectCity,
  healthStatus,
  onToggleMobileMenu,
  onOpenLanding
}) => {
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const currentCityObj = CITIES.find((c) => c.id === selectedCity) || CITIES[0];

  return (
    <header className="border-b border-white/[0.08] bg-[#070d18]/90 backdrop-blur-xl sticky top-0 z-40 shadow-sm shadow-black/40">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Mobile Toggle & Active Basin Switcher */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Toggle Navigation Menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Monitored River Basin / City Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCityMenuOpen(!cityMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/[0.08] text-xs text-slate-200 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="text-left flex items-center gap-1.5">
                  <span className="font-semibold text-white tracking-tight">
                    {currentCityObj.name}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    {currentCityObj.state}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* City Selection Dropdown */}
              {cityMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-80 bg-[#0B1220] border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-[9999] backdrop-blur-2xl animate-in fade-in duration-100"
                  onMouseLeave={() => setCityMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Monitored River Basins</span>
                    <span className="text-emerald-400 font-mono text-[9px]">Verified Data</span>
                  </div>

                  <div className="p-1 space-y-1 mt-1">
                    {CITIES.map((c) => {
                      const isSel = c.id === selectedCity;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onSelectCity(c.id);
                            setCityMenuOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                            isSel
                              ? "bg-blue-600/20 border border-blue-500/40 text-white"
                              : "hover:bg-slate-800/80 text-slate-300 border border-transparent"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                              <span>{c.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">({c.grids})</span>
                            </div>
                            <div className="text-[10px] text-cyan-400 mt-0.5">{c.river}</div>
                          </div>
                          {isSel && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Basin Corridor Pill */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pl-2.5 border-l border-white/[0.08]">
              <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Corridor:</span>
              <span className="text-cyan-300 font-medium">{currentCityObj.river}</span>
            </div>
          </div>

          {/* Right: Operational Status, Telemetry & Overview */}
          <div className="flex items-center gap-2.5">
            {/* Live Model Health Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-white/[0.08] text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                Calibrated XGBoost • PIML Guardrail
              </span>
            </div>

            {/* Real Data Feed Tag */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-semibold">
              <span>Copernicus DEM &amp; ERA5 Telemetry</span>
            </div>

            {/* Return to Overview / Landing */}
            {onOpenLanding && (
              <button
                type="button"
                onClick={onOpenLanding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                title="Return to Public Overview"
              >
                <span>Overview</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
