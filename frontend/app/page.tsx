"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { LoginPage } from "../components/LoginPage";
import { RiskMap } from "../components/RiskMap";
import { ZoneDrawer } from "../components/ZoneDrawer";
import { DashboardControlPanel } from "../components/DashboardControlPanel";
import { WhatIfSimulator } from "../components/WhatIfSimulator";
import { PriorityList } from "../components/PriorityList";
import { HistoricalEvents } from "../components/HistoricalEvents";
import { ModelAnalytics } from "../components/ModelAnalytics";
import { DataHealth } from "../components/DataHealth";
import { JuryDemoModal } from "../components/JuryDemoModal";
import { AICopilot } from "../components/AICopilot";
import { DrainAssets } from "../components/DrainAssets";
import { AlertsManager } from "../components/AlertsManager";
import { ReportsGenerator } from "../components/ReportsGenerator";
import { SettingsPage } from "../components/SettingsPage";
import { PredictionView } from "../components/PredictionView";

import { RiskMapGeoJSON, RiskSummary, ZoneDetail, PriorityZoneItem } from "../types";
import { 
  fetchCurrentRiskMap, 
  fetchZoneDetail, 
  fetchHealthStatus,
  fetchPriorityZones 
} from "../lib/api";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { UserSession, getStoredSession, clearStoredSession, isUserAuthenticated } from "../lib/auth";

import { 
  ShieldAlert, 
  RefreshCw 
} from "lucide-react";

export default function DashboardPage() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Layout & Theme state
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Navigation & Data state
  const [selectedCity, setSelectedCity] = useState<string>("VJA");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mapData, setMapData] = useState<RiskMapGeoJSON | null>(null);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [priorityZones, setPriorityZones] = useState<PriorityZoneItem[]>([]);
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<{ status: string; model_version: string }>({
    status: "HEALTHY",
    model_version: "v1.0 (Calibrated XGBoost)"
  });

  const t = getTranslation(currentLang);

  // Initialize auth session
  useEffect(() => {
    const { user } = getStoredSession();
    if (user && isUserAuthenticated()) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setAuthChecking(false);
  }, []);

  // Initialize Theme and Language
  useEffect(() => {
    const savedTheme = localStorage.getItem("drainsense_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.classList.add("dark");
    }

    const savedLang = localStorage.getItem("drainsense_lang") as SupportedLanguage | null;
    if (savedLang && (savedLang === "en" || savedLang === "hi" || savedLang === "te")) {
      setCurrentLang(savedLang);
    }

    const savedCollapsed = localStorage.getItem("drainsense_sidebar_collapsed");
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
  }, []);

  // Theme toggle handler
  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("drainsense_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Language change handler
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    localStorage.setItem("drainsense_lang", lang);
  };

  // Sidebar collapse handler
  const handleToggleSidebar = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem("drainsense_sidebar_collapsed", String(collapsed));
  };

  // Logout handler
  const handleLogout = () => {
    if (confirm(t.logoutConfirm)) {
      clearStoredSession();
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  // Load risk map & priority zones whenever selectedCity changes
  useEffect(() => {
    fetchCurrentRiskMap(selectedCity)
      .then((res) => {
        setMapData(res.geojson);
        setSummary(res.summary);
      })
      .catch((err) => console.error("Error loading map:", err));

    fetchPriorityZones(selectedCity)
      .then((res) => {
        setPriorityZones(res.zones || []);
      })
      .catch((err) => console.error("Error loading priority zones:", err));
  }, [selectedCity]);

  // Load initial health status once
  useEffect(() => {
    fetchHealthStatus()
      .then((h) => {
        if (h) {
          setHealthStatus({
            status: h.status,
            model_version: h.model_version || "v1.0"
          });
        }
      })
      .catch((err) => console.error("Health fetch error:", err));
  }, []);

  // When a grid is clicked, fetch its zone detail
  const handleSelectGrid = async (gridId: string) => {
    setSelectedGridId(gridId);
    try {
      const detail = await fetchZoneDetail(gridId, summary?.current_rainfall_24h_mm || 145.0);
      setZoneDetail(detail);
    } catch (e) {
      console.error("Error loading zone detail:", e);
    }
  };

  const cityIdToName = (cid: string) => {
    const map: Record<string, string> = {
      VJA: "Vijayawada / Amaravati (AP)",
      CHE: "Chennai (TN)",
      BOM: "Mumbai (MH)",
      BLR: "Bengaluru (KA)",
      DEL: "Delhi NCR (DL)",
      HYD: "Hyderabad (TG)",
      CCU: "Kolkata (WB)",
      AMD: "Ahmedabad (GJ)",
      PNQ: "Pune (MH)",
      COK: "Kochi (KL)",
      GAU: "Guwahati (AS)",
      PAT: "Patna (BR)"
    };
    return map[cid] || cid;
  };

  const cityCatchmentLabels: Record<string, { rainRegion: string; threatSector: string; breachCorridor: string; sampleCritical: string; sampleLow: string }> = {
    VJA: {
      rainRegion: "Prakasam Catchment",
      threatSector: "Ajit Singh Nagar",
      breachCorridor: "Budameru Inundation Corridor",
      sampleCritical: "VJA_0036",
      sampleLow: "VJA_0001"
    },
    CHE: {
      rainRegion: "Adyar/Cooum Basin",
      threatSector: "Velachery & Kotturpuram",
      breachCorridor: "Adyar River Overflow Corridor",
      sampleCritical: "CHE_0110",
      sampleLow: "CHE_0001"
    },
    BOM: {
      rainRegion: "Mithi River Catchment",
      threatSector: "Kurla & Milan Subway",
      breachCorridor: "BKC/Mithi Lowland Sump",
      sampleCritical: "BOM_0120",
      sampleLow: "BOM_0001"
    },
    BLR: {
      rainRegion: "Bellandur Valley Basin",
      threatSector: "Rainbow Drive & EcoSpace",
      breachCorridor: "Outer Ring Road Rajakaluve",
      sampleCritical: "BLR_0140",
      sampleLow: "BLR_0001"
    },
    DEL: {
      rainRegion: "Yamuna Floodplain Catchment",
      threatSector: "Yamuna Bazar & ITO Ring Road",
      breachCorridor: "Najafgarh Drain Outfall",
      sampleCritical: "DEL_0050",
      sampleLow: "DEL_0001"
    },
    HYD: {
      rainRegion: "Musi River & Hussain Sagar",
      threatSector: "Moosarambagh & Begumpet Nala",
      breachCorridor: "Tolichowki / Nadeem Colony Sump",
      sampleCritical: "HYD_0045",
      sampleLow: "HYD_0001"
    },
    CCU: {
      rainRegion: "Hooghly Tidal Basin",
      threatSector: "Thanthania & Behala",
      breachCorridor: "Circular Canal Outfall",
      sampleCritical: "CCU_0035",
      sampleLow: "CCU_0001"
    },
    AMD: {
      rainRegion: "Sabarmati Riverfront Catchment",
      threatSector: "Akhbarnagar Underpass & Vatva",
      breachCorridor: "Kharicut Canal Tailback",
      sampleCritical: "AMD_0040",
      sampleLow: "AMD_0001"
    },
    PNQ: {
      rainRegion: "Mula-Mutha Basin",
      threatSector: "Ambil Odha & Sinhagad Road",
      breachCorridor: "Pulachi Wadi Riverfront Sump",
      sampleCritical: "PNQ_0030",
      sampleLow: "PNQ_0001"
    },
    COK: {
      rainRegion: "Periyar & Vembanad Estuary",
      threatSector: "Kaloor Stadium Sump & Aluva",
      breachCorridor: "Edappally Canal Choke",
      sampleCritical: "COK_0025",
      sampleLow: "COK_0001"
    },
    GAU: {
      rainRegion: "Brahmaputra Valley Basin",
      threatSector: "Anil Nagar & Bharalu Rivulet",
      breachCorridor: "Deepor Beel Catchment",
      sampleCritical: "GAU_0020",
      sampleLow: "GAU_0001"
    },
    PAT: {
      rainRegion: "Ganga & Punpun Confluence",
      threatSector: "Rajendra Nagar & Kankarbagh",
      breachCorridor: "Badshahi Nala Sump",
      sampleCritical: "PAT_0030",
      sampleLow: "PAT_0001"
    }
  };

  const currentMeta = cityCatchmentLabels[selectedCity] || cityCatchmentLabels["VJA"];

  // Authentication Gate Check
  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-4 animate-pulse">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>Verifying Command Session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, display full civic authentication portal
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        currentTheme={theme}
        onThemeToggle={handleThemeToggle}
      />
    );
  }

  return (
    <div className={`min-h-screen flex bg-[#090d16] dark:bg-[#090d16] text-slate-100 selection:bg-blue-500 selection:text-white`}>
      {/* Expandable/Collapsible Sidebar + Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={handleToggleSidebar}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        currentTheme={theme}
        onThemeToggle={handleThemeToggle}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Layout Area with responsive sidebar offset */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      }`}>
        {/* Top Header Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedCity={selectedCity}
          onSelectCity={(cityId) => {
            setSelectedCity(cityId);
            setSelectedGridId(null);
            setZoneDetail(null);
          }}
          onLaunchDemo={() => setIsDemoModalOpen(true)}
          healthStatus={healthStatus}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Main Body View */}
        <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
          {/* Tab 1: Dashboard & Live Risk Map (Strict Two-Part Layout) */}
          {(activeTab === "dashboard" || activeTab === "map") && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-6rem)] min-h-[640px]">
              {/* Left Column: Leaflet Canvas Map (~60-65% Desktop Width, Zero Overlays) */}
              <div className="lg:col-span-7 xl:col-span-8 h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-950 relative min-h-[500px]">
                <RiskMap
                  cityId={selectedCity}
                  mapData={mapData}
                  onSelectGrid={handleSelectGrid}
                  selectedGridId={selectedGridId}
                />
              </div>

              {/* Right Column: Consolidated Municipal Information & Control Panel (~35-40% Desktop Width) */}
              <div className="lg:col-span-5 xl:col-span-4 h-full overflow-hidden flex flex-col">
                <DashboardControlPanel
                  cityId={selectedCity}
                  cityName={cityIdToName(selectedCity)}
                  summary={summary}
                  selectedGridId={selectedGridId}
                  zoneDetail={zoneDetail}
                  priorityZones={priorityZones}
                  currentLang={currentLang}
                  onSelectGrid={handleSelectGrid}
                  onClearSelectedGrid={() => {
                    setSelectedGridId(null);
                    setZoneDetail(null);
                  }}
                  onApplyScenarioToMap={(mult) => {
                    if (summary) {
                      fetchCurrentRiskMap(selectedCity, Math.round(summary.current_rainfall_24h_mm * mult))
                        .then((res) => setMapData(res.geojson));
                    }
                  }}
                  onResetScenarioOnMap={() => {
                    fetchCurrentRiskMap(selectedCity)
                      .then((res) => setMapData(res.geojson));
                  }}
                  healthStatus={healthStatus}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Drain Assets Registry */}
          {activeTab === "assets" && (
            <DrainAssets
              currentCityId={selectedCity}
              currentLang={currentLang}
            />
          )}

          {/* Tab 3: Dedicated AI Risk Prediction Tab */}
          {activeTab === "prediction" && (
            <PredictionView
              currentCityId={selectedCity}
              currentLang={currentLang}
            />
          )}

          {/* Tab 4: AI Copilot */}
          {activeTab === "copilot" && (
            <AICopilot
              cityId={selectedCity}
              currentRainfall24h={summary?.current_rainfall_24h_mm || 145.0}
            />
          )}

          {/* Tab 5: What-If Simulator */}
          {activeTab === "whatif" && (
            <WhatIfSimulator
              cityId={selectedCity}
              onApplyScenarioToMap={(mult) => {
                if (summary) {
                  fetchCurrentRiskMap(selectedCity, Math.round(summary.current_rainfall_24h_mm * mult))
                    .then((res) => setMapData(res.geojson));
                }
              }}
            />
          )}

          {/* Tab 6: Alerts & Dispatches */}
          {activeTab === "alerts" && (
            <AlertsManager
              currentCityId={selectedCity}
              currentLang={currentLang}
              currentUser={currentUser}
              onNavigateToMap={(gid) => {
                setActiveTab("map");
                handleSelectGrid(gid);
              }}
            />
          )}

          {/* Tab 7: Priority Response List */}
          {activeTab === "priority" && (
            <PriorityList
              cityId={selectedCity}
              onSelectZone={(gid) => {
                setActiveTab("map");
                handleSelectGrid(gid);
              }}
            />
          )}

          {/* Tab 8: Historical Deluges */}
          {activeTab === "historical" && <HistoricalEvents cityId={selectedCity} />}

          {/* Tab 9: Model Analytics */}
          {activeTab === "analytics" && <ModelAnalytics />}

          {/* Tab 10: Municipal Reports */}
          {activeTab === "reports" && (
            <ReportsGenerator
              currentCityId={selectedCity}
              summary={summary}
              priorityZones={priorityZones}
              currentLang={currentLang}
              currentUser={currentUser}
            />
          )}

          {/* Tab 11: Data & System Health */}
          {activeTab === "health" && <DataHealth />}

          {/* Tab 12: Settings & Admin Profile */}
          {activeTab === "settings" && (
            <SettingsPage
              currentLang={currentLang}
              onLanguageChange={handleLanguageChange}
              currentTheme={theme}
              onThemeToggle={handleThemeToggle}
              currentUser={currentUser}
              onLogout={handleLogout}
              healthStatus={healthStatus}
            />
          )}
        </main>
      </div>

      {/* Zone Detail Sliding Drawer - Mobile Only (on Desktop, details and TreeSHAP are embedded in DashboardControlPanel) */}
      <div className="lg:hidden">
        <ZoneDrawer
          zone={zoneDetail}
          onClose={() => {
            setZoneDetail(null);
            setSelectedGridId(null);
          }}
        />
      </div>

      {/* Jury Demo Guided Walkthrough Modal */}
      <JuryDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        setActiveTab={setActiveTab}
        onSelectGrid={handleSelectGrid}
      />
    </div>
  );
}
