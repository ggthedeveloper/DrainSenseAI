"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { askAICopilot } from "../lib/api";
import { AICopilotResponse } from "../types";
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  Wrench,
  Truck,
  CheckCircle2,
  Activity,
  Building2,
  RefreshCw,
  Trash2,
  AlertCircle,
  Zap,
  Waves,
  Users,
  Radio,
  Hospital,
  Construction,
  Key,
  Settings2,
  Copy,
  Check,
  Cpu,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  MessageSquare
} from "lucide-react";

interface AICopilotProps {
  cityId: string;
  currentRainfall24h?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AICopilotResponse;
  timestamp: string;
}

const CITY_NAME_LOOKUP: Record<string, string> = {
  VJA: "Vijayawada / Amaravati",
  CHE: "Chennai",
  BOM: "Mumbai",
  BLR: "Bengaluru",
  DEL: "Delhi NCR",
  HYD: "Hyderabad",
  CCU: "Kolkata",
  AMD: "Ahmedabad",
  PNQ: "Pune",
  COK: "Kochi",
  GAU: "Guwahati",
  PAT: "Patna",
};

const SAMPLE_PROMPTS = [
  { label: "Pump Staging", query: "What is the emergency pump deployment plan for the next 6 hours?", icon: Waves },
  { label: "Road & Underpass Closures", query: "Which critical underpasses and arterial roads must be barricaded right now?", icon: Construction },
  { label: "Citizen Safety Advisory", query: "Draft an urgent citizen safety and evacuation notice for low-lying residential wards.", icon: Users },
  { label: "Sluice & Backflow Risk", query: "Evaluate backflow vulnerability and flap valve closures along primary river outfalls.", icon: Radio },
  { label: "Hospital Corridors", query: "What emergency protocols are required for hospitals and ambulance approach corridors?", icon: Hospital },
  { label: "Power Grid Isolation", query: "Electrical grid safety — should ground-mounted transformers in flooded sectors be isolated?", icon: Zap },
];

export const AICopilot: React.FC<AICopilotProps> = ({ cityId, currentRainfall24h = 145.0 }) => {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Model Configuration
  const [aiProvider, setAiProvider] = useState<string>("auto");
  const [apiKey, setApiKey] = useState<string>("");
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const cityName = CITY_NAME_LOOKUP[cityId] || cityId;
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef<string>("");

  // Load saved AI config from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem("drainsense_ai_key") || "";
    const savedProvider = localStorage.getItem("drainsense_ai_provider") || "auto";
    setApiKey(savedKey);
    setKeyInput(savedKey);
    setAiProvider(savedProvider);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const saveAiConfig = (provider: string, key: string) => {
    setAiProvider(provider);
    setApiKey(key);
    localStorage.setItem("drainsense_ai_provider", provider);
    localStorage.setItem("drainsense_ai_key", key);
    setIsKeyModalOpen(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSection = (msgId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleRunQuery = useCallback(
    async (customQuery?: string) => {
      const q = (customQuery || query).trim();
      if (!q) return;

      const reqId = `${Date.now()}-${Math.random()}`;
      requestIdRef.current = reqId;

      const userMsg: ChatMessage = {
        id: `user-${reqId}`,
        role: "user",
        content: q,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setErrorMsg(null);
      if (!customQuery) setQuery("");

      // Prepare conversation history for backend
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      try {
        const res = await askAICopilot(
          cityId,
          q,
          currentRainfall24h,
          apiKey,
          aiProvider,
          history
        );

        if (requestIdRef.current !== reqId) return;

        const assistantMsg: ChatMessage = {
          id: `assistant-${reqId}`,
          role: "assistant",
          content: res.conversational_answer || res.ai_situation_assessment,
          response: res,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e: any) {
        if (requestIdRef.current !== reqId) return;
        const msg =
          e?.message?.includes("422")
            ? "Please enter a specific question before dispatching."
            : e?.message || "AI Copilot is temporarily unavailable. Check backend connection.";
        setErrorMsg(msg);
      } finally {
        if (requestIdRef.current === reqId) setLoading(false);
      }
    },
    [cityId, currentRainfall24h, query, apiKey, aiProvider, messages]
  );

  // Auto-load initial briefing when city changes
  useEffect(() => {
    setMessages([]);
    setErrorMsg(null);
    handleRunQuery("Generate comprehensive urban flood situational assessment, tactical dewatering plan, and priority alert dispatch.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  // Format simple markdown into clean HTML elements
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-2 text-sm text-slate-200 leading-relaxed font-normal">
        {lines.map((line, i) => {
          if (line.startsWith("### ")) {
            return (
              <h3 key={i} className="text-base font-bold text-blue-300 mt-3 mb-1.5 flex items-center gap-2">
                {line.replace("### ", "")}
              </h3>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={i} className="text-lg font-extrabold text-white mt-4 mb-2">
                {line.replace("## ", "")}
              </h2>
            );
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            const content = line.substring(2);
            return (
              <li key={i} className="ml-4 list-disc text-slate-300 my-0.5">
                <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
              </li>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^\d+\./)?.[0];
            const content = line.replace(/^\d+\.\s/, "");
            return (
              <div key={i} className="flex items-start gap-2 ml-1 my-1">
                <span className="text-blue-400 font-bold shrink-0">{num}</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
              </div>
            );
          }
          if (line.trim() === "") {
            return <div key={i} className="h-1.5" />;
          }
          return (
            <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-semibold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em class='text-blue-200'>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-xs'>$1</code>");
  };

  return (
    <div className="space-y-5">
      {/* Top Incident Commander Bar */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-blue-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              Autonomous Flood Incident Copilot • {cityName}
            </div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2.5 tracking-tight">
              DrainSense AI Response Intelligence
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time conversational flood AI synthesising ERA5/IMD storm telemetry, NASA SRTM 30m terrain topography, SCS Curve Number runoff mechanics, and calibrated XGBoost risk grids.
            </p>
          </div>

          {/* AI Provider & Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Model Badge */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-left">
                <div className="text-[9px] text-slate-500 uppercase font-bold">Active Engine</div>
                <div className="font-semibold text-slate-200">
                  {apiKey ? (apiKey.startsWith("gsk_") ? "Groq Llama 3.3" : "Gemini 1.5 Flash") : "DrainSense Neural RAG"}
                </div>
              </div>
            </div>

            {/* Configure Key Button */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Connect Gemini or Groq Free Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{apiKey ? "AI Key Configured" : "Connect Free LLM Key"}</span>
            </button>

            {/* Clear Chat */}
            {messages.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Reset conversation history?")) {
                    setMessages([]);
                    setErrorMsg(null);
                  }
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 text-slate-400 hover:text-rose-400 transition text-xs cursor-pointer"
                title="Reset conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Refresh Assessment */}
            <button
              onClick={() =>
                handleRunQuery("Refresh comprehensive situational assessment and tactical asset deployment.")
              }
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Re-Assess
            </button>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Engine Configuration</h3>
                  <p className="text-[11px] text-slate-400">Choose your AI provider or enter a free API key</p>
                </div>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  AI Provider
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="auto">Auto (Auto-detect from Key / Fallback to Neural RAG)</option>
                  <option value="gemini">Google Gemini (Gemini 1.5/2.0 Flash)</option>
                  <option value="groq">Groq Cloud (Llama 3.3 70B Versatile)</option>
                  <option value="local_rag">DrainSense Neural RAG (Built-in Zero-Key Local AI)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  API Key (Optional)
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your free Google Gemini (AIza...) or Groq (gsk_...) key"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:border-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  💡 <strong>100% Free &amp; Safe:</strong> Keys are stored only in your local browser storage. You can get free keys with no credit card at{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Groq Cloud <ExternalLink className="w-2.5 h-2.5" />
                  </a>.
                  If left blank, our built-in <strong>DrainSense Neural RAG Engine</strong> runs locally with zero keys needed!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              {apiKey && (
                <button
                  onClick={() => saveAiConfig("local_rag", "")}
                  className="px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/20 rounded-xl transition"
                >
                  Remove Key
                </button>
              )}
              <button
                onClick={() => saveAiConfig(aiProvider, keyInput.trim())}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
              >
                Save AI Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Query Dispatch Bar */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!query.trim()) {
              setErrorMsg("Please type a question before dispatching.");
              inputRef.current?.focus();
              return;
            }
            handleRunQuery();
          }}
          className="flex gap-2.5"
        >
          <div className="relative flex-1">
            <Bot className="w-4 h-4 text-blue-400 absolute left-3.5 top-3.5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={`Ask DrainSense AI about ${cityName} (e.g. 'Are underpasses safe?', 'Pump deployment plan', 'विजयवाड़ा में क्या करें?')...`}
              className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition shadow-inner font-medium"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Dispatch</span>
          </button>
        </form>

        {/* Error message banner */}
        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-800/70">
          <span className="text-[11px] text-slate-500 font-bold py-1.5 self-center uppercase tracking-wider">
            Quick Topics:
          </span>
          {SAMPLE_PROMPTS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setQuery(p.query);
                  handleRunQuery(p.query);
                }}
                disabled={loading}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-blue-300 hover:border-blue-700/50 hover:bg-slate-900 transition cursor-pointer disabled:opacity-50 font-medium"
              >
                <Icon className="w-3.5 h-3.5 text-blue-400" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Conversation Stream */}
      <div className="space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const res = msg.response;
          const isExpanded = expandedSections[msg.id];

          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-2xl bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-lg">
                  <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> Field Command Query
                    </span>
                    <span className="text-slate-500 font-mono font-normal">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-100 font-semibold leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          }

          // Assistant Response Card
          return (
            <div key={msg.id} className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Assistant Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <span>DrainSense AI Copilot</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold font-mono">
                          {res?.model_provider || "DrainSense Neural RAG"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{cityName} Catchment</span>
                        <span>•</span>
                        <span className="text-slate-500 font-mono">{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center gap-2">
                    {res?.risk_level_summary && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                        {res.risk_level_summary}
                      </span>
                    )}
                    {res?.model_confidence_score && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 font-mono">
                        {(res.model_confidence_score * 100).toFixed(0)}% Confidence
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Conversational Markdown Answer */}
                <div className="prose prose-invert max-w-none">
                  {renderMarkdown(msg.content)}
                </div>

                {/* Structured Breakdown Toggle */}
                {res && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => toggleSection(msg.id)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800/60 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-blue-400">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Tactical Incident Breakdown &amp; Asset Protocols</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 animate-in fade-in">
                        {/* Tactical Orders */}
                        <div className="p-4 rounded-xl bg-slate-950/90 border border-blue-900/40 space-y-2.5">
                          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5" /> Dewatering Orders
                          </div>
                          <div className="space-y-1.5">
                            {res.tactical_recommendations.map((t, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                                <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                                <span>{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Critical Infrastructure */}
                        <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-900/40 space-y-2.5">
                          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" /> Infrastructure Threat
                          </div>
                          <div className="space-y-1.5">
                            {res.critical_infrastructure_alerts.map((inf, idx) => (
                              <div key={idx} className="text-[11px] text-amber-200/90 leading-relaxed">
                                ⚠️ {inf}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Traffic Advisories */}
                        <div className="p-4 rounded-xl bg-slate-950/90 border border-rose-900/40 space-y-2.5">
                          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" /> Citizen &amp; Traffic Safety
                          </div>
                          <div className="space-y-1.5">
                            {res.evacuation_and_traffic_advisories.map((adv, idx) => (
                              <div key={idx} className="text-[11px] text-rose-200/90 leading-relaxed">
                                📢 {adv}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Follow-up Prompts */}
                {res?.suggested_followups && res.suggested_followups.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Suggested Follow-ups:
                    </span>
                    {res.suggested_followups.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQuery(f);
                          handleRunQuery(f);
                        }}
                        disabled={loading}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/20 transition cursor-pointer"
                      >
                        {f} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Thinking Indicator */}
        {loading && (
          <div className="flex items-center gap-3 p-5 rounded-2xl bg-slate-900/60 border border-blue-900/30 backdrop-blur-xl animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                DrainSense AI is reasoning over {cityName}&apos;s hydrological grids...
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Integrating 24h storm telemetry ({currentRainfall24h}mm), soil runoff curves, and barrage discharge vectors.
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>
    </div>
  );
};
