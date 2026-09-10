"use client";

import React, { useState } from "react";
import { 
  Settings, 
  User, 
  ShieldCheck, 
  Globe, 
  Moon, 
  Sun, 
  Activity, 
  Cpu, 
  Database, 
  Server, 
  LogOut, 
  CheckCircle2,
  HardDrive,
  BadgeCheck
} from "lucide-react";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { UserSession } from "../lib/auth";

interface SettingsPageProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  currentTheme: "dark" | "light";
  onThemeToggle: () => void;
  currentUser: UserSession | null;
  onLogout: () => void;
  healthStatus?: { status: string; model_version: string };
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentLang,
  onLanguageChange,
  currentTheme,
  onThemeToggle,
  currentUser,
  onLogout,
  healthStatus
}) => {
  const t = getTranslation(currentLang);
  const [saveToast, setSaveToast] = useState(false);

  const handleSavePreferences = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
              {t.settingsTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.settingsSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Officer Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center gap-3.5 pb-5 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 ring-2 ring-white/10">
                {currentUser?.name?.[0] || "G"}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-extrabold text-slate-100">
                    {currentUser?.name || "Gaurav"}
                  </h3>
                  <BadgeCheck className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xs text-blue-400 font-semibold font-mono">
                  {currentUser?.role || t.administratorRole}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Session
                </div>
              </div>
            </div>

            {/* Officer Details List */}
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Username</span>
                <span className="text-slate-200 font-mono font-semibold">{currentUser?.username || "gaurav"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Badge ID</span>
                <span className="text-slate-200 font-mono">{currentUser?.badge_id || "MUNI-ADM-001"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-200 text-right">{currentUser?.department || "Stormwater Operations"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Jurisdiction</span>
                <span className="text-slate-200">12 Flood-Prone Indian Catchments</span>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={onLogout}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 hover:text-rose-100 font-bold text-xs flex items-center justify-center gap-2 border border-rose-900/50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Preferences & Diagnostics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preferences Card */}
          <div className="bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-4 h-4 text-blue-400" />
              Regional & Display Configuration
            </h3>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                {t.languageSettings}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => onLanguageChange("en")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    currentLang === "en"
                      ? "bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/50"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-sm font-extrabold">English</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Municipal Standard</div>
                </button>

                <button
                  type="button"
                  onClick={() => onLanguageChange("hi")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    currentLang === "hi"
                      ? "bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/50"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-sm font-extrabold">हिंदी (Hindi)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">राष्ट्रीय राजभाषा</div>
                </button>

                <button
                  type="button"
                  onClick={() => onLanguageChange("te")}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    currentLang === "te"
                      ? "bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/50"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-sm font-extrabold">తెలుగు (Telugu)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ఆంధ్రప్రదేశ్ / తెలంగాణ</div>
                </button>
              </div>
            </div>

            {/* Theme Mode Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-300">
                {t.themeSettings}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onThemeToggle}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    currentTheme === "dark"
                      ? "bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/50"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Moon className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-xs font-bold">{t.themeDark}</div>
                    <div className="text-[10px] text-slate-400">High contrast for dark command control rooms</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onThemeToggle}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    currentTheme === "light"
                      ? "bg-blue-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/50"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold">{t.themeLight}</div>
                    <div className="text-[10px] text-slate-400">Clean daylight civic palette for municipal audits</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveToast ? "Preferences Saved!" : t.save}</span>
              </button>
            </div>
          </div>

          {/* Model & System Diagnostics Card */}
          <div className="bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-4 h-4 text-emerald-400" />
              {t.systemDiagnostics}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">{t.modelStatus}</div>
                <div className="text-slate-200 font-mono font-bold">{t.modelEngine}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Calibrated Probabilities & TreeSHAP Active
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Grid Discretization</div>
                <div className="text-slate-200 font-mono font-bold">{t.totalMonitoredCells}</div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Across 12 Flood-Prone Indian Catchments
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Telemetry Pipeline</div>
                <div className="text-slate-200 font-mono font-bold">{t.telemetrySource}</div>
                <div className="text-[10px] text-blue-400 font-medium">
                  Open-Meteo REST API (Hourly Updates, No Key Needed)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Terrain Model</div>
                <div className="text-slate-200 font-mono font-bold">{t.demSource}</div>
                <div className="text-[10px] text-slate-400 font-medium">
                  IS 17387:2020 Compliance (Flow Acc, Slopes, Sump Depressions)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
