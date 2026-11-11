"use client";

import React, { useState } from "react";
import { Database, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DataSourceItem {
  id: string;
  name: string;
  agency: string;
  category: "elevation" | "rainfall" | "hydrology" | "events" | "model";
  externalUrl: string;
  localPath: string;
  note: string;
}

const DATA_SOURCES: DataSourceItem[] = [
  {
    id: "vja-grid",
    name: "Vijayawada static grid",
    agency: "Local processed grid",
    category: "elevation",
    externalUrl: "https://github.com/ggthedeveloper/DrainSenseAI",
    localPath: "data/processed/vijayawada_grid_static_factors.csv",
    note: "1,100 data rows and a header. Columns include elevation_m, slope_deg, curve_number, and distance_to_water_m. This is the scored catchment.",
  },
  {
    id: "vja-terrain",
    name: "Vijayawada terrain features",
    agency: "Local terrain table",
    category: "elevation",
    externalUrl: "https://github.com/ggthedeveloper/DrainSenseAI",
    localPath: "data/terrain_features.csv",
    note: "1,100 data rows and a header. Same VJA250 grid ids, with elevation and slope summaries.",
  },
  {
    id: "cwc-rain",
    name: "CWC daily rainfall, Krishna",
    agency: "Central Water Commission",
    category: "rainfall",
    externalUrl: "https://indiawris.gov.in/wris/",
    localPath: "data/cwc_daily_rainfall_krishna_vja.csv",
    note: "2,738 data rows and a header. Station Keesara, Andhra Pradesh, manual daily rainfall in millimetres.",
  },
  {
    id: "cwc-stage",
    name: "CWC Krishna stage telemetry",
    agency: "Central Water Commission",
    category: "hydrology",
    externalUrl: "https://indiawris.gov.in/wris/",
    localPath: "data/cwc_krishna_river_telemetry_vja.csv",
    note: "65,776 data rows and a header. Keesara water level in metres. The file notes that a range flag is not station-specific validation.",
  },
  {
    id: "krishna-monthly",
    name: "Krishna monthly and annual summaries",
    agency: "Local Andhra Pradesh Krishna tables",
    category: "hydrology",
    externalUrl: "https://github.com/ggthedeveloper/DrainSenseAI",
    localPath: "data/andhra_pradesh_krishna_monthly_summary.csv",
    note: "Monthly file has 305 data rows. Annual file andhra_pradesh_krishna_annual_summary.csv has 31 data rows.",
  },
  {
    id: "events",
    name: "Historical flood events",
    agency: "Processed event catalog",
    category: "events",
    externalUrl: "https://github.com/ggthedeveloper/DrainSenseAI",
    localPath: "data/processed/historical_flood_events.json",
    note: "Four Vijayawada events. The console reads this catalog through the historical-events service.",
  },
  {
    id: "event-telemetry",
    name: "Vijayawada event telemetry",
    agency: "Local event table",
    category: "events",
    externalUrl: "https://github.com/ggthedeveloper/DrainSenseAI",
    localPath: "data/processed/vijayawada_event_telemetry.csv",
    note: "101 data rows and a header. Columns include rain_24h_mm and prakasam_stage_mean_m.",
  },
  {
    id: "training",
    name: "Training matrix",
    agency: "Local processed matrix",
    category: "model",
    externalUrl: "https://github.com/ggthedeveloper/DrainSenseAI",
    localPath: "data/processed/drainsense_v2_training_matrix.csv",
    note: "111,100 data rows and a header. Evaluation metrics live in frontend/public/data/evaluation.json (51,749 samples).",
  },
  {
    id: "indofloods",
    name: "IndoFloods catchment characteristics",
    agency: "Local catchment table",
    category: "hydrology",
    externalUrl: "https://github.com/ggthedeveloper/DrainSenseAI",
    localPath: "data/catchment_characteristics_indofloods.csv",
    note: "155 data rows and a header. Not a second scored city.",
  },
];

const FILTERS = [
  { id: "all", label: "All files" },
  { id: "elevation", label: "Elevation" },
  { id: "rainfall", label: "Rainfall" },
  { id: "hydrology", label: "River stage" },
  { id: "events", label: "Events" },
  { id: "model", label: "Model files" },
];

export const DataSources: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const filtered = activeFilter === "all" ? DATA_SOURCES : DATA_SOURCES.filter((s) => s.category === activeFilter);

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary" className="mb-3 gap-1.5">
          <Database className="h-3.5 w-3.5" />
          Files on disk
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight text-[#12262A]">Data on this machine</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4C5E62]">
          Each card names a file in the repository and the row count from that file. The scored city is Vijayawada. Counts for other cities are not listed because those grids are not loaded.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setActiveFilter(btn.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 ease-out ${
              activeFilter === btn.id
                ? "bg-[#115E59] text-white"
                : "border border-[#D5E2E0] bg-[#FBFDFC] text-[#4C5E62]"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((src) => (
          <Card key={src.id} className="flex flex-col gap-3 border-[#D5E2E0] bg-[#FBFDFC] p-5 shadow-none">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-[#12262A]">{src.name}</h3>
              <a
                href={src.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#115E59]"
              >
                Source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="text-xs text-[#4C5E62]">{src.agency}</p>
            <p className="text-sm leading-relaxed text-[#12262A]">{src.note}</p>
            <p className="font-mono text-xs text-[#115E59]">{src.localPath}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
