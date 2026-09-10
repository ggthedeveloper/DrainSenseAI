"use client";

import React from "react";
import { 
  ShieldAlert, 
  Map as MapIcon, 
  SlidersHorizontal, 
  ListOrdered, 
  History, 
  LineChart, 
  Database, 
  Presentation,
  Activity,
  Building2,
  Menu
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
  activeTab,
  setActiveTab,
  onLaunchDemo,
  selectedCity,
  onSelectCity,
  healthStatus,
  onToggleMobileMenu
}) => {
  const [cityMenuOpen, setCityMenuOpen] = React.useState(false);

  const tabs = [
    { id: "map", label: "Risk Map", icon: MapIcon },
    { id: "copilot", label: "AI Copilot", icon: Activity },
    { id: "whatif", label: "What-If Simulator", icon: SlidersHorizontal },
    { id: "priority", label: "Priority Response", icon: ListOrdered },
    { id: "historical", label: "Historical Events", icon: History },
    { id: "analytics", label: "Model Analytics", icon: LineChart },
    { id: "health", label: "Data & Model", icon: Database }
  ];

  const currentCityObj = CITIES.find((c) => c.id === selectedCity) || CITIES[0];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & City Selector */}
          <div className="flex items-center gap-3 sm:gap-4">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Toggle Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-slate-950"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-100 tracking-tight">DrainSense</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold">
                  India AI
                </span>
              </div>

              {/* Custom Interactive City Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCityMenuOpen(!cityMenuOpen)}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-all group cursor-pointer mt-0.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold text-emerald-400 group-hover:text-emerald-300 underline decoration-dotted decoration-emerald-500/60 underline-offset-4">
                    {currentCityObj.name} ({currentCityObj.state})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">▼</span>
                </button>

                {cityMenuOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 rounded-xl shadow-2xl p-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setCityMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Select Monitored City (12 Cities)</span>
                      <span className="text-emerald-400 font-mono text-[10px]">● Live Data</span>
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
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-blue-400 font-bold">
                                  {c.state}
                                </span>
                                {c.name}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{c.river}</div>
                            </div>
                            {isSel && <span className="text-xs text-blue-400 font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/70 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 border border-blue-400/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs & Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-slate-400 font-mono">XGBoost {healthStatus.model_version}</span>
            </div>

            <button
              onClick={onLaunchDemo}
              className="group relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <Presentation className="w-3.5 h-3.5 text-slate-950" />
              <span>Jury Demo</span>
              <span className="ml-1 text-[9px] px-1 rounded bg-black/20 text-slate-950 font-mono">⌘D</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Row */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-800/80 gap-1.5 bg-slate-950">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
