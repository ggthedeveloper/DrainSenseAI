"use client";

import React, { useEffect, useRef, useState } from "react";
import { RiskMapGeoJSON, GridProperties } from "../types";
import { 
  Layers, 
  Droplets, 
  Satellite, 
  Map as MapIcon, 
  Moon, 
  Plus, 
  Minus, 
  RotateCcw, 
  Loader2,
  Maximize2,
  Minimize2,
  Focus,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Clock,
  CornerDownRight,
  Sparkles,
  RefreshCw,
  X
} from "lucide-react";
import { CascadeTraceResponse, TemporalNowcastResponse } from "../types";
import { fetchTemporalNowcast } from "../lib/api";

interface RiskMapProps {
  cityId: string;
  mapData: RiskMapGeoJSON | null;
  onSelectGrid: (gridId: string) => void;
  selectedGridId?: string | null;
  cascadePath?: CascadeTraceResponse | null;
  onClearCascade?: () => void;
}

const CITY_NAME_LOOKUP: Record<string, string> = {
  VJA: "Vijayawada / Amaravati",
  CHE: "Chennai"
};

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
  }
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1220" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#071526" }] },
];

function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps requires a browser"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google.maps);
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured"));

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-drainsense-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).google.maps));
      existing.addEventListener("error", () => reject(new Error("Google Maps JavaScript API failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.drainsenseGoogleMaps = "true";
    script.onload = () => resolve((window as any).google.maps);
    script.onerror = () => reject(new Error("Google Maps JavaScript API failed to load. Check API key restrictions and billing."));
    document.head.appendChild(script);
  });
}

export const RiskMap: React.FC<RiskMapProps> = ({ 
  cityId, 
  mapData, 
  onSelectGrid, 
  selectedGridId,
  cascadePath,
  onClearCascade
}) => {
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const geojsonLayerRef = useRef<any[]>([]);
  const markersLayerRef = useRef<any[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Novelty refs: Topological cascade polyline & markers
  const cascadePolylineRef = useRef<any>(null);
  const cascadeMarkersRef = useRef<any[]>([]);

  const [colorMode, setColorMode] = useState<"risk" | "elevation" | "flow">("risk");
  const [baseMapMode, setBaseMapMode] = useState<"satellite" | "normal" | "dark" | "terrain">("satellite");
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [isDataRendering, setIsDataRendering] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Novelty state: Dynamic multi-horizon temporal nowcast
  const [nowcastData, setNowcastData] = useState<TemporalNowcastResponse | null>(null);
  const [activeHorizonIdx, setActiveHorizonIdx] = useState<number>(0);
  const [isPlayingNowcast, setIsPlayingNowcast] = useState<boolean>(false);
  const [isNowcastLoading, setIsNowcastLoading] = useState<boolean>(false);

  // Fetch nowcast data when city changes
  useEffect(() => {
    setIsNowcastLoading(true);
    fetchTemporalNowcast(cityId)
      .then((data) => {
        setNowcastData(data);
        setActiveHorizonIdx(0);
        setIsPlayingNowcast(false);
        setIsNowcastLoading(false);
      })
      .catch(() => setIsNowcastLoading(false));
  }, [cityId]);

  // Nowcast auto-play timeline interval
  useEffect(() => {
    if (!isPlayingNowcast) return;
    const interval = setInterval(() => {
      setActiveHorizonIdx((prev) => (prev + 1) % 5);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlayingNowcast]);

  const cityName = CITY_NAME_LOOKUP[cityId] || cityId;

  const getGoogleMapType = (mode: "satellite" | "normal" | "dark" | "terrain") => {
    if (mode === "satellite") return "hybrid";
    if (mode === "terrain") return "terrain";
    return "roadmap";
  };

  // Zoom control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      const cityCfg = CITY_LANDMARKS[cityId] || CITY_LANDMARKS["VJA"];
      mapInstanceRef.current.panTo({ lat: cityCfg.center[0], lng: cityCfg.center[1] });
      mapInstanceRef.current.setZoom(cityCfg.zoom);
    }
  };

  const handleFitBounds = () => {
    if (mapInstanceRef.current && geojsonLayerRef.current.length) {
      try {
        const bounds = new (window as any).google.maps.LatLngBounds();
        geojsonLayerRef.current.forEach((polygon) => polygon.getPath().forEach((point: any) => bounds.extend(point)));
        if (!bounds.isEmpty()) {
          mapInstanceRef.current.fitBounds(bounds, 35);
          return;
        }
      } catch (e) {
        console.warn("Bounds fit error:", e);
      }
    }
    handleResetView();
  };

  const handleToggleFullscreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
          setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
      }).catch((e) => console.warn(e));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
      }).catch((e) => console.warn(e));
    }
  };

  // Sync fullscreen state if exited via ESC key
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Initialize the official Google Maps JavaScript API. The old implementation
  // used undocumented raster tile URLs, which are not a supported Maps API.
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;
    let isMounted = true;
    loadGoogleMaps().then((googleMaps) => {
      if (!isMounted || !mapContainerRef.current) return;
      setMapError(null);
      const cityCfg = CITY_LANDMARKS[cityId] || CITY_LANDMARKS["VJA"];
      const map = new googleMaps.Map(mapContainerRef.current, {
        center: { lat: cityCfg.center[0], lng: cityCfg.center[1] },
        zoom: cityCfg.zoom,
        minZoom: 4, maxZoom: 20,
        mapTypeId: getGoogleMapType(baseMapMode),
        styles: baseMapMode === "dark" ? DARK_MAP_STYLES : undefined,
        streetViewControl: false, fullscreenControl: false, mapTypeControl: false,
        gestureHandling: "greedy", clickableIcons: false,
      });
      map.addListener("zoom_changed", () => setMapZoom(map.getZoom() || cityCfg.zoom));
      setMapZoom(cityCfg.zoom);
      const markerGroup: any[] = [];
      cityCfg.landmarks.forEach((lm) => {
        markerGroup.push(new googleMaps.Marker({
          map, position: { lat: lm.lat, lng: lm.lon }, title: lm.title,
          label: { text: "●", color: lm.color, fontSize: "18px" },
        }));
      });
      markersLayerRef.current = markerGroup;
      mapInstanceRef.current = map;
      setIsMapReady(true);
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
          window.dispatchEvent(new Event("resize"));
        });
        ro.observe(container);
        if (mapWrapperRef.current) {
          ro.observe(mapWrapperRef.current);
        }
        resizeObserverRef.current = ro;
      }
    }).catch((error) => {
      console.error(error);
      setMapError(error instanceof Error ? error.message : "Google Maps could not be loaded");
      setIsDataRendering(false);
    });

    return () => {
      isMounted = false;
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      markersLayerRef.current.forEach((marker) => marker.setMap(null));
      geojsonLayerRef.current.forEach((polygon) => polygon.setMap(null));
      markersLayerRef.current = [];
      geojsonLayerRef.current = [];
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch supported Google map types without replacing the map instance.
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;
    mapInstanceRef.current.setMapTypeId(getGoogleMapType(baseMapMode));
    mapInstanceRef.current.setOptions({ styles: baseMapMode === "dark" ? DARK_MAP_STYLES : undefined });
  }, [baseMapMode, isMapReady]);

  // Smooth fly transition when cityId changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;
    const cityCfg = CITY_LANDMARKS[cityId] || CITY_LANDMARKS["VJA"];
    map.panTo({ lat: cityCfg.center[0], lng: cityCfg.center[1] });
    map.setZoom(cityCfg.zoom);
    markersLayerRef.current.forEach((marker) => marker.setMap(null));
    const googleMaps = (window as any).google.maps;
    markersLayerRef.current = cityCfg.landmarks.map((lm) => new googleMaps.Marker({
      map, position: { lat: lm.lat, lng: lm.lon }, title: lm.title,
      label: { text: "●", color: lm.color, fontSize: "18px" },
    }));
  }, [cityId, isMapReady]);

  // Center on selected grid cell if selected from outside
  useEffect(() => {
    if (!selectedGridId || !mapData || !mapInstanceRef.current) return;
    const feat = mapData.features?.find((f) => f.properties.grid_id === selectedGridId);
    if (feat && feat.geometry && feat.geometry.coordinates) {
      try {
        const coords = feat.geometry.coordinates[0];
        let latSum = 0, lonSum = 0;
        coords.forEach((pt: number[]) => {
          lonSum += pt[0];
          latSum += pt[1];
        });
        const cLat = latSum / coords.length;
        const cLon = lonSum / coords.length;
        mapInstanceRef.current.panTo({ lat: cLat, lng: cLon });
        mapInstanceRef.current.setZoom(Math.max(mapInstanceRef.current.getZoom(), 13));
      } catch (e) {
        console.warn("Center on selected grid error:", e);
      }
    }
  }, [selectedGridId, mapData]);

  // Render Topological Inundation Cascade Corridor on Google Maps
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;
    const map = mapInstanceRef.current;
    const googleMaps = (window as any).google?.maps;
    if (!googleMaps) return;

    if (cascadePolylineRef.current) {
      cascadePolylineRef.current.setMap(null);
      cascadePolylineRef.current = null;
    }
    cascadeMarkersRef.current.forEach((m) => m.setMap(null));
    cascadeMarkersRef.current = [];

    if (!cascadePath || !cascadePath.cascade_path || cascadePath.cascade_path.length < 2) return;

    const pathCoords = cascadePath.cascade_path.map((pt) => ({
      lat: pt.latitude,
      lng: pt.longitude
    }));

    const polyline = new googleMaps.Polyline({
      path: pathCoords,
      geodesic: true,
      strokeColor: "#06b6d4",
      strokeOpacity: 0.95,
      strokeWeight: 4.5,
      zIndex: 200,
      map
    });
    cascadePolylineRef.current = polyline;

    const bounds = new googleMaps.LatLngBounds();
    cascadePath.cascade_path.forEach((pt, idx) => {
      bounds.extend({ lat: pt.latitude, lng: pt.longitude });
      if (idx === 0 || idx === cascadePath.cascade_path.length - 1 || idx % 2 === 0) {
        const marker = new googleMaps.Marker({
          position: { lat: pt.latitude, lng: pt.longitude },
          map,
          title: `${pt.zone_name} (${pt.arrival_label})`,
          label: {
            text: idx === 0 ? "⚡ ORIGIN" : idx === cascadePath.cascade_path.length - 1 ? "🌊 OUTFLOW" : pt.arrival_label,
            color: idx === 0 ? "#f87171" : "#38bdf8",
            fontSize: "10px",
            fontWeight: "bold"
          },
          zIndex: 250
        });
        cascadeMarkersRef.current.push(marker);
      }
    });

    try {
      map.fitBounds(bounds, 50);
    } catch (e) {
      console.warn("Cascade fit bounds error:", e);
    }
  }, [cascadePath, isMapReady]);

  // Draw every risk cell on Google Maps. GeoJSON is [lng, lat], while the
  // Maps API receives {lat, lng}; converting explicitly keeps the cells aligned.
  useEffect(() => {
    if (!mapInstanceRef.current || !mapData || !isMapReady) return;

    setIsDataRendering(true);
    const map = mapInstanceRef.current;
    geojsonLayerRef.current.forEach((polygon) => polygon.setMap(null));
    geojsonLayerRef.current = [];

      const getFillColor = (props: GridProperties) => {
        if (colorMode === "elevation") {
          const e = props.elevation_m;
          if (e < 10) return "#0284c7"; // coastal lowland
          if (e < 20) return "#38bdf8";
          if (e < 35) return "#eab308";
          return "#a855f7"; // hill ridge
        } else if (colorMode === "flow") {
          const flow = props.flow_accumulation;
          if (flow > 60) return "#881337";
          if (flow > 40) return "#ef4444";
          if (flow > 25) return "#eab308";
          return "#10b981";
        } else {
          // Dynamic Nowcast risk evaluation
          let effectiveRisk = props.risk_level;
          if (nowcastData && activeHorizonIdx > 0) {
            const hState = nowcastData.timeline[activeHorizonIdx]?.cell_states?.[props.grid_id];
            if (hState) {
              effectiveRisk = hState.risk_level;
            }
          }

          switch (effectiveRisk) {
            case "CRITICAL": return "#881337";
            case "HIGH": return "#ef4444";
            case "ELEVATED": return "#f97316";
            case "MODERATE": return "#eab308";
            case "LOW":
            default: return "#10b981";
          }
        }
      };

      const infoWindow = new (window as any).google.maps.InfoWindow();
      // The model is trained at 500 m. At closer zoom levels, subdivide each
      // source cell into coordinate-aligned display cells while retaining the
      // parent cell's risk value and identity.
      const subdivisions = mapZoom >= 16 ? 4 : mapZoom >= 14 ? 2 : 1;
      mapData.features.forEach((feature) => {
        const p = feature.properties;
        const sourceRing = feature.geometry.coordinates[0];
        const lngs = sourceRing.map(([lng]) => lng);
        const lats = sourceRing.map(([, lat]) => lat);
        const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        for (let row = 0; row < subdivisions; row += 1) {
          for (let col = 0; col < subdivisions; col += 1) {
            const west = minLng + ((maxLng - minLng) * col) / subdivisions;
            const east = minLng + ((maxLng - minLng) * (col + 1)) / subdivisions;
            const south = minLat + ((maxLat - minLat) * row) / subdivisions;
            const north = minLat + ((maxLat - minLat) * (row + 1)) / subdivisions;
            const path = [{ lat: south, lng: west }, { lat: south, lng: east }, { lat: north, lng: east }, { lat: north, lng: west }];
            const selected = selectedGridId === p.grid_id;
            const polygon = new (window as any).google.maps.Polygon({
              paths: path,
              map,
              strokeColor: selected ? "#ffffff" : baseMapMode === "satellite" ? "#020617" : "#1e293b",
              strokeOpacity: subdivisions > 1 ? 0.55 : 0.85,
              strokeWeight: selected ? 2.5 : subdivisions > 1 ? 0.7 : 1,
              fillColor: getFillColor(p),
              fillOpacity: selected ? 0.8 : baseMapMode === "satellite" ? 0.45 : 0.55,
              clickable: true,
              zIndex: selected ? 2 : 1,
            });
            polygon.addListener("click", (event: any) => {
              onSelectGrid(p.grid_id);
              infoWindow.setContent(`<div style="color:#0f172a;font-size:12px;line-height:1.45"><strong>${p.zone_name}</strong> (${p.grid_id})<br/>Risk: ${p.risk_score}% - ${p.risk_level}<br/>Underlying model cell: 500 m × 500 m<br/><small>Lat: ${p.latitude.toFixed(5)} · Lng: ${p.longitude.toFixed(5)}</small></div>`);
              infoWindow.setPosition(event.latLng);
              infoWindow.open({ map });
            });
            polygon.addListener("mouseover", () => polygon.setOptions({ strokeWeight: 2, strokeColor: "#ffffff", fillOpacity: 0.75 }));
            polygon.addListener("mouseout", () => polygon.setOptions({
              strokeWeight: selected ? 2.5 : subdivisions > 1 ? 0.7 : 1,
              strokeColor: selected ? "#ffffff" : baseMapMode === "satellite" ? "#020617" : "#1e293b",
              fillOpacity: selected ? 0.8 : baseMapMode === "satellite" ? 0.45 : 0.55,
            }));
            geojsonLayerRef.current.push(polygon);
          }
        }
      });
      setIsDataRendering(false);
  }, [mapData, colorMode, selectedGridId, cityId, baseMapMode, isMapReady, mapZoom, activeHorizonIdx, nowcastData]);

  const cellCount = mapData?.features?.length || 0;

  return (
    <div 
      ref={mapWrapperRef}
      className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl isolate"
    >
      {/* Map DOM Element with smooth fade-in */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full transition-opacity duration-500 ${isMapReady ? "opacity-100" : "opacity-0"}`}
      />

      {/* Loading overlay - only while Leaflet initializes */}
      {!isMapReady && !mapError && (
        <div className="absolute inset-0 z-[1500] flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <div>
              <div className="text-xs font-bold text-white tracking-wide">
                Initializing Google Map Engine
              </div>
              <div className="text-[10px] text-slate-400">
                Loading satellite tiles and spatial boundaries...
              </div>
            </div>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-[1500] flex items-center justify-center bg-slate-950/95 p-6 text-center">
          <div className="max-w-md rounded-2xl border border-rose-900/70 bg-slate-900 p-5 shadow-2xl">
            <div className="text-sm font-bold text-rose-300">Google Maps unavailable</div>
            <div className="mt-2 text-xs leading-5 text-slate-400">{mapError}</div>
            <div className="mt-3 text-[11px] text-slate-500">Verify that Maps JavaScript API is enabled, billing is active, and localhost is allowed by the API key restrictions.</div>
          </div>
        </div>
      )}

      {/* Map Control Bar (Base Map & Analysis Layer) - Strictly Contained Within Top-Left */}
      <div
        className="absolute top-3 left-3 z-[1001] flex flex-wrap items-center gap-2 max-w-[calc(100%-160px)] pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Base Map Selector (Google Satellite, Google Streets, Terrain, Dark) */}
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl flex items-center gap-1 text-xs">
          <span className="text-slate-400 font-semibold pl-1 text-[11px] hidden sm:inline">
            Google Maps:
          </span>
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setBaseMapMode("satellite")}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-xs cursor-pointer ${
                baseMapMode === "satellite"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Google Satellite Aerial View with Place & Road Labels"
            >
              <Satellite className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setBaseMapMode("normal")}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-xs cursor-pointer ${
                baseMapMode === "normal"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Google Maps Street View"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Streets</span>
            </button>
            <button
              type="button"
              onClick={() => setBaseMapMode("terrain")}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-xs cursor-pointer ${
                baseMapMode === "terrain"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Google Maps Topographic Terrain View"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Terrain</span>
            </button>
            <button
              type="button"
              onClick={() => setBaseMapMode("dark")}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-xs cursor-pointer ${
                baseMapMode === "dark"
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Dark Mode Navigation Canvas"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dark</span>
            </button>
          </div>
        </div>

        {/* Data Layer Selector */}
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl flex items-center gap-1 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 pl-1 text-[11px] hidden sm:inline">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Layer:
          </span>
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setColorMode("risk")}
              className={`px-2 py-1 rounded-md transition-all text-xs cursor-pointer ${
                colorMode === "risk"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Risk
            </button>
            <button
              type="button"
              onClick={() => setColorMode("elevation")}
              className={`px-2 py-1 rounded-md transition-all text-xs cursor-pointer ${
                colorMode === "elevation"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Elevation
            </button>
            <button
              type="button"
              onClick={() => setColorMode("flow")}
              className={`px-2 py-1 rounded-md transition-all text-xs cursor-pointer ${
                colorMode === "flow"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Flow
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Map Legend - Collapsible to avoid blocking map surface */}
      <div
        className="absolute bottom-3 left-3 z-[1001] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl text-xs pointer-events-auto transition-all"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {colorMode === "risk" ? "Risk Scale" : colorMode === "elevation" ? "Topography" : "Flow Index"}
          </span>
          <button
            type="button"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="text-slate-400 hover:text-white p-0.5 rounded"
            title={isLegendOpen ? "Collapse Legend" : "Expand Legend"}
          >
            {isLegendOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {isLegendOpen && (
          <div className="p-2.5 animate-in fade-in duration-150">
            {colorMode === "risk" ? (
              <div className="grid grid-cols-5 gap-1.5 text-center">
                <div className="flex flex-col items-center">
                  <span className="w-6 h-2 rounded-sm bg-[#10b981] mb-1"></span>
                  <span className="text-[9px] text-slate-400 font-mono">0-20%</span>
                  <span className="text-[8px] font-bold text-emerald-400">LOW</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="w-6 h-2 rounded-sm bg-[#eab308] mb-1"></span>
                  <span className="text-[9px] text-slate-400 font-mono">20-40%</span>
                  <span className="text-[8px] font-bold text-yellow-400">MOD</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="w-6 h-2 rounded-sm bg-[#f97316] mb-1"></span>
                  <span className="text-[9px] text-slate-400 font-mono">40-60%</span>
                  <span className="text-[8px] font-bold text-orange-400">ELEV</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="w-6 h-2 rounded-sm bg-[#ef4444] mb-1"></span>
                  <span className="text-[9px] text-slate-400 font-mono">60-80%</span>
                  <span className="text-[8px] font-bold text-red-400">HIGH</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="w-6 h-2 rounded-sm bg-[#881337] mb-1"></span>
                  <span className="text-[9px] text-slate-400 font-mono">80-100%</span>
                  <span className="text-[8px] font-bold text-rose-400">CRIT</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-[11px] font-medium">
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span> Lowland</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span> Plain</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></span> Ridge</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Novelty 1: Topological Cascade Flow Active Banner */}
      {cascadePath && cascadePath.cascade_path && cascadePath.cascade_path.length > 0 && (
        <div 
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[1002] bg-slate-900/95 backdrop-blur-md border border-cyan-500/60 shadow-2xl shadow-cyan-950/50 rounded-xl px-3.5 py-1.5 flex items-center gap-3 text-xs max-w-[90vw] animate-in fade-in slide-in-from-top-2 pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="font-bold text-cyan-400 font-mono tracking-wide text-[11px]">
              TOPOLOGICAL CASCADE ACTIVE
            </span>
          </div>
          <div className="h-3 w-px bg-slate-700 hidden sm:block" />
          <div className="text-slate-300 text-[11px] hidden sm:flex items-center gap-2">
            <span>
              <strong className="text-white">{cascadePath.origin_zone_name}</strong> ({cascadePath.origin_grid_id})
            </span>
            <span className="text-cyan-400">➔</span>
            <span>
              <strong className="text-white">{cascadePath.terminal_sink}</strong>
            </span>
            <span className="text-slate-400">({cascadePath.terminal_arrival_minutes}m lag · {cascadePath.initial_spillover_volume_m3.toLocaleString()} m³)</span>
          </div>
          {onClearCascade && (
            <button
              type="button"
              onClick={onClearCascade}
              className="ml-auto text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-md transition-colors cursor-pointer"
              title="Clear Cascade Route"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Novelty 3: Temporal Nowcast Timeline Player & Scrubber */}
      {nowcastData && nowcastData.timeline && nowcastData.timeline.length > 0 && (
        <div
          className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-[1001] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-2 sm:px-3 sm:py-2 flex flex-col gap-1.5 max-w-[94vw] sm:max-w-xl pointer-events-auto transition-all"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header Row: Stage Name, Time, Rain Depth, Play/Pause */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlayingNowcast(!isPlayingNowcast)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                  isPlayingNowcast
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                    : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md"
                }`}
                title={isPlayingNowcast ? "Pause Nowcast" : "Auto-play Nowcast Horizons"}
              >
                {isPlayingNowcast ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px] leading-tight">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span>Nowcast: {nowcastData.timeline[activeHorizonIdx]?.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {nowcastData.timeline[activeHorizonIdx]?.rainfall_24h_mm}mm IMD
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-[280px]">
                  {nowcastData.timeline[activeHorizonIdx]?.stage}: {nowcastData.timeline[activeHorizonIdx]?.description}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono hidden md:flex">
              <span className="text-rose-400 font-bold">
                {nowcastData.timeline[activeHorizonIdx]?.summary?.critical_zones ?? 0} Crit
              </span>
              <span>•</span>
              <span className="text-amber-400">
                {nowcastData.timeline[activeHorizonIdx]?.summary?.high_risk_zones ?? 0} High
              </span>
              <span>•</span>
              <span className="text-cyan-400">
                Max: {nowcastData.timeline[activeHorizonIdx]?.summary?.highest_risk_zone?.zone_name} ({nowcastData.timeline[activeHorizonIdx]?.summary?.highest_risk_zone?.risk_score}%)
              </span>
            </div>
          </div>

          {/* Stepper Buttons / Horizon Pills */}
          <div className="grid grid-cols-5 gap-1 pt-0.5 border-t border-slate-800/60">
            {nowcastData.timeline.map((step, idx) => {
              const isActive = idx === activeHorizonIdx;
              return (
                <button
                  key={step.label || idx}
                  type="button"
                  onClick={() => {
                    setActiveHorizonIdx(idx);
                    setIsPlayingNowcast(false);
                  }}
                  className={`py-1 px-1.5 rounded-md text-[10px] font-mono transition-all text-center cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40 ring-1 ring-blue-400"
                      : "bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <div className="leading-tight">{step.label}</div>
                  <div className="text-[8px] opacity-75 leading-tight">{step.rainfall_24h_mm}mm</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid count badge */}
      <div
        className="absolute top-3 right-3 z-[1001] bg-slate-900/95 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-xl shadow-xl text-xs text-slate-300 flex items-center gap-1.5 pointer-events-auto font-medium"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Droplets className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[11px] font-mono">{cellCount} Grids</span>
      </div>

      {/* Floating Zoom & Navigation Controls (Bottom-Right Stack) */}
      <div
        className="absolute bottom-3 right-3 z-[1001] flex flex-col gap-1.5 pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="w-8 h-8 rounded-lg bg-slate-900/95 hover:bg-slate-800 active:scale-90 border border-slate-800 text-slate-200 hover:text-white shadow-xl flex items-center justify-center transition-all cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Fit Risk Bounds */}
        <button
          type="button"
          onClick={handleFitBounds}
          className="w-8 h-8 rounded-lg bg-slate-900/95 hover:bg-slate-800 active:scale-90 border border-slate-800 text-slate-200 hover:text-white shadow-xl flex items-center justify-center transition-all cursor-pointer"
          title="Fit Risk Area Extent"
        >
          <Focus className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-slate-900/95 hover:bg-slate-800 active:scale-90 border border-slate-800 text-slate-200 hover:text-white shadow-xl flex items-center justify-center transition-all cursor-pointer"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-slate-900/95 hover:bg-slate-800 active:scale-90 border border-slate-800 text-slate-200 hover:text-white shadow-xl flex items-center justify-center transition-all cursor-pointer"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Reset View */}
        <button
          type="button"
          onClick={handleResetView}
          className="w-8 h-8 rounded-lg bg-slate-900/95 hover:bg-slate-800 active:scale-90 border border-slate-800 text-slate-300 hover:text-white shadow-xl flex items-center justify-center transition-all cursor-pointer"
          title="Reset to City Extent (⟲)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
