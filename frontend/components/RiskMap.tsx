"use client";

import React, { useEffect, useRef, useState } from "react";
import { RiskMapGeoJSON, GridProperties } from "../types";
import { Layers, Droplets, MapPin, Satellite, Map as MapIcon, Moon } from "lucide-react";

interface RiskMapProps {
  cityId: string;
  mapData: RiskMapGeoJSON | null;
  onSelectGrid: (gridId: string) => void;
  selectedGridId?: string | null;
}

const CITY_LANDMARKS: Record<string, { center: [number, number]; zoom: number; landmarks: Array<{ lat: number; lon: number; title: string; color: string }> }> = {
  VJA: {
    center: [16.512, 80.635],
    zoom: 12,
    landmarks: [
      { lat: 16.5075, lon: 80.6056, title: "Prakasam Barrage (Krishna River)", color: "#3b82f6" },
      { lat: 16.5520, lon: 80.6300, title: "Budameru Inundation Corridor", color: "#06b6d4" },
      { lat: 16.5140, lon: 80.6080, title: "Indrakeeladri (Temple Ridge - 110m)", color: "#a855f7" }
    ]
  },
  CHE: {
    center: [13.040, 80.220],
    zoom: 11,
    landmarks: [
      { lat: 13.008, lon: 80.250, title: "Adyar River Mouth (Saidapet/Kotturpuram)", color: "#3b82f6" },
      { lat: 13.070, lon: 80.250, title: "Cooum River Basin", color: "#06b6d4" },
      { lat: 12.940, lon: 80.210, title: "Pallikaranai Marshland Reserve", color: "#10b981" },
      { lat: 12.980, lon: 80.220, title: "Velachery Lowland Sump", color: "#f43f5e" }
    ]
  },
  BOM: {
    center: [19.076, 72.877],
    zoom: 11,
    landmarks: [
      { lat: 19.065, lon: 72.865, title: "Mithi River & BKC Discharge", color: "#3b82f6" },
      { lat: 19.015, lon: 80.220, title: "Hindmata Chronic Waterlogging Sump", color: "#f43f5e" },
      { lat: 19.080, lon: 72.840, title: "Milan Subway", color: "#eab308" },
      { lat: 18.960, lon: 72.805, title: "Malabar Hill (South Mumbai Ridge)", color: "#a855f7" }
    ]
  },
  BLR: {
    center: [12.9716, 77.620],
    zoom: 11,
    landmarks: [
      { lat: 12.935, lon: 77.675, title: "Bellandur Lake & EcoSpace Overflow", color: "#3b82f6" },
      { lat: 12.940, lon: 77.710, title: "Varthur Lake Basin", color: "#06b6d4" },
      { lat: 12.905, lon: 77.690, title: "Rainbow Drive Lowland Sump", color: "#f43f5e" },
      { lat: 13.045, lon: 77.620, title: "Manyata Tech Park (Hebbal Valley)", color: "#a855f7" }
    ]
  },
  DEL: {
    center: [28.6139, 77.2090],
    zoom: 11,
    landmarks: [
      { lat: 28.665, lon: 77.235, title: "Yamuna Bazar & Kashmere Gate Riverbed", color: "#3b82f6" },
      { lat: 28.625, lon: 77.245, title: "ITO Ring Road Breach Regulator", color: "#f43f5e" },
      { lat: 28.635, lon: 77.225, title: "Minto Bridge Chronic Subway Sump", color: "#eab308" },
      { lat: 28.590, lon: 77.160, title: "Delhi Ridge (Highland Uplands)", color: "#10b981" }
    ]
  },
  HYD: {
    center: [17.3850, 78.4867],
    zoom: 11,
    landmarks: [
      { lat: 17.370, lon: 78.500, title: "Musi River Moosarambagh Causeway", color: "#3b82f6" },
      { lat: 17.430, lon: 78.475, title: "Hussain Sagar Surplus Weir", color: "#06b6d4" },
      { lat: 17.400, lon: 78.410, title: "Nadeem Colony / Tolichowki Sump", color: "#f43f5e" },
      { lat: 17.440, lon: 78.360, title: "HITEC City & Gachibowli Ridge", color: "#a855f7" }
    ]
  },
  CCU: {
    center: [22.5726, 88.3639],
    zoom: 11,
    landmarks: [
      { lat: 22.580, lon: 88.350, title: "Hooghly River & Howrah Bridge", color: "#3b82f6" },
      { lat: 22.580, lon: 88.360, title: "Thanthania / Central Avenue Sump", color: "#f43f5e" },
      { lat: 22.500, lon: 88.310, title: "Behala & Taratala Waterlogging Bowl", color: "#eab308" },
      { lat: 22.530, lon: 88.430, title: "East Kolkata Wetlands Natural Sponge", color: "#10b981" }
    ]
  },
  AMD: {
    center: [23.0225, 72.5714],
    zoom: 11,
    landmarks: [
      { lat: 23.010, lon: 72.560, title: "Vasna Barrage & Sabarmati Riverfront", color: "#3b82f6" },
      { lat: 23.060, lon: 72.560, title: "Akhbarnagar Underpass Sump", color: "#f43f5e" },
      { lat: 22.970, lon: 72.610, title: "Kharicut Canal Vatva Lowland", color: "#eab308" },
      { lat: 23.040, lon: 72.510, title: "SG Highway & Bodakdev Ridge", color: "#10b981" }
    ]
  },
  PNQ: {
    center: [18.5204, 73.8567],
    zoom: 11,
    landmarks: [
      { lat: 18.480, lon: 73.835, title: "Ambil Odha Stream Breach Corridor", color: "#f43f5e" },
      { lat: 18.530, lon: 73.850, title: "Mula-Mutha Confluence (Sangam)", color: "#3b82f6" },
      { lat: 18.515, lon: 73.845, title: "Pulachi Wadi / Deccan Gymkhana", color: "#eab308" },
      { lat: 18.505, lon: 73.805, title: "Kothrud Hills (High Ground)", color: "#10b981" }
    ]
  },
  COK: {
    center: [9.9312, 76.2673],
    zoom: 12,
    landmarks: [
      { lat: 10.070, lon: 76.350, title: "Periyar River Aluva Floodplain", color: "#3b82f6" },
      { lat: 9.990, lon: 76.290, title: "Kaloor Stadium Canal Sump", color: "#f43f5e" },
      { lat: 10.025, lon: 76.310, title: "Edappally Canal Choke Point", color: "#eab308" },
      { lat: 10.010, lon: 76.360, title: "Kakkanad InfoPark Uplands", color: "#10b981" }
    ]
  },
  GAU: {
    center: [26.1445, 91.7362],
    zoom: 12,
    landmarks: [
      { lat: 26.190, lon: 91.750, title: "Brahmaputra Riverfront (Fancy Bazar)", color: "#3b82f6" },
      { lat: 26.160, lon: 91.770, title: "Bharalu River Anil Nagar Sump", color: "#f43f5e" },
      { lat: 26.115, lon: 91.665, title: "Deepor Beel Wetland Sump", color: "#06b6d4" },
      { lat: 26.165, lon: 91.705, title: "Kamakhya Foothills / Nilachal Hill", color: "#10b981" }
    ]
  },
  PAT: {
    center: [25.5941, 85.1376],
    zoom: 12,
    landmarks: [
      { lat: 25.620, lon: 85.150, title: "Ganga Riverfront & Gandhi Ghat", color: "#3b82f6" },
      { lat: 25.595, lon: 85.155, title: "Rajendra Nagar Low-Lying Bowl", color: "#f43f5e" },
      { lat: 25.585, lon: 85.145, title: "Kankarbagh Sump House Area", color: "#eab308" },
      { lat: 25.605, lon: 85.070, title: "Bailey Road Higher Terrace", color: "#10b981" }
    ]
  }
};

export const RiskMap: React.FC<RiskMapProps> = ({ cityId, mapData, onSelectGrid, selectedGridId }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const geojsonLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [colorMode, setColorMode] = useState<"risk" | "elevation" | "flow">("risk");
  const [baseMapMode, setBaseMapMode] = useState<"satellite" | "normal" | "dark">("satellite");

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;
    if ((container as any)._leaflet_id) return; // Prevent double initialization

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      if ((mapContainerRef.current as any)._leaflet_id) return;

      const cityCfg = CITY_LANDMARKS[cityId] || CITY_LANDMARKS["VJA"];
      const map = L.map(mapContainerRef.current, {
        center: cityCfg.center,
        zoom: cityCfg.zoom,
        minZoom: 9,
        maxZoom: 18,
        zoomControl: false
      });

      // Clean, unobtrusive attribution without third-party watermarks
      if (map.attributionControl) {
        map.attributionControl.setPrefix(false);
      }
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (container && (container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
    };
  }, []);

  // Update Base Tile Layer (Satellite vs Normal Street vs Dark)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      let tileUrl = "";
      let tileOptions: any = {};

      if (baseMapMode === "satellite") {
        // High-resolution ESRI World Imagery (100% Free Open GIS Satellite - No API Key)
        tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        tileOptions = {
          attribution: "Tiles &copy; Esri World Imagery",
          maxZoom: 19,
          className: "base-tile-satellite"
        };
      } else if (baseMapMode === "normal") {
        // Clean OpenStreetMap Daylight Street View (100% Free - No API Key)
        tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
        tileOptions = {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
          className: "base-tile-normal"
        };
      } else {
        // Dark Canvas View using OSM with CSS Dark Palette filter (Zero Watermarks - No API Key)
        tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
        tileOptions = {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
          className: "base-tile-dark"
        };
      }

      const layer = L.tileLayer(tileUrl, tileOptions);
      layer.addTo(map);
      layer.bringToBack();
      tileLayerRef.current = layer;
    });
  }, [baseMapMode]);

  // Update center, landmarks and layer when cityId changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      const cityCfg = CITY_LANDMARKS[cityId] || CITY_LANDMARKS["VJA"];
      map.flyTo(cityCfg.center, cityCfg.zoom, { duration: 1.2 });

      // Clean existing markers
      if (markersLayerRef.current) {
        map.removeLayer(markersLayerRef.current);
      }

      const markerGroup = L.layerGroup();
      cityCfg.landmarks.forEach((lm) => {
        const markerIcon = L.divIcon({
          className: "custom-map-pin",
          html: `<div style="background:${lm.color};width:10px;height:10px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px rgba(0,0,0,0.6);"></div>`,
          iconSize: [10, 10]
        });
        L.marker([lm.lat, lm.lon], { icon: markerIcon })
          .addTo(markerGroup)
          .bindTooltip(lm.title, { permanent: false, direction: "top" });
      });

      markerGroup.addTo(map);
      markersLayerRef.current = markerGroup;
    });
  }, [cityId]);

  // Update GeoJSON layer when mapData, colorMode, or selectedGridId changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapData) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (geojsonLayerRef.current) {
        map.removeLayer(geojsonLayerRef.current);
      }

      const getFillColor = (props: GridProperties) => {
        if (colorMode === "elevation") {
          const e = props.elevation_m;
          if (cityId === "BLR") {
            if (e < 878) return "#0284c7"; // lowest valley
            if (e < 890) return "#38bdf8";
            if (e < 905) return "#eab308";
            return "#a855f7"; // high plateau
          } else {
            if (e < 10) return "#0284c7"; // coastal lowland
            if (e < 20) return "#38bdf8";
            if (e < 35) return "#eab308";
            return "#a855f7"; // hill ridge
          }
        } else if (colorMode === "flow") {
          const flow = props.flow_accumulation;
          if (flow > 60) return "#881337";
          if (flow > 40) return "#ef4444";
          if (flow > 25) return "#eab308";
          return "#10b981";
        } else {
          switch (props.risk_level) {
            case "CRITICAL": return "#881337";
            case "HIGH": return "#ef4444";
            case "ELEVATED": return "#f97316";
            case "MODERATE": return "#eab308";
            case "LOW":
            default: return "#10b981";
          }
        }
      };

      const geojsonLayer = L.geoJSON(mapData as any, {
        style: (feature: any) => {
          const props: GridProperties = feature.properties;
          const isSelected = selectedGridId === props.grid_id;
          return {
            fillColor: getFillColor(props),
            weight: isSelected ? 2.5 : (baseMapMode === "satellite" ? 0.8 : 0.7),
            opacity: 0.85,
            color: isSelected ? "#ffffff" : (baseMapMode === "satellite" ? "#020617" : "#1e293b"),
            fillOpacity: isSelected ? 0.8 : (baseMapMode === "satellite" ? 0.45 : 0.55)
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          const p: GridProperties = feature.properties;
          layer.on({
            click: () => onSelectGrid(p.grid_id),
            mouseover: (e: any) => {
              const l = e.target;
              l.setStyle({ weight: 2, color: "#ffffff", fillOpacity: 0.75 });
            },
            mouseout: (e: any) => {
              geojsonLayer.resetStyle(e.target);
            }
          });

          layer.bindTooltip(`
            <div style="font-size:12px;padding:2px;">
              <strong>${p.zone_name}</strong> (${p.grid_id})<br/>
              <span style="color:#f87171;">Risk: ${p.risk_score}% — ${p.risk_level}</span><br/>
              Elevation: ${p.elevation_m}m AMSL<br/>
              Flow Acc: ${p.flow_accumulation}/100
            </div>
          `, { sticky: true, className: "drainsense-map-tooltip" });
        }
      });

      geojsonLayer.addTo(map);
      geojsonLayerRef.current = geojsonLayer;
    });
  }, [mapData, colorMode, selectedGridId, cityId, baseMapMode]);

  const cellCount = mapData?.features?.length || 0;

  return (
    <div className="relative w-full h-full min-h-[550px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl isolate">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Control Bar (Base Map & Analysis Layer) */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 max-w-[calc(100%-200px)]">
        {/* Base Map Selector (Satellite, Normal Street, Dark) */}
        <div className="bg-slate-900/95 backdrop-blur border border-slate-800 p-1.5 rounded-lg shadow-xl flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium pl-1 text-[11px]">
            Base:
          </span>
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => setBaseMapMode("satellite")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs ${
                baseMapMode === "satellite"
                  ? "bg-blue-600 text-white font-medium shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Real Satellite Aerial View (ESRI World Imagery)"
            >
              <Satellite className="w-3.5 h-3.5" />
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setBaseMapMode("normal")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs ${
                baseMapMode === "normal"
                  ? "bg-blue-600 text-white font-medium shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Standard Normal Street View (OpenStreetMap)"
            >
              <MapIcon className="w-3.5 h-3.5" />
              Normal
            </button>
            <button
              type="button"
              onClick={() => setBaseMapMode("dark")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all text-xs ${
                baseMapMode === "dark"
                  ? "bg-blue-600 text-white font-medium shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Dark Mode Navigation Canvas"
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </div>

        {/* Data Layer Selector */}
        <div className="bg-slate-900/95 backdrop-blur border border-slate-800 p-1.5 rounded-lg shadow-xl flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 pl-1 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Layer:
          </span>
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => setColorMode("risk")}
              className={`px-2.5 py-1 rounded transition-all text-xs ${
                colorMode === "risk"
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Flood Risk
            </button>
            <button
              type="button"
              onClick={() => setColorMode("elevation")}
              className={`px-2.5 py-1 rounded transition-all text-xs ${
                colorMode === "elevation"
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Elevation
            </button>
            <button
              type="button"
              onClick={() => setColorMode("flow")}
              className={`px-2.5 py-1 rounded transition-all text-xs ${
                colorMode === "flow"
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Flow Acc
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur border border-slate-800 px-3.5 py-2.5 rounded-lg shadow-xl text-xs">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {colorMode === "risk" ? "Risk Probability Scale" : colorMode === "elevation" ? "Topographic Elevation" : "Runoff Flow Index"}
        </div>
        {colorMode === "risk" ? (
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="flex flex-col items-center">
              <span className="w-7 h-2.5 rounded-sm bg-[#10b981] mb-1"></span>
              <span className="text-[10px] text-slate-400">0-20%</span>
              <span className="text-[9px] font-bold text-emerald-400">LOW</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-7 h-2.5 rounded-sm bg-[#eab308] mb-1"></span>
              <span className="text-[10px] text-slate-400">20-40%</span>
              <span className="text-[9px] font-bold text-yellow-400">MOD</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-7 h-2.5 rounded-sm bg-[#f97316] mb-1"></span>
              <span className="text-[10px] text-slate-400">40-60%</span>
              <span className="text-[9px] font-bold text-orange-400">ELEV</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-7 h-2.5 rounded-sm bg-[#ef4444] mb-1"></span>
              <span className="text-[10px] text-slate-400">60-80%</span>
              <span className="text-[9px] font-bold text-red-400">HIGH</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-7 h-2.5 rounded-sm bg-[#881337] mb-1"></span>
              <span className="text-[10px] text-slate-400">80-100%</span>
              <span className="text-[9px] font-bold text-rose-400">CRIT</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#0284c7]"></span> Lowland</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#38bdf8]"></span> Plain</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#a855f7]"></span> Ridge</div>
          </div>
        )}
      </div>

      {/* Grid count badge */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg shadow-xl text-xs text-slate-300 flex items-center gap-2">
        <Droplets className="w-3.5 h-3.5 text-blue-400" />
        <span>{cellCount} Grids (500m × 500m)</span>
      </div>
    </div>
  );
};
