"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FilePlus2,
  FileUp,
  Loader2,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type {
  InvoiceInboxResponse,
  InvoiceInboxRow,
  Language,
  PayPalOrderResponse,
} from "@/lib/types";

interface ViewInboxProps {
  lang: Language;
  inbox: InvoiceInboxResponse | null;
  loading: boolean;
  uploading: boolean;
  batchPaying: boolean;
  batchOrder: PayPalOrderResponse | null;
  onInspectInvoice: (invoiceId: string) => void;
  onUploadPdf: (file: File) => Promise<void>;
  onOpenLab: () => void;
  onExecuteBatchPayPal: (rows: InvoiceInboxRow[]) => Promise<void>;
}

export default function ViewInbox({
  lang,
  inbox,
  loading,
  uploading,
  batchPaying,
  batchOrder,
  onInspectInvoice,
  onUploadPdf,
  onOpenLab,
  onExecuteBatchPayPal,
}: ViewInboxProps) {
  const t = useT(lang);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState<"all" | "safe" | "attacks">("all");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const invoices = inbox?.invoices ?? [];
  const kpis = inbox?.kpis ?? {
    total_count: 0,
    total_amount: 0,
    safe_count: 0,
    safe_amount: 0,
    blocked_count: 0,
    blocked_amount: 0,
  };

  const safeInvoices = useMemo(
    () => invoices.filter((r) => r.risk_score < 25 && !r.is_blacklisted),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((row) => {
      if (filter === "safe" && (row.risk_score >= 25 || row.is_blacklisted)) return false;
      if (filter === "attacks" && row.risk_score < 25 && !row.is_blacklisted) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          row.invoice_id.toLowerCase().includes(q) ||
          row.vendor.toLowerCase().includes(q) ||
          row.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, filter, query]);

  const selectedSafeRows = useMemo(() => {
    if (selectedIds.length === 0) return safeInvoices;
    return invoices.filter((r) => selectedIds.includes(r.invoice_id));
  }, [invoices, safeInvoices, selectedIds]);

  const selectedAmount = selectedSafeRows.reduce((sum, r) => sum + r.amount, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await onUploadPdf(files[0]);
  };

  return (
    <div
      className="space-y-6"
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragActive(false);
        await handleFileChange(e.dataTransfer.files);
      }}
    >
      {/* Page Header + Prominent Upload / Create Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("inboxTitle")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t("inboxSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              void handleFileChange(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors shadow-card ${
              dragActive
                ? "border-[#0070BA] bg-[#E6F2FA] text-[#003087]"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0070BA]" />
            ) : (
              <FileUp className="w-4 h-4 text-[#0070BA]" />
            )}
            <span>{t("btnUploadPdf")}</span>
          </button>

          <button
            type="button"
            onClick={onOpenLab}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors shadow-card"
          >
            <FilePlus2 className="w-4 h-4 text-slate-600" />
            <span>{t("btnCreateTest")}</span>
          </button>
        </div>
      </div>

      {/* 3 Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-card">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("kpiTotalTitle")}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-slate-900">
              ${kpis.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {kpis.total_count} {t("kpiInvoicesWord")}
            </span>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-lg p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              {t("kpiSafeTitle")}
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-emerald-700">
              ${kpis.safe_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-emerald-600">
              {kpis.safe_count} {t("kpiSafeWord")}
            </span>
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-lg p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              {t("kpiBlockedTitle")}
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-rose-700">
              ${kpis.blocked_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-rose-600">
              {kpis.blocked_count} {t("kpiFraudWord")} ({t("kpiProtectedSuffix")})
            </span>
          </div>
        </div>
      </div>

      {/* Batch PayPal Order Success Banner */}
      {batchOrder && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-emerald-900">
                {t("batchOrderSuccess")}:{" "}
                <span className="font-mono">{batchOrder.order_id}</span>
              </div>
              <div className="text-xs text-emerald-700 mt-0.5">
                {batchOrder.item_count} {t("kpiInvoicesWord")} •{" "}
                <span className="font-mono font-semibold">
                  ${(batchOrder.total_amount ?? batchOrder.amount ?? 0).toFixed(2)} {batchOrder.currency}
                </span>{" "}
                • {batchOrder.status} ({batchOrder.latency_ms} ms)
              </div>
            </div>
          </div>

          {batchOrder.approval_url && (
            <a
              href={batchOrder.approval_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#003087] hover:bg-[#002466] text-white text-xs font-semibold transition-colors shrink-0"
            >
              <span>{t("openCheckout")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Filter Bar + Batch PayPal Payout Button */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                filter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t("filterAll")} ({kpis.total_count})
            </button>
            <button
              type="button"
              onClick={() => setFilter("safe")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                filter === "safe"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {t("filterSafe")} ({kpis.safe_count})
            </button>
            <button
              type="button"
              onClick={() => setFilter("attacks")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                filter === "attacks"
                  ? "bg-rose-700 text-white"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              {t("filterAttacks")} ({kpis.blocked_count})
            </button>

            <div className="relative ml-0 sm:ml-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-8 pr-3 py-1.5 w-64 rounded-md border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA]"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={batchPaying || selectedSafeRows.length === 0}
            onClick={() => void onExecuteBatchPayPal(selectedSafeRows)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
          >
            {batchPaying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {selectedIds.length > 0 ? t("btnBatchPay") : t("btnBatchPayAll")} ($
              {selectedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })})
            </span>
          </button>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Cargando base de datos forense...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        safeInvoices.length > 0 &&
                        safeInvoices.every((s) => selectedIds.includes(s.invoice_id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(safeInvoices.map((s) => s.invoice_id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-[#0070BA] focus:ring-[#0070BA]"
                    />
                  </th>
                  <th className="py-3 px-3">{t("colInvoice")}</th>
                  <th className="py-3 px-3">{t("colVendor")}</th>
                  <th className="py-3 px-3">{t("colAmount")}</th>
                  <th className="py-3 px-3">{t("colRisk")}</th>
                  <th className="py-3 px-3">{t("colDiagnosis")}</th>
                  <th className="py-3 px-4 text-right">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredInvoices.map((row) => {
                  const isSafe = row.risk_score < 25 && !row.is_blacklisted;
                  const isWarning = row.risk_level === "WARNING" && !row.is_blacklisted;
                  const summary =
                    (lang === "es"
                      ? row.plain_language_summary?.es
                      : row.plain_language_summary?.en) || row.threat_classification;

                  return (
                    <tr
                      key={row.invoice_id}
                      onClick={() => onInspectInvoice(row.invoice_id)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                    >
                      <td
                        className="py-3.5 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.invoice_id)}
                          onChange={() => toggleSelect(row.invoice_id)}
                          className="rounded border-slate-300 text-[#0070BA] focus:ring-[#0070BA]"
                        />
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs font-semibold text-[#003087] whitespace-nowrap">
                        {row.invoice_id}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900">{row.vendor}</div>
                        <div className="text-xs text-slate-500">{row.category}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        ${row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                        <span className="text-xs text-slate-400">{row.currency}</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {row.is_blacklisted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{t("statusBlacklisted")} ({row.risk_score}/100)</span>
                          </span>
                        ) : isSafe ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t("statusSafe")} ({row.risk_score}/100)</span>
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{t("statusWarning")} ({row.risk_score}/100)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{t("statusCritical")} ({row.risk_score}/100)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 max-w-md">
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {summary}
                        </p>
                      </td>
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onInspectInvoice(row.invoice_id)}
                            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:border-[#0070BA] hover:text-[#003087] text-xs font-semibold text-slate-700 transition-colors"
                          >
                            {t("btnInspect")}
                          </button>
                          <a
                            href={`${API_BASE}${row.download_url}`}
                            target="_blank"
                            rel="noreferrer"
                            title={t("xrayDownloadOriginal")}
                            className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
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
  );
}
