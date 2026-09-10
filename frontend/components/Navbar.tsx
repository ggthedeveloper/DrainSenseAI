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
  Building2
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
  healthStatus
}) => {
  const tabs = [
    { id: "map", label: "Risk Map", icon: MapIcon },
    { id: "copilot", label: "AI Copilot", icon: Activity },
    { id: "whatif", label: "What-If Simulator", icon: SlidersHorizontal },
    { id: "priority", label: "Priority Response", icon: ListOrdered },
    { id: "historical", label: "Historical Events", icon: History },
    { id: "analytics", label: "Model Analytics", icon: LineChart },
    { id: "health", label: "Data & Model", icon: Database }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & City Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shadow-lg shadow-blue-500/10">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">DrainSense</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium">India</span>
              </div>
              {/* Interactive City Selector Dropdown */}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Building2 className="w-3 h-3 text-slate-500" />
                <select
                  value={selectedCity}
                  onChange={(e) => onSelectCity(e.target.value)}
                  className="bg-transparent text-emerald-400 font-medium border-b border-dashed border-emerald-500/40 hover:border-emerald-400 focus:outline-none cursor-pointer py-0.5"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                      {c.name} ({c.state})
                    </option>
                  ))}
                </select>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1"></span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
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
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>{healthStatus.model_version}</span>
            </div>

            <button
              onClick={onLaunchDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-semibold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Jury Demo Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Row */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-800/60 gap-1 bg-slate-950">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
