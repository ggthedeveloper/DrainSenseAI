"use client";

import { SupportedLanguage, getTranslation } from "../lib/i18n";

interface SettingsPageProps {
  currentLang: SupportedLanguage;
  healthStatus: { status: string; model_version: string } | null;
}

export function SettingsPage({ currentLang, healthStatus }: SettingsPageProps) {
  const t = getTranslation(currentLang);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.navSettings}</h1>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-[#4C5E62]">
          The console is in English. Model retrain stays behind the operator token on the server. That token is not stored here.
        </p>
      </div>
      <div className="rounded-xl border border-[#D5E2E0] bg-[#FBFDFC] p-4 text-sm">
        <div className="font-medium">Service</div>
        <p className="mt-1 text-[#4C5E62]">
          {healthStatus ? `${healthStatus.status}. ${healthStatus.model_version}` : "The health check has not returned."}
        </p>
      </div>
    </div>
  );
}
