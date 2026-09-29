"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Layers, 
  Activity, 
  Waves, 
  Cpu, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  Building2, 
  CheckCircle2, 
  Zap, 
  BarChart3, 
  Database, 
  MapPin, 
  SlidersHorizontal, 
  Truck, 
  Lock, 
  User, 
  FileText, 
  ChevronRight,
  Sun,
  Moon,
  Clock,
  Compass,
  KeyRound,
  AlertCircle
} from "lucide-react";
import { SupportedLanguage, getTranslation } from "../lib/i18n";
import { UserSession, setStoredSession } from "../lib/auth";

interface LandingPageProps {
  onEnterDashboard: (user: UserSession) => void;
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  currentTheme: "dark" | "light";
  onThemeToggle: () => void;
}

const METRO_BASINS = [
  { id: "VJA", name: "Vijayawada / Amaravati", state: "Andhra Pradesh", river: "Krishna & Budameru Corridor", grids: 1420, risk: "CRITICAL" },
  { id: "CHE", name: "Chennai", state: "Tamil Nadu", river: "Adyar, Cooum & Buckingham Canal", grids: 2150, risk: "HIGH" },
  { id: "BOM", name: "Mumbai", state: "Maharashtra", river: "Mithi River & Coastal Subways", grids: 2480, risk: "HIGH" },
  { id: "BLR", name: "Bengaluru", state: "Karnataka", river: "Bellandur & Varthur Lake Valley", grids: 1980, risk: "ELEVATED" },
  { id: "DEL", name: "Delhi NCR", state: "Delhi", river: "Yamuna Floodplain & Najafgarh Drain", grids: 2890, risk: "HIGH" },
  { id: "HYD", name: "Hyderabad", state: "Telangana", river: "Musi River & Hussain Sagar Weir", grids: 1840, risk: "ELEVATED" }
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterDashboard,
  currentLang,
  onLanguageChange,
  currentTheme,
  onThemeToggle
}) => {
  const t = getTranslation(currentLang);

  // Authentication Modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [username, setUsername] = useState("Gaurav");
  const [password, setPassword] = useState("DrainSense@2026");
  const [role, setRole] = useState("Administrator");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick launch default administrator session
  const handleQuickLaunch = () => {
    const defaultUser: UserSession = {
      name: "Gaurav",
      username: "gaurav",
      role: "Administrator",
      email: "gaurav@drainsense.gov.in",
      department: "National Disaster Early Warning Unit",
      badge_id: "DS-CMD-2026"
    };
    setStoredSession("drainsense_demo_token_2026", defaultUser);
    onEnterDashboard(defaultUser);
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError("Please provide username and password.");
      return;
    }

    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
      onEnterDashboard(data.user);
    } catch (err: any) {
      setError(err.message || t.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 relative overflow-x-hidden selection:bg-cyan-500 selection:text-white font-sans">
      {/* 1. CINEMATIC FULL-BLEED MONSOON BACKDROP */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none scale-105 opacity-35 z-0 transform transition-transform duration-1000"
        style={{ backgroundImage: `url('/monsoon_backdrop.jpg')` }}
      />
      
      {/* 2. ATMOSPHERIC GRADIENTS & AMBIENT NEON GLOW */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#060911]/85 via-[#060911]/70 to-[#060911]/95 pointer-events-none z-0" />
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-indigo-600/15 rounded-full blur-[170px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[550px] h-[350px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/3 left-0 w-[450px] h-[350px] bg-blue-700/10 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* 3. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-950/70 border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/25 ring-1 ring-white/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                <span>DRAINSENSE</span>
                <span className="text-cyan-400 font-bold">INDIA</span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                  MAJOR PROJECT • GROUP 02
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Physics-Informed Urban Hydro-AI Decision Support System
              </div>
            </div>
          </div>

          {/* Right Controls & CTAs */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="hidden md:flex items-center bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-transparent text-slate-200 font-semibold cursor-pointer focus:outline-none text-xs"
              >
                <option value="en" className="bg-slate-900 text-white">English (EN)</option>
                <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
                <option value="te" className="bg-slate-900 text-white">తెలుగు (Telugu)</option>
              </select>
            </div>

            {/* Sign In Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer hidden sm:flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Officer Login</span>
            </button>

            {/* Direct Launch Button */}
            <button
              type="button"
              onClick={handleQuickLaunch}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/30 ring-1 ring-white/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <span>Launch Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 4. HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 text-center">
        {/* Live Status Telemetry Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-mono font-bold text-cyan-300 tracking-wide uppercase">
            National Telemetry Active • 18,304 Urban Cells Monitored
          </span>
        </div>

        {/* Cinematic Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08]">
          Urban Waterlogging Intelligence{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Powered by Physics-Informed AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-300/90 max-w-3xl mx-auto leading-relaxed font-normal">
          A publication-grade municipal decision support platform integrating{" "}
          <strong className="text-white font-semibold">Topological Flow Cascade Graphs (DAHG)</strong>,{" "}
          <strong className="text-white font-semibold">USDA-NRCS SCS-CN Mass-Balance Guardrails</strong>, and{" "}
          <strong className="text-white font-semibold">Operations-Research Fleet Dispatch</strong> across 12 high-risk Indian metropolitan river basins.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleQuickLaunch}
            className="px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-2xl shadow-cyan-500/40 ring-1 ring-white/20 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 group"
          >
            <span>Enter Live Command Center</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#novelties"
            className="px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-xl border border-white/10 text-slate-200 hover:text-white font-bold text-sm sm:text-base shadow-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Explore Scientific Novelties</span>
          </a>
        </div>

        {/* Live Metrics Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-xl text-left">
            <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">18,304</div>
            <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">Spatial Cells</div>
            <div className="text-[11px] text-slate-400 mt-0.5">500m × 500m micro-resolution</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-xl text-left">
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-400">12 Metros</div>
            <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">Indian River Basins</div>
            <div className="text-[11px] text-slate-400 mt-0.5">AP, TN, MH, KA, DL, TG, WB...</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-xl text-left">
            <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-400">&lt; 15 ms</div>
            <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">Inference Latency</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Sub-second emergency sizing</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-xl text-left">
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">NDMA Form D-4</div>
            <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">Official Directive</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Automated incident action memo</div>
          </div>
        </div>
      </section>

      {/* 5. SCIENTIFIC NOVELTIES SHOWCASE */}
      <section id="novelties" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Research &amp; Engineering Contributions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Four Core Hydro-AI Novelties
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Formulated to bridge the divide between theoretical open-channel hydrodynamics and sub-second municipal disaster dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Novelty 1 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/40 shadow-2xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
              <Waves className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Novelty 1 • Hydrodynamics</div>
            <h3 className="text-xl font-bold text-white mt-1">
              Topological Cascade Inundation Graph (DAHG)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300/90 mt-2.5 leading-relaxed">
              Models overland downhill flood wave routing across 500m cells using D8 steepest-descent gradients and Manning’s open-channel equation [v = (1/n) · R^(2/3) · S^(1/2)]. Computes precise arrival lag times (tau_lag) from uphill cloudbursts to low-lying terminal outfalls.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Equation: Manning + D8 Flow</span>
              <span className="text-cyan-400 font-bold">Live Flow Routing Active</span>
            </div>
          </div>

          {/* Novelty 2 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 shadow-2xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">Novelty 2 • Physics-Informed ML</div>
            <h3 className="text-xl font-bold text-white mt-1">
              SCS-CN Mass-Balance Guardrail (PIML)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300/90 mt-2.5 leading-relaxed">
              Audits statistical XGBoost risk outputs against the USDA-NRCS Curve Number water-balance formulation [Q = (P - Ia)^2 / (P - Ia + S)]. Derives the continuous Hydrological Concordance Index (HCI) to detect structural backwater anomalies and prevent statistical hallucinations.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Metric: Concordance Index (HCI)</span>
              <span className="text-blue-400 font-bold">Physics Certified</span>
            </div>
          </div>

          {/* Novelty 3 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 hover:border-indigo-500/40 shadow-2xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">Novelty 3 • Temporal Forecasting</div>
            <h3 className="text-xl font-bold text-white mt-1">
              Multi-Horizon Temporal Nowcaster (T+0h to T+6h)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300/90 mt-2.5 leading-relaxed">
              Projects forward deluge wave crests across five discrete operational horizons using IMD convective storm hyetographs. Dynamic map timeline scrubbers simulate runoff onset, peak deluge crest, downstream accumulation, and receding drainage sump retention.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Horizons: T+0h, T+1h, T+2h, T+4h, T+6h</span>
              <span className="text-indigo-400 font-bold">5 Stages Modeled</span>
            </div>
          </div>

          {/* Novelty 4 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 hover:border-emerald-500/40 shadow-2xl transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Novelty 4 • Operations Research</div>
            <h3 className="text-xl font-bold text-white mt-1">
              Autonomous Municipal Dispatch Optimizer
            </h3>
            <p className="text-xs sm:text-sm text-slate-300/90 mt-2.5 leading-relaxed">
              Solves an integer programming model matching municipal heavy pumps (100+ HP), super-suckers, boat squads, and sandbag units to critical sectors. Formats ready-to-sign official NDMA Incident Action Memorandums with fuel, capacity, and population-shielded KPIs.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Protocol: NDMA Form D-4 Standard</span>
              <span className="text-emerald-400 font-bold">1-Click PDF Memo</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MONITORED METROPOLITAN BASINS */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1.5">
            Geographic Coverage
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            12 Indian Metropolitan Basins
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Deterministic 500m coordinate grid boundaries calibrated to high-risk chronic waterlogging corridors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {METRO_BASINS.map((b) => (
            <div 
              key={b.id}
              onClick={handleQuickLaunch}
              className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                  {b.id}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  b.risk === "CRITICAL" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {b.risk}
                </span>
              </div>
              <div className="text-base font-bold text-white mt-2 group-hover:text-cyan-300 transition-colors">
                {b.name}
              </div>
              <div className="text-xs text-slate-400">{b.state}</div>
              <div className="text-[11px] text-cyan-400/90 font-mono mt-2 truncate">
                🌊 {b.river}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>{b.grids} Grids Monitored</span>
                <span className="text-cyan-400 flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
                  Inspect <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. BOTTOM CALL TO ACTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600" />
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Ready to Explore the Command Center?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Experience sub-second spatial flood inferences, interactive topological cascade routing, and autonomous dispatch directives on live Google Maps.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleQuickLaunch}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-500/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all cursor-pointer"
            >
              Municipal Sign In
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/90 backdrop-blur-2xl py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <strong className="text-white">DrainSense India</strong> • Major Project Group Number 02 • Academic Defense 2026
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>National Disaster Management Guidelines (NDMA 2010)</span>
            <span>•</span>
            <span>Open-Meteo &amp; NASA IMERG</span>
          </div>
        </div>
      </footer>

      {/* 9. AUTHENTICATION MODAL DIALOG */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Municipal Authentication</h3>
                  <p className="text-[10px] text-slate-400">National Flood Command Network</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCustomLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  <option value="Administrator">Municipal Administrator</option>
                  <option value="Zonal Officer">Zonal Engineer</option>
                  <option value="Field Responder">Field Responder</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {loading ? "Authenticating..." : "Authorize Session"}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={handleQuickLaunch}
                className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Evaluator Auto-Login</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
