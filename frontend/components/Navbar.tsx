"use client";

import React, { useState } from "react";
import { 
  Building2,
  Menu,
  Sparkles,
  Presentation,
  ChevronDown,
  Check,
  Compass
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLaunchDemo: () => void;
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
    dataset: "Copernicus 30m DEM • ERA5 513.7mm 2024 Deluge"
  },
  { 
    id: "CHE", 
    name: "Chennai", 
    state: "TN", 
    river: "Adyar, Cooum & Buckingham Canal",
    dataset: "Copernicus 30m DEM • Cyclone Michaung 434.8mm"
  }
];

export const Navbar: React.FC<NavbarProps> = ({
  onLaunchDemo,
  selectedCity,
  onSelectCity,
  healthStatus,
  onToggleMobileMenu,
  onOpenLanding
}) => {
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const currentCityObj = CITIES.find((c) => c.id === selectedCity) || CITIES[0];

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-all shadow-md shadow-black/40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Mobile Toggle & Active River Basin Selector */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-[0.96]"
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 text-xs text-slate-200 transition-all group cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-[0.98]"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="text-left">
                  <span className="font-semibold text-white tracking-tight">
                    {currentCityObj.name}
                  </span>
                  <span className="ml-1.5 font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    {currentCityObj.state}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
              </button>

              {/* City Selection Modal Dropdown */}
              {cityMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-[#0c1322] dark:bg-[#0c1322] border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/90 p-2.5 z-[9999] city-dropdown-menu animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  onMouseLeave={() => setCityMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Verified Real-Data Catchments (2 Cities)</span>
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Telemetry
                    </span>
                  </div>
                  <div className="space-y-1.5 p-1 pt-2">
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
                          className={`w-full text-left p-3 rounded-xl flex items-start justify-between transition-all cursor-pointer ${
                            isSel
                              ? "bg-blue-600/25 border border-blue-500/60 text-white shadow-md shadow-blue-500/10"
                              : "bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="text-xs font-bold flex items-center gap-2">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                                {c.state}
                              </span>
                              <span className="text-slate-100 font-bold">{c.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">{c.river}</div>
                            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <span>✓ {c.dataset}</span>
                            </div>
                          </div>
                          {isSel && <Check className="w-4 h-4 text-blue-400 shrink-0 mt-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Basin Corridor Subtitle Badge */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pl-2 border-l border-slate-800">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Corridor:</span>
              <span className="text-cyan-300 font-semibold">{currentCityObj.river}</span>
            </div>

            {/* Verified Real Data Badge */}
            {(selectedCity === "VJA" || selectedCity === "CHE") && (
              <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Copernicus DEM & ERA5 Real Data</span>
              </div>
            )}
          </div>

          {/* Right: Telemetry Badge, Overview Link, Jury Demo */}
          <div className="flex items-center gap-2.5">
            {/* Live Model Health Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-slate-300 font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-slate-300 font-mono">
                XGBoost {healthStatus.model_version.split(" ")[0]} • PIML Active
              </span>
            </div>

            {/* Return to Cinematic Landing Overview */}
            {onOpenLanding && (
              <button
                type="button"
                onClick={onOpenLanding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                title="Return to Landing Overview"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Overview</span>
              </button>
            )}

            {/* Jury Demo Guided Walkthrough Button */}
            <button
              onClick={onLaunchDemo}
              className="group relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Presentation className="w-3.5 h-3.5 text-slate-950" />
              <span>Jury Demo</span>
              <span className="hidden md:inline ml-1 text-[9px] px-1 rounded bg-black/20 text-slate-950 font-mono">⌘D</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
