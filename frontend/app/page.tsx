"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { LandingPage } from "../components/LandingPage";
import { RiskMap } from "../components/RiskMap";
import { ZoneDrawer } from "../components/ZoneDrawer";
import { DashboardControlPanel } from "../components/DashboardControlPanel";
import { PriorityList } from "../components/PriorityList";
import { HistoricalEvents } from "../components/HistoricalEvents";
import { ModelAnalytics } from "../components/ModelAnalytics";
import { DrainAssets } from "../components/DrainAssets";
import { AlertsManager } from "../components/AlertsManager";
import { ReportsGenerator } from "../components/ReportsGenerator";
import { SettingsPage } from "../components/SettingsPage";
import { ResourceOptimizerModal } from "../components/ResourceOptimizerModal";
import { DataSources } from "../components/DataSources";
import { RainField } from "../components/RainField";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RiskMapGeoJSON,
  RiskSummary,
  ZoneDetail,
  PriorityZoneItem,
  CascadeTraceResponse,
} from "../types";
import {
  fetchAlerts,
  fetchCascadeTrace,
  fetchCurrentRiskMap,
  fetchHealthStatus,
  fetchPriorityZones,
  fetchZoneDetail,
} from "../lib/api";

const ease = [0.16, 1, 0.3, 1] as const;

export default function DashboardPage() {
  const reduce = useReducedMotion();
  const [showLanding, setShowLanding] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("VJA");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mapData, setMapData] = useState<RiskMapGeoJSON | null>(null);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [priorityZones, setPriorityZones] = useState<PriorityZoneItem[]>([]);
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);
  const [cascadePath, setCascadePath] = useState<CascadeTraceResponse | null>(null);
  const [isFleetOptimizerOpen, setIsFleetOptimizerOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [healthStatus, setHealthStatus] = useState<{ status: string; model_version: string } | null>(null);
  const [compactLayout, setCompactLayout] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () => setCompactLayout(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    localStorage.removeItem("drainsense_lang");
    const savedCollapsed = localStorage.getItem("drainsense_sidebar_collapsed");
    if (savedCollapsed != null) setSidebarCollapsed(savedCollapsed === "true");
    localStorage.removeItem("drainsense_token");
    localStorage.removeItem("drainsense_user");
  }, []);

  useEffect(() => {
    fetchHealthStatus()
      .then((h) => setHealthStatus({ status: h.status, model_version: h.model_version || "model" }))
      .catch(() => setHealthStatus({ status: "OFFLINE", model_version: "" }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMapLoading(true);
    setMapError(null);
    Promise.all([fetchCurrentRiskMap(selectedCity), fetchPriorityZones(selectedCity)])
      .then(([map, priority]) => {
        if (cancelled) return;
        setMapData(map.geojson);
        setSummary(map.summary);
        setPriorityZones(priority.zones || []);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setMapData(null);
        setSummary(null);
        setPriorityZones([]);
        setMapError(err.message || "The risk map did not load.");
      })
      .finally(() => {
        if (!cancelled) setMapLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  useEffect(() => {
    fetchAlerts(selectedCity)
      .then((res) => setAlertCount(res.alerts?.length || 0))
      .catch(() => setAlertCount(0));
  }, [selectedCity, activeTab]);

  const handleToggleSidebar = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem("drainsense_sidebar_collapsed", String(collapsed));
  };

  const [scenario, setScenario] = useState<{ rain: number | null; stage: number | null }>({ rain: null, stage: null });
  const [calculating, setCalculating] = useState(false);
  const rainNow = scenario.rain ?? summary?.current_rainfall_24h_mm;
  const stageNow = scenario.stage ?? summary?.current_prakasam_stage_m;

  const applyScenario = async (rain: number | null, stage: number | null) => {
    setCalculating(true);
    setScenario({ rain, stage });
    try {
      const [map, priority] = await Promise.all([
        fetchCurrentRiskMap(selectedCity, rain, stage),
        fetchPriorityZones(selectedCity, rain, stage),
      ]);
      setMapData(map.geojson);
      setSummary(map.summary);
      setPriorityZones(priority.zones || []);
      setMapError(null);
      setCascadePath(null);
      if (selectedGridId) {
        const detail = await fetchZoneDetail(
          selectedGridId,
          rain ?? map.summary.current_rainfall_24h_mm,
          stage ?? map.summary.current_prakasam_stage_m
        );
        setZoneDetail(detail);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "The model did not score this input.";
      setMapError(message);
      throw err;
    } finally {
      setCalculating(false);
    }
  };

  const handleSelectGrid = async (gridId: string) => {
    setSelectedGridId(gridId);
    if (rainNow == null) {
      setZoneDetail(null);
      return;
    }
    try {
      const detail = await fetchZoneDetail(gridId, rainNow, stageNow);
      setZoneDetail(detail);
    } catch (e) {
      console.error(e);
      setZoneDetail(null);
    }
  };

  const handleTriggerCascade = async (gridId: string) => {
    if (rainNow == null) {
      setCascadePath(null);
      return;
    }
    try {
      const trace = await fetchCascadeTrace(gridId, rainNow);
      setCascadePath(trace);
    } catch (e) {
      console.error(e);
      setCascadePath(null);
    }
  };

  if (showLanding) {
    return <LandingPage onEnterDashboard={() => setShowLanding(false)} />;
  }

  const dashboard = activeTab === "dashboard" || activeTab === "map";

  return (
    <div className="flex h-dvh overflow-hidden bg-[#F3F7F6] text-[#12262A]">
      <RainField />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={handleToggleSidebar}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        currentLang="en"
        alertCount={alertCount}
      />
      <div
        className={`relative z-10 flex min-h-0 min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          sidebarCollapsed ? "lg:pl-[4.5rem]" : "lg:pl-64"
        }`}
      >
        <Navbar
          selectedCity={selectedCity}
          onSelectCity={(cityId) => {
            setSelectedCity(cityId);
            setSelectedGridId(null);
            setZoneDetail(null);
            setCascadePath(null);
          }}
          healthStatus={healthStatus}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main className={`min-h-0 flex-1 ${dashboard ? "overflow-hidden" : "overflow-y-auto"} px-4 py-4 sm:px-5`}>
          <motion.div
            key={activeTab}
            className={dashboard ? "h-full min-h-0" : "mx-auto max-w-[1400px]"}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease }}
          >
            {dashboard && (
              <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="min-h-[50dvh] overflow-hidden rounded-xl border border-[#D5E2E0] bg-[#FBFDFC] lg:col-span-8 lg:min-h-0">
                  {mapLoading && <Skeleton className="h-full min-h-[50dvh] w-full rounded-none" />}
                  {!mapLoading && mapError && (
                    <div className="flex h-full min-h-[50dvh] items-center justify-center p-8 text-center">
                      <div>
                        <p className="text-lg font-semibold">The risk map did not load.</p>
                        <p className="mt-2 text-sm text-[#4C5E62]">{mapError}</p>
                      </div>
                    </div>
                  )}
                  {!mapLoading && !mapError && mapData && (
                    <RiskMap
                      cityId={selectedCity}
                      mapData={mapData}
                      onSelectGrid={handleSelectGrid}
                      selectedGridId={selectedGridId}
                      cascadePath={cascadePath}
                      onClearCascade={() => setCascadePath(null)}
                      baseRain24h={rainNow}
                    />
                  )}
                </div>
                <div className="min-h-0 overflow-hidden lg:col-span-4">
                  <ScrollArea className="h-full">
                  <DashboardControlPanel
                    cityId={selectedCity}
                    cityName="Vijayawada / Amaravati"
                    summary={summary}
                    selectedGridId={selectedGridId}
                    zoneDetail={zoneDetail}
                    priorityZones={priorityZones}
                    currentLang="en"
                    onSelectGrid={handleSelectGrid}
                    onClearSelectedGrid={() => {
                      setSelectedGridId(null);
                      setZoneDetail(null);
                    }}
                    onCalculate={applyScenario}
                    calculating={calculating}
                    healthStatus={healthStatus || { status: "OFFLINE", model_version: "" }}
                    onTriggerCascade={handleTriggerCascade}
                    onOpenFleetOptimizer={() => setIsFleetOptimizerOpen(true)}
                    activeCascadePath={cascadePath}
                    onClearCascade={() => setCascadePath(null)}
                  />
                  </ScrollArea>
                </div>
              </div>
            )}
            {activeTab === "assets" && <DrainAssets currentCityId={selectedCity} currentLang="en" />}
            {activeTab === "alerts" && (
              <AlertsManager
                currentCityId={selectedCity}
                currentLang="en"
                onNavigateToMap={(gid) => {
                  setActiveTab("map");
                  handleSelectGrid(gid);
                }}
              />
            )}
            {activeTab === "priority" && (
              <PriorityList
                cityId={selectedCity}
                onSelectZone={(gid) => {
                  setActiveTab("map");
                  handleSelectGrid(gid);
                }}
              />
            )}
            {activeTab === "historical" && <HistoricalEvents cityId={selectedCity} />}
            {activeTab === "analytics" && <ModelAnalytics />}
            {activeTab === "sources" && <DataSources />}
            {activeTab === "reports" && (
              <ReportsGenerator
                currentCityId={selectedCity}
                summary={summary}
                priorityZones={priorityZones}
                currentLang="en"
              />
            )}
            {activeTab === "settings" && (
              <SettingsPage
                currentLang="en"
                healthStatus={healthStatus}
              />
            )}
          </motion.div>
        </main>
      </div>

      {compactLayout && (
        <ZoneDrawer
          zone={zoneDetail}
          onClose={() => {
            setZoneDetail(null);
            setSelectedGridId(null);
          }}
        />
      )}

      <ResourceOptimizerModal
        isOpen={isFleetOptimizerOpen}
        onClose={() => setIsFleetOptimizerOpen(false)}
        cityId={selectedCity}
        cityName="Vijayawada / Amaravati"
      />
    </div>
  );
}
