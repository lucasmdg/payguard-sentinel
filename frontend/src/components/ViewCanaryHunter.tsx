"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Crosshair,
  Download,
  FileText,
  Loader2,
  Radio,
  ShieldBan,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type {
  CanaryTelemetrySnapshot,
  CanaryTokenRecord,
  InvoiceInboxRow,
  Language,
} from "@/lib/types";

interface ViewCanaryHunterProps {
  lang: Language;
  invoices: InvoiceInboxRow[];
  telemetry: CanaryTelemetrySnapshot | null;
  latestCanary: CanaryTokenRecord | null;
  busyCanary: boolean;
  onGenerateCanary: (row: InvoiceInboxRow) => Promise<void>;
  onSimulateBot: (row: InvoiceInboxRow) => Promise<void>;
}

export default function ViewCanaryHunter({
  lang,
  invoices,
  telemetry,
  latestCanary,
  busyCanary,
  onGenerateCanary,
  onSimulateBot,
}: ViewCanaryHunterProps) {
  const t = useT(lang);
  const suspiciousInvoices = invoices.filter((r) => r.risk_score >= 25);
  const defaultTarget =
    suspiciousInvoices.find((r) => r.invoice_id === "INV-005") ||
    suspiciousInvoices[0] ||
    invoices[0];

  const [selectedId, setSelectedId] = useState<string>(defaultTarget?.invoice_id || "INV-005");

  const targetRow =
    invoices.find((r) => r.invoice_id === selectedId) || defaultTarget;

  const activeToken = latestCanary || telemetry?.armed_tokens?.[0] || null;
  const events = telemetry?.events ?? [];
  const downloadHref = activeToken
    ? `${API_BASE}/api/canary/download/${activeToken.token_id}`
    : `${API_BASE}/api/canary/download/latest`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("canaryTitle")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t("canarySubtitle")}</p>
      </div>

      {/* 3-Step Visual Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Generate Bait Document */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#003087] text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-bold text-slate-900">{t("step1Title")}</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{t("step1Desc")}</p>

            {targetRow && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t("step1TargetLabel")}
                </label>
                <select
                  value={targetRow.invoice_id}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070BA]"
                >
                  {(suspiciousInvoices.length > 0 ? suspiciousInvoices : invoices).map((inv) => (
                    <option key={inv.invoice_id} value={inv.invoice_id}>
                      {inv.invoice_id} — {inv.vendor} (${inv.amount.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={busyCanary || !targetRow}
                onClick={() => targetRow && void onGenerateCanary(targetRow)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0070BA] hover:bg-[#003087] text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {busyCanary ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Crosshair className="w-4 h-4" />
                )}
                <span>{t("step1BtnGenerate")}</span>
              </button>

              {activeToken && (
                <a
                  href={downloadHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
                >
                  <Download className="w-4 h-4 text-[#003087]" />
                  <span>{t("step1BtnDownload")}</span>
                </a>
              )}
            </div>

            {activeToken && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-amber-900">
                  <span>Token: {activeToken.token_id} ({activeToken.invoice_id})</span>
                  <span>{activeToken.status}</span>
                </div>
                <div className="font-mono text-[11px] text-amber-800 break-all">
                  {activeToken.hidden_payload}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Simulate Scammer AI Bot */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-base font-bold text-slate-900">{t("step2Title")}</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{t("step2Desc")}</p>

            {/* Visual Flow Diagram */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <FileText className="w-5 h-5 text-[#0070BA] mx-auto mb-1" />
                <div className="text-xs font-semibold text-slate-800">PDF Cebo</div>
                <div className="text-[11px] text-slate-500">1pt #FFFFFF</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 relative">
                <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2" />
                <Bot className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <div className="text-xs font-semibold text-slate-800">Scraper IA</div>
                <div className="text-[11px] text-slate-500">PyMuPDF Parser</div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 relative">
                <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2" />
                <ShieldBan className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                <div className="text-xs font-semibold text-rose-800">Trampa HTTP</div>
                <div className="text-[11px] text-rose-600">Bloqueo Escrow</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              disabled={busyCanary || !targetRow}
              onClick={() => targetRow && void onSimulateBot(targetRow)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
            >
              {busyCanary ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              <span>{t("step2BtnSimulate")}</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>{t("step2Listening")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Police-Style Intercepted Bot Dossier */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="text-base font-bold text-slate-900">{t("step3Title")}</h2>
          </div>
          {events.length > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              {events.length} {lang === "es" ? "Capturas Confirmadas" : "Confirmed Captures"}
            </span>
          )}
        </div>

        {events.length === 0 ? (
          <div className="p-8 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center text-sm text-slate-500">
            {t("step3Empty")}
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt) => {
              const secondsStr = (evt.reaction_latency_ms / 1000).toFixed(2);
              return (
                <div
                  key={evt.event_id}
                  className="rounded-lg border border-rose-200 bg-rose-50/40 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-rose-600" />
                      <span className="text-sm font-bold text-slate-900">
                        {evt.invoice_id} — {evt.vendor_name}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {evt.token_id}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Highlighted Velocity Proof Banner */}
                  <div className="p-4 rounded-lg bg-white border border-rose-200 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {t("step3ReactionLabel")}
                        </div>
                        <div className="font-mono text-xl font-bold text-rose-700">
                          {secondsStr} s ({evt.reaction_latency_ms} ms)
                        </div>
                      </div>
                    </div>
                    <div className="md:border-l md:border-slate-200 md:pl-4 text-sm text-slate-700 leading-relaxed">
                      <strong className="text-rose-800">{t("step3ProofTitle")}</strong>{" "}
                      {t("step3ProofBody")}
                    </div>
                  </div>

                  {/* Clear Forensic Evidence Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                      <div className="font-semibold text-slate-500 uppercase mb-1">
                        {t("step3SoftwareLabel")}
                      </div>
                      <div className="font-mono text-slate-900 break-words">
                        {evt.user_agent}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                      <div className="font-semibold text-slate-500 uppercase mb-1">
                        {t("step3IpLabel")}
                      </div>
                      <div className="font-mono text-slate-900">
                        {evt.x_forwarded_for} • {evt.http_method}
                      </div>
                      <div className="text-slate-500 mt-0.5">{evt.asn_fingerprint}</div>
                    </div>
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                      <div className="font-semibold text-slate-500 uppercase mb-1">
                        {t("step3ActionLabel")}
                      </div>
                      <div className="font-semibold text-rose-700">
                        {evt.countermeasure}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
