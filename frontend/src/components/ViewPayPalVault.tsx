"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import type {
  ConfigStatus,
  Language,
  LedgerSnapshot,
  PayPalBlockResponse,
  PayPalOrderResponse,
} from "@/lib/types";

interface ViewPayPalVaultProps {
  lang: Language;
  config: ConfigStatus | null;
  ledger: LedgerSnapshot | null;
  latestOrder: PayPalOrderResponse | null;
  lastBlock: PayPalBlockResponse | null;
  verifyingPayPal: boolean;
  savingVault: boolean;
  testingBlock: boolean;
  onRefreshPayPal: () => Promise<void>;
  onTestHttp403Block: () => Promise<void>;
  onInspectOrder: (orderId: string) => Promise<void>;
  onCaptureOrder: (orderId: string) => Promise<void>;
  onSaveKeys: (payload: {
    paypal_client_id: string;
    paypal_client_secret: string;
    paypal_base_url: string;
    gemini_api_key: string;
  }) => Promise<void>;
}

const NOTEPAD_STORAGE_KEY = "payguard_sentinel_vault_notepad_v2";

export default function ViewPayPalVault({
  lang,
  config,
  ledger,
  latestOrder,
  lastBlock,
  verifyingPayPal,
  savingVault,
  testingBlock,
  onRefreshPayPal,
  onTestHttp403Block,
  onInspectOrder,
  onCaptureOrder,
  onSaveKeys,
}: ViewPayPalVaultProps) {
  const t = useT(lang);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api-m.sandbox.paypal.com");
  const [geminiKey, setGeminiKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [notepad, setNotepad] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [showRawOrderJson, setShowRawOrderJson] = useState(false);

  useEffect(() => {
    if (config) {
      setClientId(config.paypal_client_id || "");
      setClientSecret(config.paypal_client_secret || "");
      setBaseUrl(config.paypal_base_url || "https://api-m.sandbox.paypal.com");
    }
  }, [config]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(NOTEPAD_STORAGE_KEY);
      if (saved !== null) {
        setNotepad(saved);
      } else {
        setNotepad(
          "# PayGuard Sentinel Developer Notepad\n# Save webhook endpoints, sandbox buyer accounts, or test notes here.\n"
        );
      }
    }
  }, []);

  const handleNotepadChange = (val: string) => {
    setNotepad(val);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NOTEPAD_STORAGE_KEY, val);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveKeys({
      paypal_client_id: clientId,
      paypal_client_secret: clientSecret,
      paypal_base_url: baseUrl,
      gemini_api_key: geminiKey,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const pp = config?.paypal_health;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("paypalTitle")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t("paypalSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live PayPal Gateway & Ledger */}
        <div className="lg:col-span-7 space-y-6">
          {/* Connection Status & 403 Security Test Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t("paypalConnStatus")}
                </div>
                <div className="mt-1 flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      pp?.connected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{pp?.connected ? "CONNECTED" : pp?.status || "OFFLINE"}</span>
                  </span>
                  {pp?.app_id && (
                    <span className="font-mono text-xs text-slate-600">
                      App: {pp.app_id}
                    </span>
                  )}
                  {pp?.latency_ms != null && (
                    <span className="font-mono text-xs text-slate-500">
                      {pp.latency_ms} ms
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={verifyingPayPal}
                  onClick={() => void onRefreshPayPal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingPayPal ? "animate-spin" : ""}`} />
                  <span>{t("paypalVerifyBtn")}</span>
                </button>

                <button
                  type="button"
                  disabled={testingBlock}
                  onClick={() => void onTestHttp403Block()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t("paypalTest403Btn")}</span>
                </button>
              </div>
            </div>

            {/* Live HTTP 403 Proof Receipt */}
            {lastBlock && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>HTTP 403 ENFORCED — {lastBlock.error}</span>
                </div>
                <div className="text-xs text-rose-700">
                  {lastBlock.invoice_id} • ${lastBlock.prevented_loss_usd.toFixed(2)} USD •{" "}
                  {lastBlock.reasons.join(" | ")}
                </div>
              </div>
            )}

            {/* Latest Live PayPal Order Receipt */}
            {latestOrder && (
              <div className="p-4 rounded-lg bg-[#E6F2FA]/60 border border-[#0070BA]/30 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-[#003087]">
                    Order ID: <span className="font-mono">{latestOrder.order_id}</span> ({latestOrder.status})
                  </div>
                  <div className="flex items-center gap-2">
                    {latestOrder.approval_url && (
                      <a
                        href={latestOrder.approval_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#003087] text-white text-xs font-semibold hover:bg-[#002466]"
                      >
                        <span>sandbox.paypal.com</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void onInspectOrder(latestOrder.order_id)}
                      className="px-2.5 py-1 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => void onCaptureOrder(latestOrder.order_id)}
                      className="px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Capture
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRawOrderJson((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  {showRawOrderJson ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  <span>JSON Response (api-m.sandbox.paypal.com)</span>
                </button>

                {showRawOrderJson && (
                  <pre className="p-3 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto max-h-48">
                    {JSON.stringify(latestOrder.raw_response, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Live Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">{t("paypalLedgerTitle")}</h2>
              <span className="font-mono text-xs text-slate-500">
                {ledger?.events?.length ?? 0} Events
              </span>
            </div>

            <div className="overflow-x-auto max-h-[380px]">
              {!ledger || ledger.events.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  {lang === "es"
                    ? "Ejecuta un pago seguro o una prueba de bloqueo HTTP 403 para registrar eventos en el libro mayor."
                    : "Execute a safe payment or HTTP 403 security test to populate the ledger."}
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                      <th className="py-2.5 px-4">Hora</th>
                      <th className="py-2.5 px-3">Referencia</th>
                      <th className="py-2.5 px-3">Importe</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-4">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ledger.events.map((ev) => {
                      const blocked =
                        ev.type === "FIREWALL_BLOCK_403" || ev.type === "CANARY_TRAP_LOCK";
                      return (
                        <tr key={ev.event_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false })}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                            {ev.order_id ? `${ev.order_id}` : ev.invoice_id}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            ${ev.amount.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                blocked
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {ev.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={ev.detail}>
                            {ev.detail}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right: API Keys Vault & Developer Notepad */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-5">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#003087]" />
            <h2 className="text-base font-bold text-slate-900">{t("vaultTitle")}</h2>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            {t("vaultZeroKeyNote")}
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                <label>PAYPAL_CLIENT_ID</label>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(clientId)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#0070BA]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                <label>PAYPAL_CLIENT_SECRET</label>
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                >
                  {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showSecret ? "Hide" : "Reveal"}</span>
                </button>
              </div>
              <input
                type={showSecret ? "text" : "password"}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#0070BA]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                PAYPAL_BASE_URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:border-[#0070BA]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                <label>GEMINI_API_KEY (Optional)</label>
                <button
                  type="button"
                  onClick={() => setShowGemini((v) => !v)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                >
                  {showGemini ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showGemini ? "Hide" : "Reveal"}</span>
                </button>
              </div>
              <input
                type={showGemini ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={
                  config?.gemini_configured
                    ? `Configured (${config.gemini_api_key_masked})`
                    : "AIza... (optional)"
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA]"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingVault}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {savingVault ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{t("vaultSaveBtn")}</span>
              </button>
              {savedNotice && (
                <span className="text-xs font-semibold text-emerald-600">OK</span>
              )}
            </div>
          </form>

          {/* Persistent Notepad */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase">
              {t("vaultNotepadTitle")}
            </label>
            <textarea
              rows={5}
              value={notepad}
              onChange={(e) => handleNotepadChange(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 focus:outline-none focus:border-[#0070BA] resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
