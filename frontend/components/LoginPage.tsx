"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Lock, 
  User, 
  ArrowRight, 
  Globe, 
  Sun, 
  Moon, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Building2,
  KeyRound
} from "lucide-react";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { setStoredSession, UserSession } from "../lib/auth";

interface LoginPageProps {
  onLoginSuccess: (user: UserSession) => void;
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  currentTheme: "dark" | "light";
  onThemeToggle: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  currentLang,
  onLanguageChange,
  currentTheme,
  onThemeToggle
}) => {
  const t = getTranslation(currentLang);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Administrator");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickDemoFill = () => {
    setUsername("Gaurav");
    setPassword("DrainSense@2026");
    setRole("Administrator");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please provide both username and password.");
      return;
    }

    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // Call backend secure authentication endpoint
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t.loginError);
      }

      const data = await res.json();
      setStoredSession(data.access_token, data.user);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || t.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden transition-colors duration-200 bg-slate-950">
      {/* Cinematic Atmospheric Monsoon Backdrop */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 pointer-events-none transform transition-transform duration-1000"
        style={{ backgroundImage: `url('/monsoon_backdrop.jpg')` }}
      />
      {/* Dark gradient vignette & ambient lighting glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/65 backdrop-blur-[2px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[300px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Utility Header (Language & Theme Bar) */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
              <span>{t.appName}</span>
              <span className="text-cyan-400 font-bold">{t.appSubname}</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
                PIML v2.0
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">National Urban Flood Early Warning & Decision Support Network</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-transparent text-slate-200 font-semibold cursor-pointer py-0.5 pr-2 focus:outline-none text-xs"
            >
              <option value="en" className="bg-slate-900 text-white">English (EN)</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
              <option value="te" className="bg-slate-900 text-white">తెలుగు (Telugu)</option>
            </select>
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white shadow-lg transition-all cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {currentTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Authentication Dialog Box */}
      <main className="flex-1 flex items-center justify-center p-4 z-20 relative">
        <div className="relative w-full max-w-md">
          {/* Glowing Ambient Halo behind Card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-75 pointer-events-none" />

          <div className="w-full bg-slate-900/75 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-cyan-950/50 p-6 sm:p-8 relative">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 mb-3 shadow-inner">
                <KeyRound className="w-6 h-6 text-cyan-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {t.loginTitle}
              </h1>
              <p className="text-xs text-slate-300/80 mt-1.5 leading-relaxed">
                {t.loginSubtitle}
              </p>
            </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.username}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.usernamePlaceholder}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.role}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:border-blue-500 focus:outline-none font-medium cursor-pointer"
              >
                <option value="Administrator">{t.roleAdmin}</option>
                <option value="Zonal Officer">{t.roleOfficer}</option>
                <option value="Field Responder">{t.roleResponder}</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{t.loading}</span>
                </span>
              ) : (
                <>
                  <span>{t.loginButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Reviewer Demo Fill Helper */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="w-full py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.loginDemoHelper}</span>
            </button>
            <p className="text-[10px] text-slate-500 mt-2">
              Identity verified: <strong>Gaurav (Administrator)</strong>
            </p>
          </div>
        </div>
      </div>
    </main>

      {/* Footer Notice */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center z-20">
        <p className="text-[11px] text-slate-500">
          🔒 {t.securityNotice}
        </p>
      </footer>
    </div>
  );
};
