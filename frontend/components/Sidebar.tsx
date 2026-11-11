"use client";

import {
  LayoutDashboard,
  Droplets,
  AlertTriangle,
  LineChart,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  History,
  Database,
  X,
} from "lucide-react";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  currentLang: SupportedLanguage;
  alertCount: number;
}


export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  currentLang,
  alertCount,
}: SidebarProps) {
  const t = getTranslation(currentLang);
  const showLabels = !isCollapsed || isMobileOpen;

  const navigationItems = [
    { id: "dashboard", label: t.navDashboard, icon: LayoutDashboard },
    { id: "assets", label: t.navAssets, icon: Droplets },
    { id: "alerts", label: t.navAlerts, icon: AlertTriangle },
    { id: "priority", label: t.navPriority, icon: ListOrdered },
    { id: "historical", label: t.navHistorical, icon: History },
    { id: "analytics", label: t.navAnalytics, icon: LineChart },
    { id: "sources", label: t.navSources || "Data sources", icon: Database },
    { id: "reports", label: t.navReports, icon: FileText },
    { id: "settings", label: t.navSettings, icon: Settings },
  ];

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[#12262A]/40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#D5E2E0] bg-[#FBFDFC] transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isMobileOpen ? "w-72 translate-x-0" : "-translate-x-full lg:translate-x-0",
          !isMobileOpen && (isCollapsed ? "lg:w-[4.5rem]" : "lg:w-64")
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-[#D5E2E0] px-3">
          {showLabels && <span className="px-2 text-sm font-semibold tracking-tight">DrainSense</span>}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium",
                  active ? "bg-[#115E59] text-[#FBFDFC]" : "text-[#4C5E62] hover:bg-[#E6F3F1] hover:text-[#12262A]"
                )}
                title={showLabels ? undefined : item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {showLabels && <span className="truncate">{item.label}</span>}
                {item.id === "alerts" && alertCount > 0 && showLabels && (
                  <span className="ml-auto rounded-full bg-[#B42318] px-1.5 text-[10px] font-semibold text-white">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
