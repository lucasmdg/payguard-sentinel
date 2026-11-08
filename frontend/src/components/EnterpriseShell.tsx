"use client";

import React from "react";
import {
  FlaskConical,
  Inbox,
  KeyRound,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import type { ConfigStatus, Language, ViewId } from "@/lib/types";

interface EnterpriseShellProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  activeView: ViewId;
  onSelectView: (view: ViewId) => void;
  config: ConfigStatus | null;
  verifyingPayPal: boolean;
  onRefreshPayPal: () => void;
  blockedAmountTotal: number;
  settledAmountTotal: number;
  children: React.ReactNode;
}

export default function EnterpriseShell({
  lang,
  onChangeLang,
  activeView,
  onSelectView,
  config,
  verifyingPayPal,
  onRefreshPayPal,
  blockedAmountTotal,
  settledAmountTotal,
  children,
}: EnterpriseShellProps) {
  const t = useT(lang);
  const pp = config?.paypal_health;
  const connected = pp?.connected ?? false;
  const geminiEnabled = config?.gemini_configured ?? false;

  const navItems: Array<{ id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "inbox", label: t("navInbox"), icon: Inbox },
    { id: "xray", label: t("navXray"), icon: ScanSearch },
    { id: "canary", label: t("navCanary"), icon: Target },
    { id: "lab", label: t("navLab"), icon: FlaskConical },
    { id: "paypal", label: t("navPaypal"), icon: KeyRound },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Status Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                PayGuard Sentinel
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {t("brandSubtitle")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Engine Mode Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0070BA]" />
            <span>{geminiEnabled ? t("engineGemini") : t("engineLocal")}</span>
          </div>

          {/* PayPal Sandbox Status Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-medium ${
              connected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span>{connected ? t("paypalConnected") : t("paypalOffline")}</span>
            {connected && pp?.latency_ms != null && (
              <span className="hidden sm:inline font-mono text-[11px] text-emerald-600">
                {pp.latency_ms} ms
              </span>
            )}
            <button
              type="button"
              onClick={onRefreshPayPal}
              title={t("paypalVerifyBtn")}
              className="p-0.5 rounded hover:bg-black/5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifyingPayPal ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* ES / EN Language Toggle */}
          <div
            className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold"
            role="group"
            aria-label="Language Selector"
          >
            <button
              type="button"
              onClick={() => onChangeLang("es")}
              className={`px-2.5 py-1 rounded transition-all ${
                lang === "es"
                  ? "bg-white text-[#003087] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => onChangeLang("en")}
              className={`px-2.5 py-1 rounded transition-all ${
                lang === "en"
                  ? "bg-white text-[#003087] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + Dedicated View */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Clean Left Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between">
          <div className="p-4 space-y-6">
            <div>
              <div className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t("navSectionMain")}
              </div>
              <nav className="flex md:flex-col gap-1 overflow-x-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectView(item.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-left ${
                        active
                          ? "bg-[#E6F2FA] text-[#003087] font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? "text-[#0070BA]" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sidebar Bottom Summary */}
          <div className="hidden md:block p-4 border-t border-slate-200 bg-slate-50/60 space-y-2.5">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-card">
              <div className="text-[11px] font-medium text-slate-500">{t("navCapitalSaved")}</div>
              <div className="mt-0.5 font-mono text-base font-bold text-rose-600">
                ${blockedAmountTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-card">
              <div className="text-[11px] font-medium text-slate-500">{t("navOrdersSettled")}</div>
              <div className="mt-0.5 font-mono text-base font-bold text-emerald-700">
                ${(config?.firewall_stats?.total_settled_usd ?? settledAmountTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </aside>

        {/* Active View Content Area */}
        <main className="flex-1 min-w-0 p-5 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
