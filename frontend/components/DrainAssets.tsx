"use client";

import React, { useState, useEffect } from "react";
import { 
  Droplets, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ShieldAlert, 
  RefreshCw,
  Sliders,
  ExternalLink,
  MapPin
} from "lucide-react";
import { DrainAsset } from "../types";
import { fetchDrainAssets } from "../lib/api";
import { SupportedLanguage, getTranslation } from "../lib/i18n";

interface DrainAssetsProps {
  currentCityId?: string;
  currentLang: SupportedLanguage;
  onViewOnMap?: (lat: number, lon: number) => void;
}

export const DrainAssets: React.FC<DrainAssetsProps> = ({
  currentCityId,
  currentLang,
  onViewOnMap
}) => {
  const t = getTranslation(currentLang);
  const [assets, setAssets] = useState<DrainAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>(currentCityId || "ALL");
  const [selectedCondition, setSelectedCondition] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  useEffect(() => {
    loadAssets();
  }, [selectedCity]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const cid = selectedCity === "ALL" ? undefined : selectedCity;
      const data = await fetchDrainAssets(cid);
      setAssets(data.assets || []);
    } catch (err) {
      console.error("Failed to load assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location_desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assigned_team.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCondition = selectedCondition === "ALL" || asset.condition === selectedCondition;
    const matchesType = selectedType === "ALL" || asset.asset_type === selectedType;

    return matchesSearch && matchesCondition && matchesType;
  });

  const criticalSiltCount = assets.filter((a) => a.siltation_level_pct >= 60).length;
  const operationalCount = assets.filter((a) => a.operational_status === "OPERATIONAL").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
                  {t.assetsTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.assetsSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Assets</div>
              <div className="text-base font-extrabold text-slate-200 font-mono">{assets.length}</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-rose-950/30 border border-rose-900/40 text-center">
              <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Siltation &gt; 60%</div>
              <div className="text-base font-extrabold text-rose-300 font-mono">{criticalSiltCount}</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Operational</div>
              <div className="text-base font-extrabold text-emerald-300 font-mono">{operationalCount}</div>
            </div>
            <button
              onClick={loadAssets}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
              title={t.refresh}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchAssetsPlaceholder}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* City Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
            >
              <option value="ALL">{t.allCities}</option>
              <option value="VJA">Vijayawada (AP)</option>
              <option value="CHE">Chennai (TN)</option>
              <option value="BOM">Mumbai (MH)</option>
              <option value="BLR">Bengaluru (KA)</option>
              <option value="DEL">Delhi NCR (DL)</option>
              <option value="HYD">Hyderabad (TG)</option>
              <option value="CCU">Kolkata (WB)</option>
              <option value="AMD">Ahmedabad (GJ)</option>
              <option value="PNQ">Pune (MH)</option>
              <option value="COK">Kochi (KL)</option>
              <option value="GAU">Guwahati (AS)</option>
              <option value="PAT">Patna (BR)</option>
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
            >
              <option value="ALL">{t.allConditions}</option>
              <option value="CRITICAL">Critical Condition</option>
              <option value="DEGRADED">Degraded Condition</option>
              <option value="FAIR">Fair Condition</option>
              <option value="EXCELLENT">Excellent Condition</option>
            </select>
          </div>

          {/* Asset Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
            >
              <option value="ALL">All Asset Types</option>
              <option value="High-Capacity Storm Pump">High-Capacity Storm Pump</option>
              <option value="Box Culvert Outfall">Box Culvert Outfall</option>
              <option value="Arterial Storm Canal">Arterial Storm Canal</option>
              <option value="Tidal Flap Sluice Gate">Tidal Flap Sluice Gate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset List / Table */}
      <div className="bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span>{t.loading}</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {t.noData}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">{t.assetId}</th>
                  <th className="py-3.5 px-4">{t.assetName}</th>
                  <th className="py-3.5 px-4">{t.assetType}</th>
                  <th className="py-3.5 px-4">{t.capacity}</th>
                  <th className="py-3.5 px-4 min-w-[160px]">{t.siltation}</th>
                  <th className="py-3.5 px-4">{t.condition}</th>
                  <th className="py-3.5 px-4">{t.assignedTeam}</th>
                  <th className="py-3.5 px-4">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredAssets.map((asset) => {
                  const isCritSilt = asset.siltation_level_pct >= 60;
                  const isModSilt = asset.siltation_level_pct >= 30 && asset.siltation_level_pct < 60;

                  return (
                    <tr 
                      key={asset.asset_id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {asset.asset_id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200 group-hover:text-white">
                          {asset.asset_name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{asset.location_desc}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] border border-slate-700 font-medium">
                          {asset.asset_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {asset.capacity_discharge_m3s} <span className="text-[10px] text-slate-500">m³/s</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={isCritSilt ? "text-rose-400 font-bold" : isModSilt ? "text-amber-400 font-semibold" : "text-emerald-400"}>
                            {asset.siltation_level_pct}%
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {isCritSilt ? "Needs Desilting" : isModSilt ? "Moderate Silt" : "Clear Flow"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritSilt ? "bg-rose-500" : isModSilt ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                            style={{ width: `${Math.min(100, asset.siltation_level_pct)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          asset.condition === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : asset.condition === "DEGRADED"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : asset.condition === "FAIR"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}>
                          {asset.condition}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {asset.assigned_team}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          asset.operational_status === "OPERATIONAL"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40"
                            : asset.operational_status === "REDUCED_CAPACITY"
                            ? "bg-amber-950/40 text-amber-400 border border-amber-800/40"
                            : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            asset.operational_status === "OPERATIONAL" ? "bg-emerald-400" : "bg-amber-400"
                          }`} />
                          {asset.operational_status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
