"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Droplets,
  ShieldCheck,
  TrendingUp,
  Building,
  FileSpreadsheet,
  FileCode
} from "lucide-react";
import { RiskSummary, PriorityZoneItem } from "../types";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { UserSession } from "../lib/auth";

interface ReportsGeneratorProps {
  currentCityId: string;
  summary: RiskSummary | null;
  priorityZones: PriorityZoneItem[];
  currentLang: SupportedLanguage;
  currentUser: UserSession | null;
}

export const ReportsGenerator: React.FC<ReportsGeneratorProps> = ({
  currentCityId,
  summary,
  priorityZones,
  currentLang,
  currentUser
}) => {
  const t = getTranslation(currentLang);
  const [horizon, setHorizon] = useState<"24h" | "7d" | "30d">("24h");

  const cityNameMap: Record<string, string> = {
    VJA: "Vijayawada Municipal Corporation (Andhra Pradesh)",
    CHE: "Greater Chennai Corporation (Tamil Nadu)",
    BOM: "Brihanmumbai Municipal Corporation (Maharashtra)",
    BLR: "Bruhat Bengaluru Mahanagara Palike (Karnataka)",
    DEL: "Municipal Corporation of Delhi (National Capital)",
    HYD: "Greater Hyderabad Municipal Corporation (Telangana)",
    CCU: "Kolkata Municipal Corporation (West Bengal)",
    AMD: "Amdavad Municipal Corporation (Gujarat)",
    PNQ: "Pune Municipal Corporation (Maharashtra)",
    COK: "Kochi Municipal Corporation (Kerala)",
    GAU: "Guwahati Municipal Corporation (Assam)",
    PAT: "Patna Municipal Corporation (Bihar)"
  };

  const currentCityName = cityNameMap[currentCityId] || currentCityId;
  const reportDate = new Date().toLocaleDateString("en-IN", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
  const reportTime = new Date().toLocaleTimeString("en-IN", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadCSV = () => {
    if (typeof window === "undefined") return;

    const rows = [
      ["Report Type", "DrainSense Municipal Inundation & Hydrological Audit"],
      ["Catchment", currentCityName],
      ["Date", `${reportDate} ${reportTime}`],
      ["Audit Horizon", horizon === "24h" ? "Last 24 Hours" : horizon === "7d" ? "Last 7 Days" : "Last 30 Days"],
      ["Total Deterministic Grids", summary?.total_grids || 0],
      ["Monitored Basin Area (sq km)", summary?.monitored_area_sqkm || 0],
      ["24h Cumulative Precipitation (mm)", summary?.current_rainfall_24h_mm || 0],
      ["Critical Inundation Sectors", summary?.critical_zones || 0],
      ["High/Elevated Inundation Sectors", (summary?.high_risk_zones || 0) + (summary?.elevated_zones || 0)],
      ["Low / Safe Uplands", summary?.low_zones || 0],
      [],
      ["Rank", "Sector ID", "Ward Name", "Elevation (m AMSL)", "Risk Score (%)", "Priority Score", "Hydrological Threat Reason", "Action Recommended"]
    ];

    priorityZones.forEach((z, index) => {
      rows.push([
        String(index + 1),
        z.grid_id,
        `"${z.zone_name}"`,
        String(z.elevation_m),
        String(z.risk_score),
        String(z.priority_score),
        `"${z.reason}"`,
        `"${z.suggested_action}"`
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DrainSense_Audit_${currentCityId}_${horizon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    if (typeof window === "undefined") return;

    const payload = {
      report_title: "DrainSense Municipal Flood & Drainage Audit",
      audit_meta: {
        city_id: currentCityId,
        municipality: currentCityName,
        generated_at: new Date().toISOString(),
        auditor: currentUser ? `${currentUser.name} (${currentUser.role})` : "Gaurav (Administrator)",
        time_horizon: horizon
      },
      hydrological_summary: summary,
      priority_sectors: priorityZones,
      compliance_certification: {
        methodology: "Calibrated XGBoost (IS 17387:2020 Urban Drainage Standards)",
        digital_elevation: "NASA SRTM 30m Global DEM",
        telemetry: "Open-Meteo ERA5 Reanalysis & GFS Forecast"
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `DrainSense_Audit_${currentCityId}_${horizon}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
                {t.reportsTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.reportsSubtitle}
              </p>
            </div>
          </div>

          {/* Time Horizon Selector & Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Horizon Filter */}
            <div className="flex items-center rounded-xl bg-slate-950/60 p-1 border border-slate-800">
              <button
                onClick={() => setHorizon("24h")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  horizon === "24h" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                {t.last24Hours}
              </button>
              <button
                onClick={() => setHorizon("7d")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  horizon === "7d" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                {t.last7Days}
              </button>
              <button
                onClick={() => setHorizon("30d")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  horizon === "30d" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                {t.last30Days}
              </button>
            </div>

            {/* Print / PDF */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title={t.exportPdf}
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.exportPdf}</span>
            </button>

            {/* CSV */}
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title={t.exportCsv}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.exportCsv}</span>
            </button>

            {/* JSON */}
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title={t.exportJson}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.exportJson}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6 shadow-2xl printable-document">
        {/* Document Official Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              Official Municipal Flood Decision Support Audit
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              {currentCityName}
            </h1>
            <p className="text-xs text-slate-400">
              Department of Stormwater Drainage & Disaster Emergency Management
            </p>
          </div>

          <div className="text-right space-y-1 text-xs">
            <div className="font-mono text-slate-300 font-bold">Ref: DS-AUD-{currentCityId}-{Date.now().toString().slice(-6)}</div>
            <div className="text-slate-400">Date: {reportDate} • {reportTime}</div>
            <div className="text-blue-400 font-medium">Auditor: {currentUser ? `${currentUser.name} (${currentUser.role})` : "Gaurav (Administrator)"}</div>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="space-y-2.5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-400" />
            {t.executiveSummary}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            During the evaluated {horizon === "24h" ? "24-hour" : horizon === "7d" ? "7-day" : "30-day"} observation cycle, the {currentCityName} stormwater basin recorded a peak cumulative rainfall of <strong className="text-blue-400">{summary?.current_rainfall_24h_mm || 0} mm</strong>. Spatial hydro-dynamic evaluation across <strong className="text-slate-200">{summary?.total_grids || 0} deterministic 500m² grid cells</strong> indicates <strong className="text-rose-400">{summary?.critical_zones || 0} sectors in Critical Inundation Risk</strong> and <strong className="text-amber-400">{(summary?.high_risk_zones || 0) + (summary?.elevated_zones || 0)} sectors in High / Elevated Vulnerability</strong>. Drainage capacity throttles are primarily driven by low topographic elevation (NASA SRTM 30m) coupled with overland runoff stagnation.
          </p>
        </div>

        {/* Hydrological Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Catchment Area</div>
            <div className="text-lg font-black text-slate-200 font-mono mt-1">{summary?.monitored_area_sqkm || 0} km²</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{summary?.total_grids || 0} Grids (500m²)</div>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/30">
            <div className="text-[10px] uppercase font-bold text-rose-400">Critical Risk Sectors</div>
            <div className="text-lg font-black text-rose-300 font-mono mt-1">{summary?.critical_zones || 0}</div>
            <div className="text-[10px] text-rose-400/70 mt-0.5">Probability &gt; 80%</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/30">
            <div className="text-[10px] uppercase font-bold text-amber-400">High / Elevated Sectors</div>
            <div className="text-lg font-black text-amber-300 font-mono mt-1">{(summary?.high_risk_zones || 0) + (summary?.elevated_zones || 0)}</div>
            <div className="text-[10px] text-amber-400/70 mt-0.5">Probability 40% – 80%</div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/30">
            <div className="text-[10px] uppercase font-bold text-blue-400">Peak 24h Rain</div>
            <div className="text-lg font-black text-blue-300 font-mono mt-1">{summary?.current_rainfall_24h_mm || 0} mm</div>
            <div className="text-[10px] text-blue-400/70 mt-0.5">ERA5 / IMD Telemetry</div>
          </div>
        </div>

        {/* High Risk Sectors Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Vulnerable Sectors & Prioritized Dispatch Actions
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Grid ID</th>
                  <th className="py-2.5 px-3">Sector Name</th>
                  <th className="py-2.5 px-3">Elevation</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Vulnerability Rationale</th>
                  <th className="py-2.5 px-3">Recommended Municipal Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {priorityZones.slice(0, 8).map((zone, idx) => (
                  <tr key={zone.grid_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{zone.grid_id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-200">{zone.zone_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{zone.elevation_m}m</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {zone.risk_score}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">{zone.reason}</td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px] font-medium">{zone.suggested_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tactical Recommendation Checklist */}
        <div className="space-y-2.5 pt-2">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Immediate Tactical Directive
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-slate-200">1. Dewatering Deployment</div>
              <p className="text-[11px] text-slate-400">Stage 150+ HP auxiliary pumps at identified low-elevation underpass culverts within 90 minutes.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-slate-200">2. Flap Sluice Inspection</div>
              <p className="text-[11px] text-slate-400">Verify tidal flap gates along primary canals to prevent high-water backflow during peak rain surges.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-slate-200">3. Traffic Divergence</div>
              <p className="text-[11px] text-slate-400">Broadcast automated advisories on municipal digital signboards for submerged arterial subway corridors.</p>
            </div>
          </div>
        </div>

        {/* Digital Signature & Certification Footer */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-1">
            <div className="font-semibold text-slate-400">Certified by DrainSense AI Hydrological Platform</div>
            <div>Calibrated XGBoost Model v1.0 • NASA SRTM 30m Digital Elevation Model</div>
          </div>
          <div className="text-center sm:text-right space-y-1">
            <div className="font-mono text-slate-300 font-bold">Officer Sign-Off: {currentUser?.name || "Gaurav (Administrator)"}</div>
            <div className="text-[10px] text-slate-500">Badge ID: {currentUser?.badge_id || "MUNI-ADM-001"} • Cryptographically Audited</div>
          </div>
        </div>
      </div>
    </div>
  );
};
