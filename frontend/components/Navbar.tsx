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
  { id: "VJA", name: "Vijayawada / Amaravati", state: "AP", river: "Krishna / Budameru" },
  { id: "CHE", name: "Chennai", state: "TN", river: "Adyar / Cooum / Buckingham" },
  { id: "BOM", name: "Mumbai", state: "MH", river: "Mithi River / Subways" },
  { id: "BLR", name: "Bengaluru", state: "KA", river: "Bellandur / Varthur Valley" },
  { id: "DEL", name: "Delhi NCR", state: "DL", river: "Yamuna / Najafgarh Drain" },
  { id: "HYD", name: "Hyderabad", state: "TG", river: "Musi River / Hussain Sagar" },
  { id: "CCU", name: "Kolkata", state: "WB", river: "Hooghly / Circular Canal" },
  { id: "AMD", name: "Ahmedabad", state: "GJ", river: "Sabarmati / Kharicut Canal" },
  { id: "PNQ", name: "Pune", state: "MH", river: "Mula-Mutha / Ambil Odha" },
  { id: "COK", name: "Kochi", state: "KL", river: "Periyar / Vembanad Lake" },
  { id: "GAU", name: "Guwahati", state: "AS", river: "Brahmaputra / Bharalu" },
  { id: "PAT", name: "Patna", state: "BR", river: "Ganga / Punpun River" }
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
    <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 transition-all shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Mobile Toggle & Active River Basin Selector */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 text-xs text-slate-200 transition-all group cursor-pointer shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="text-left">
                  <span className="font-semibold text-white tracking-tight">
                    {currentCityObj.name}
                  </span>
                  <span className="ml-1.5 font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                    {currentCityObj.state}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
              </button>

              {/* City Selection Modal Dropdown */}
              {cityMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 rounded-xl shadow-2xl p-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setCityMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Monitored River Basins (12 Cities)</span>
                    <span className="text-emerald-400 font-mono text-[10px]">● Live Telemetry</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-1 p-1">
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
                          className={`w-full text-left p-2 rounded-lg flex items-start justify-between transition-all ${
                            isSel
                              ? "bg-blue-600/20 border border-blue-500/40 text-blue-200"
                              : "hover:bg-slate-800/70 text-slate-300 hover:text-white border border-transparent"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-1.5">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 font-bold">
                                {c.state}
                              </span>
                              {c.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{c.river}</div>
                          </div>
                          {isSel && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
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
