"use client";

import React, { useEffect, useState } from "react";
import { PriorityZoneItem } from "../types";
import { fetchPriorityZones } from "../lib/api";
import { 
  ListOrdered, 
  ArrowUpRight, 
  Wrench,
  Calculator
} from "lucide-react";

interface PriorityListProps {
  cityId: string;
  onSelectZone: (gridId: string) => void;
}

export const PriorityList: React.FC<PriorityListProps> = ({ cityId, onSelectZone }) => {
  const [zones, setZones] = useState<PriorityZoneItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchPriorityZones(cityId)
      .then((res) => setZones(res.zones))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [cityId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
              <ListOrdered className="w-4 h-4" />
              Municipal Resource Allocation Engine ({cityId})
            </div>
            <h2 className="text-xl font-bold text-slate-100">Algorithmic Response Prioritization</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Ranks municipal sectors by synthesizing ML waterlogging probability with urban building density, critical road networks, and historical flood recurrence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              Transparent Scoring Formula
            </span>
          </div>
        </div>

        {/* Mathematical formulation banner */}
        <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 flex flex-wrap items-center gap-2">
          <span className="text-blue-400 font-bold">Priority Score =</span>
          <span>(0.60 × Risk)</span> +
          <span>(0.20 × Building Impact)</span> +
          <span>(0.10 × Historical Severity)</span> +
          <span>(0.10 × Road Infrastructure)</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Zone & Ward</th>
                <th className="py-3.5 px-4">Risk Probability</th>
                <th className="py-3.5 px-4">Priority Score</th>
                <th className="py-3.5 px-4">Elevation</th>
                <th className="py-3.5 px-4">Threat Driver</th>
                <th className="py-3.5 px-4">Recommended Municipal Action</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {zones.map((z, idx) => (
                <tr key={z.grid_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-300">
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                      idx < 3 ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-slate-800 text-slate-400"
                    }`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100">{z.zone_name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{z.grid_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                      z.risk_level === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {z.risk_score}% [{z.risk_level}]
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-black text-amber-400 font-mono">{z.priority_score}</div>
                    <div className="text-[10px] text-slate-400">/ 100 Index</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-300">
                    {z.elevation_m} m AMSL
                  </td>
                  <td className="py-3 px-4 max-w-xs text-[11px] text-slate-300">
                    {z.reason}
                  </td>
                  <td className="py-3 px-4 max-w-xs text-[11px] text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{z.suggested_action}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectZone(z.grid_id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all inline-flex items-center"
                      title="Inspect Zone on Map"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
