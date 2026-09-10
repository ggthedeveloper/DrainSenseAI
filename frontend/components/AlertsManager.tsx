"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Send, 
  MapPin, 
  RefreshCw, 
  UserCheck, 
  Activity,
  Radio,
  Filter
} from "lucide-react";
import { AlertItem } from "../types";
import { fetchAlerts, acknowledgeAlert, resolveAlert } from "../lib/api";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { UserSession } from "../lib/auth";

interface AlertsManagerProps {
  currentCityId?: string;
  currentLang: SupportedLanguage;
  currentUser: UserSession | null;
  onNavigateToMap?: (gridId: string) => void;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  currentCityId,
  currentLang,
  currentUser,
  onNavigateToMap
}) => {
  const t = getTranslation(currentLang);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [currentCityId]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts(currentCityId);
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    setActionInProgress(alertId);
    try {
      const officerName = currentUser?.name ? `${currentUser.name} (${currentUser.role || "Administrator"})` : "Gaurav (Administrator)";
      const res = await acknowledgeAlert(alertId, officerName);
      if (res.success && res.alert) {
        setAlerts((prev) => prev.map((a) => a.alert_id === alertId ? (res.alert as AlertItem) : a));
      } else {
        // Optimistic update
        setAlerts((prev) => prev.map((a) => a.alert_id === alertId ? {
          ...a,
          status: "ACKNOWLEDGED",
          acknowledged_by: officerName,
          acknowledged_at: new Date().toISOString()
        } : a));
      }
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    setActionInProgress(alertId);
    try {
      const res = await resolveAlert(alertId);
      if (res.success && res.alert) {
        setAlerts((prev) => prev.map((a) => a.alert_id === alertId ? (res.alert as AlertItem) : a));
      } else {
        // Optimistic update
        setAlerts((prev) => prev.map((a) => a.alert_id === alertId ? {
          ...a,
          status: "RESOLVED"
        } : a));
      }
    } catch (err) {
      console.error("Error resolving alert:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (statusFilter === "ACTIVE") return alert.status === "ACTIVE";
    if (statusFilter === "ACKNOWLEDGED") return alert.status === "ACKNOWLEDGED";
    if (statusFilter === "RESOLVED") return alert.status === "RESOLVED";
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;
  const ackCount = alerts.filter((a) => a.status === "ACKNOWLEDGED").length;
  const resolvedCount = alerts.filter((a) => a.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
                {t.alertsTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.alertsSubtitle}
              </p>
            </div>
          </div>

          {/* Alert Status Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === "ALL"
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                  : "bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white"
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                statusFilter === "ACTIVE"
                  ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/20"
                  : "bg-rose-950/30 text-rose-400 border-rose-900/40 hover:bg-rose-900/40"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("ACKNOWLEDGED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === "ACKNOWLEDGED"
                  ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-amber-950/30 text-amber-400 border-amber-900/40 hover:bg-amber-900/40"
              }`}
            >
              Acknowledged ({ackCount})
            </button>
            <button
              onClick={() => setStatusFilter("RESOLVED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === "RESOLVED"
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                  : "bg-emerald-950/30 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/40"
              }`}
            >
              Resolved ({resolvedCount})
            </button>
            <button
              onClick={loadAlerts}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer ml-1"
              title={t.refresh}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
            <span className="text-xs font-mono">{t.loading}</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
            {t.noData}
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL";
            const isHigh = alert.severity === "HIGH";
            const isElevated = alert.severity === "ELEVATED";
            const isAct = alert.status === "ACTIVE";
            const isAck = alert.status === "ACKNOWLEDGED";
            const isRes = alert.status === "RESOLVED";

            return (
              <div 
                key={alert.alert_id}
                className={`p-5 rounded-2xl border backdrop-blur-xl transition-all shadow-lg ${
                  isAct
                    ? isCritical 
                      ? "bg-rose-950/20 border-rose-800/60 hover:border-rose-600/80" 
                      : "bg-amber-950/20 border-amber-800/60 hover:border-amber-600/80"
                    : isAck
                    ? "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                    : "bg-slate-950/40 border-slate-900 opacity-80"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Alert Content */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                        isCritical
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : isHigh
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      }`}>
                        {alert.severity} PRIORITY
                      </span>

                      <span className="font-mono text-xs text-slate-400 font-bold">
                        {alert.alert_id}
                      </span>

                      <span className="text-slate-600">•</span>

                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {alert.zone_name} ({alert.city_id})
                      </span>

                      <span className="text-slate-600">•</span>

                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-100 tracking-tight">
                      {alert.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {alert.message}
                    </p>

                    {/* Trigger Metric Pill */}
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono text-slate-300">
                      <Activity className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.triggerCondition}: </span>
                      <span className="text-rose-300 font-bold">{alert.trigger_metric}</span>
                    </div>

                    {/* Acknowledged Sign-off stamp if present */}
                    {alert.acknowledged_by && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium pt-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.acknowledgedBy} {alert.acknowledged_by}</span>
                        {alert.acknowledged_at && (
                          <span className="text-slate-500 font-mono">
                            at {new Date(alert.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-2 shrink-0 md:w-44">
                    {isAct && (
                      <button
                        onClick={() => handleAcknowledge(alert.alert_id)}
                        disabled={actionInProgress === alert.alert_id}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{actionInProgress === alert.alert_id ? "Dispatching..." : t.acknowledgeBtn}</span>
                      </button>
                    )}

                    {!isRes && (
                      <button
                        onClick={() => handleResolve(alert.alert_id)}
                        disabled={actionInProgress === alert.alert_id}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-700 hover:text-white text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.resolveBtn}</span>
                      </button>
                    )}

                    {isRes && (
                      <div className="px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Incident Resolved</span>
                      </div>
                    )}

                    {onNavigateToMap && (
                      <button
                        onClick={() => onNavigateToMap(alert.grid_id)}
                        className="w-full py-1.5 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-[11px] font-medium border border-slate-800 transition-all text-center cursor-pointer"
                      >
                        Inspect on Map ({alert.grid_id})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
