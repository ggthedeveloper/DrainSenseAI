"use client";

import React, { useEffect, useState } from "react";
import { HistoricalEventItem } from "../types";
import { fetchHistoricalEvents } from "../lib/api";
import { 
  History, 
  Calendar, 
  CloudRain, 
  Users, 
  MapPin, 
  Building2
} from "lucide-react";

interface HistoricalEventsProps {
  cityId?: string;
}

export const HistoricalEvents: React.FC<HistoricalEventsProps> = ({ cityId }) => {
  const [events, setEvents] = useState<HistoricalEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCity, setFilterCity] = useState<string>(cityId || "ALL");

  useEffect(() => {
    if (cityId) setFilterCity(cityId);
  }, [cityId]);

  useEffect(() => {
    fetchHistoricalEvents()
      .then((data) => setEvents(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filterCity === "ALL") return true;
    return e.city_id.toUpperCase() === filterCity.toUpperCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              India Flood Inventory (IFI) Major Disaster Records
            </div>
            <h2 className="text-xl font-bold text-slate-100">Documented Historical Flood & Inundation Events</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Chronological flood case studies from Vijayawada (Budameru), Chennai (Michaung & 2015 Deluge), Mumbai (July 26 Cloudburst), and Bengaluru (Bellandur/EcoSpace).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter City:</span>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Indian Cities</option>
              <option value="VJA">Vijayawada / Amaravati (AP)</option>
              <option value="CHE">Chennai (TN)</option>
              <option value="BOM">Mumbai (MH)</option>
              <option value="BLR">Bengaluru (KA)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((evt) => (
          <div key={evt.event_id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {evt.city_name} ({evt.city_id})
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  evt.severity === "CRITICAL"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}>
                  {evt.severity}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-100 mt-1">{evt.title}</h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{evt.start_date} to {evt.end_date}</span>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {evt.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <CloudRain className="w-3 h-3 text-blue-400" /> Peak 24h Rain
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">{evt.peak_24h_rainfall_mm} mm</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Users className="w-3 h-3 text-amber-400" /> Impacted Pop.
                  </div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">{evt.affected_population_est.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Impacted Wards:</div>
                <div className="flex flex-wrap gap-1">
                  {evt.key_zones.map((kz, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {kz}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <strong className="text-slate-300">Deployment:</strong> {evt.response_summary}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
