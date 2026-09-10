"use client";

import React, { useState } from "react";
import { 
  Presentation, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  MapPin,
  Sliders,
  TrendingUp,
  Cpu,
  AlertOctagon,
  ShieldCheck
} from "lucide-react";

interface JuryDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  onSelectGrid: (gridId: string) => void;
}

export const JuryDemoModal: React.FC<JuryDemoModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onSelectGrid
}) => {
  const [step, setStep] = useState<number>(1);

  if (!isOpen) return null;

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) {
      const nextStep = step + 1;
      setStep(nextStep);
      applyStepActions(nextStep);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      applyStepActions(prevStep);
    }
  };

  const applyStepActions = (s: number) => {
    if (s === 1 || s === 2) {
      setActiveTab("map");
    } else if (s === 3) {
      setActiveTab("map");
      onSelectGrid("VJA_0036"); // Select low-lying critical zone
    } else if (s === 4) {
      setActiveTab("whatif");
    } else if (s === 5) {
      setActiveTab("priority");
    } else if (s === 6) {
      setActiveTab("analytics");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Presentation className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">DrainSense India — Jury Presentation Tour</h3>
              <p className="text-[11px] text-slate-400">3-Minute Scientific Defense Walkthrough</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tour Step Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
              Step {step} of {totalSteps}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-1 rounded-full transition-all ${
                    i + 1 === step ? "bg-amber-400 w-8" : i + 1 < step ? "bg-blue-500" : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-100">1. Problem Formulation & Scientific Guardrails</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                India’s urban centers face devastating recurrent flash waterlogging. In September 2024, extreme rainfall caused the <strong>Budameru Rivulet</strong> to breach, submerging 30+ municipal wards in Vijayawada.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300">
                <strong>Important Guardrail:</strong> We do NOT claim exact street-level depth prediction. Instead, DrainSense estimates zone-level waterlogging susceptibility on a 500m × 500m grid using physics-grounded terrain, antecedents, and historical inundation.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-100">2. Interactive 500m Grid Map & Topography</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                The entire Vijayawada / Amaravati capital region is discretized into <strong>810 deterministic 500m × 500m cells</strong>.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                <li>Integrates SRTM elevation (14m to 110m Indrakeeladri hill range).</li>
                <li>Hydrological flow accumulation and canal proximity (Krishna River, Budameru, Eluru & Ryves canals).</li>
                <li>Dynamic risk color grading: Green (0-20%), Amber (40-60%), to Crimson Critical (&gt;80%).</li>
              </ul>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-100">3. Explainable AI (XAI) with TreeSHAP</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clicking any cell opens the <strong>Zone Detail Drawer</strong>. Rather than black-box outputs, DrainSense provides explicit evidence-based factors:
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-red-400 font-medium">+ Extreme 24h Rainfall</span>
                  <span className="text-slate-300">145 mm (exceeds 120mm capacity)</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-red-400 font-medium">+ Lowland Topography</span>
                  <span className="text-slate-300">17.2m AMSL (gravity drainage sump)</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-emerald-400 font-medium">- High Slope Barrier</span>
                  <span className="text-slate-300">Indrakeeladri ridge prevents pooling</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-100">4. What-If Rainfall Scenario Simulator</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Municipal disaster teams must prepare for escalating storm surges. The What-If Simulator lets operators scale antecedent rainfall dynamically:
              </p>
              <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/60 text-xs text-slate-200">
                Simulating a <strong>+25% convective rainfall burst</strong> immediately flags newly breached zones, critical count shifts, and lists the exact vulnerable wards before water begins accumulating.
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-100">5. Algorithmic Response Prioritization</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Municipal pumps and SDRF teams cannot be everywhere simultaneously. DrainSense uses a transparent, weighted formula:
              </p>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                Priority Score = 0.60(Risk) + 0.20(Buildings) + 0.10(Flood History) + 0.10(Roads)
              </div>
              <p className="text-xs text-slate-400">
                Ranks all 810 cells from #1 to #810 with suggested actionable interventions (e.g. stage 100+ HP suction pumps, divert traffic).
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-100">6. Model Governance, Real Data & Limitations</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Trained on <strong>72,900 spatio-temporal observations</strong> from CWC telemetry, Open-Meteo, IFI, and SRTM DEM.
              </p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                <li>Calibrated XGBoost classifier with 100% recall on severe flood conditions.</li>
                <li>3-Fold Sigmoid probability calibration (Brier score 0.0000).</li>
                <li>Honest limitations: 1D statistical proxy model, not dynamic 2D Saint-Venant hydraulic flow.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            {step === totalSteps ? "Finish Tour" : "Next Step"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
