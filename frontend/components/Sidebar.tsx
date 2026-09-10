"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Droplets, 
  Cpu, 
  AlertTriangle, 
  LineChart, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  User, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Globe,
  X,
  SlidersHorizontal,
  Bot
} from "lucide-react";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { UserSession } from "../lib/auth";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  currentTheme: "dark" | "light";
  onThemeToggle: () => void;
  currentUser: UserSession | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  currentLang,
  onLanguageChange,
  currentTheme,
  onThemeToggle,
  currentUser,
  onLogout
}) => {
  const t = getTranslation(currentLang);

  const navigationItems = [
    { id: "dashboard", label: t.navDashboard, icon: LayoutDashboard },
    { id: "map", label: t.navMap, icon: MapIcon },
    { id: "assets", label: t.navAssets, icon: Droplets },
    { id: "prediction", label: t.navPrediction, icon: Cpu },
    { id: "copilot", label: t.navCopilot, icon: Bot },
    { id: "whatif", label: t.navWhatIf, icon: SlidersHorizontal },
    { id: "alerts", label: t.navAlerts, icon: AlertTriangle, badge: "3" },
    { id: "analytics", label: t.navAnalytics, icon: LineChart },
    { id: "reports", label: t.navReports, icon: FileText },
    { id: "settings", label: t.navSettings, icon: Settings },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
          isMobileOpen 
            ? "translate-x-0 w-72" 
            : "-translate-x-full lg:translate-x-0 " + (isCollapsed ? "w-20" : "w-64")
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="truncate">
                <div className="font-black text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
                  <span>{t.appName}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold">AI</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Urban Command Center</div>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group relative ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
                title={isCollapsed && !isMobileOpen ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400"}`} />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {item.badge && (!isCollapsed || isMobileOpen) && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer — Profile, Controls & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          {/* Active Admin Profile Card */}
          {(!isCollapsed || isMobileOpen) ? (
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {currentUser?.name || "Gaurav"}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium truncate">
                    {currentUser?.role || t.administratorRole}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Utility Row (Theme & Language) */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Language Picker */}
              <div className="flex items-center bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                <Globe className="w-3 h-3 text-slate-400 mr-1" />
                <select
                  value={currentLang}
                  onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-slate-300 font-medium cursor-pointer focus:outline-none"
                >
                  <option value="en" className="bg-slate-900 text-white">EN</option>
                  <option value="hi" className="bg-slate-900 text-white">हिंदी</option>
                  <option value="te" className="bg-slate-900 text-white">తెలుగు</option>
                </select>
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={onThemeToggle}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Toggle Light / Dark"
              >
                {currentTheme === "dark" ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
