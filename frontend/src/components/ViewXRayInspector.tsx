"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  ScanEye,
  Send,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type {
  ForensicScanReport,
  HiddenLayer,
  InvoiceInboxRow,
  Language,
  PayPalOrderResponse,
} from "@/lib/types";

interface ViewXRayInspectorProps {
  lang: Language;
  invoices: InvoiceInboxRow[];
  report: ForensicScanReport | null;
  loading: boolean;
  executingPayPal: boolean;
  lastOrder: PayPalOrderResponse | null;
  onSelectInvoiceId: (invoiceId: string) => void;
  onPaySafeInvoice: () => Promise<void>;
  onDeployCanary: () => Promise<void>;
}

function describeTrapReason(layer: HiddenLayer, lang: Language): {
  humanView: string;
  whyTrap: string;
} {
  const lt = layer.layer_type;
  if (lt === "MICROSCOPIC_WHITE_INK_LAYER") {
    return {
      humanView:
        lang === "es"
          ? `Espacio en blanco invisible (texto ${layer.font_size}pt en color ${layer.color_hex} sobre fondo blanco)`
          : `Invisible blank white region (${layer.font_size}pt ${layer.color_hex} ink on white background)`,
      whyTrap:
        lang === "es"
          ? `Letra tamano ${layer.font_size}pt en color blanco (${layer.color_hex}) sobre fondo blanco. Invisible para personas, pero leida literalmente por agentes de IA.`
          : `Microscopic ${layer.font_size}pt white text (${layer.color_hex}) on a white page. Completely invisible to human eyes, yet parsed directly by LLM agents.`,
    };
  }
  if (lt === "OFF_PAGE_COORDINATE_INJECTION") {
    return {
      humanView:
        lang === "es"
          ? "Nada visible en el documento (ubicado fuera de la pagina en coordenadas negativas)"
          : "Nothing visible on page (placed outside visible MediaBox at negative coordinates)",
      whyTrap:
        lang === "es"
          ? `Coordenadas fuera de pagina ${JSON.stringify(layer.bbox)}. Un visor PDF normal recorta esta zona, pero un extractor automatico lee todo el flujo.`
          : `Off-page coordinates ${JSON.stringify(layer.bbox)}. Standard PDF viewers crop it out, while automated AI scrapers ingest the full text stream.`,
    };
  }
  if (lt === "POISONED_XMP_METADATA_STREAM") {
    return {
      humanView:
        lang === "es"
          ? "Nada visible en pantalla (oculto dentro de los metadatos XML internos del archivo)"
          : "Nothing visible on page (hidden inside internal PDF /Metadata XMP XML stream)",
      whyTrap:
        lang === "es"
          ? "Metadatos XML /XMP manipulados para inyectar ordenes de aprobacion sin mostrar nada visualmente."
          : "Tampered XML /XMP metadata stream injecting override commands without rendering anything visually.",
    };
  }
  if (lt === "BASE64_OBFUSCATED_FOOTER") {
    return {
      humanView:
        lang === "es"
          ? "Codigo tecnico alfanumerico aparentemente inofensivo en el pie de pagina"
          : "Seemingly harmless technical token string printed in the invoice footer",
      whyTrap:
        lang === "es"
          ? "Cadena codificada en Base64 que oculta instrucciones de anulacion de seguridad para modelos LLM capaces de decodificarla."
          : "Base64-obfuscated string hiding system-override jailbreak instructions decoded by capable LLM pipelines.",
    };
  }
  if (lt === "ZERO_WIDTH_UNICODE_STEGO" || lt === "ZERO_WIDTH_UNICODE_STEGANOGRAPHY") {
    return {
      humanView:
        lang === "es"
          ? "Firma de autorizacion normal acompanada de aviso urgente de pago"
          : "Ordinary executive sign-off line paired with urgent settlement notice",
      whyTrap:
        lang === "es"
          ? "Contiene caracteres Unicode invisibles de ancho cero (U+200B/U+200C/U+200D) y presion psicologica extrema para saltar controles."
          : "Embeds invisible zero-width Unicode characters (U+200B/U+200C/U+200D) combined with urgent coercion directives.",
    };
  }
  return {
    humanView:
      lang === "es"
        ? "Texto aparentemente legítimo de facturacion o dominio PayPal"
        : "Apparently legitimate billing line or PayPal settlement domain",
    whyTrap:
      lang === "es"
        ? `Senal detectada: ${layer.threat_reasons.join(", ")}. Disenado para confundir la validacion humana y automatizada.`
        : `Flagged signal: ${layer.threat_reasons.join(", ")}. Crafted to deceive both human reviewers and automated parsers.`,
  };
}

export default function ViewXRayInspector({
  lang,
  invoices,
  report,
  loading,
  executingPayPal,
  lastOrder,
  onSelectInvoiceId,
  onPaySafeInvoice,
  onDeployCanary,
}: ViewXRayInspectorProps) {
  const t = useT(lang);
  const [selectedLayerIdx, setSelectedLayerIdx] = useState<number>(0);
  const [showTechnical, setShowTechnical] = useState(false);

  const layers = report?.hidden_layers_detected ?? [];
  const page = report?.pages?.[0] ?? null;
  const inv = report?.extracted_invoice_data;

  useEffect(() => {
    setSelectedLayerIdx(0);
  }, [report?.sha256]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-16 text-center shadow-card">
        <Loader2 className="w-6 h-6 animate-spin text-[#0070BA] mx-auto mb-3" />
        <div className="text-sm font-medium text-slate-600">
          {lang === "es" ? "Analizando capas del PDF..." : "Inspecting PDF layers..."}
        </div>
      </div>
    );
  }

  if (!report || !page || !inv) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-500 shadow-card">
        {lang === "es"
          ? "Selecciona una factura en la Bandeja de Entrada para iniciar la inspeccion visual."
          : "Select an invoice from the Inbox to start visual inspection."}
      </div>
    );
  }

  const isSafe = report.risk_score < 25;
  const isWarning = report.risk_level === "WARNING";
  const summaryText =
    (lang === "es" ? report.plain_language_summary?.es : report.plain_language_summary?.en) ||
    report.findings_summary[0];

  const activeLayer = layers[selectedLayerIdx] || null;
  const activeExplanation = activeLayer ? describeTrapReason(activeLayer, lang) : null;

  const onPageLayers = layers
    .map((l, idx) => ({ layer: l, pinNumber: idx + 1 }))
    .filter((item) => item.layer.norm_bbox && item.layer.layer_type !== "OFF_PAGE_COORDINATE_INJECTION" && item.layer.page > 0);

  const offPageOrMetaLayers = layers
    .map((l, idx) => ({ layer: l, pinNumber: idx + 1 }))
    .filter((item) => !item.layer.norm_bbox || item.layer.layer_type === "OFF_PAGE_COORDINATE_INJECTION" || item.layer.page === 0);

  return (
    <div className="space-y-6">
      {/* Header + Invoice Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("xrayTitle")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t("xraySubtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">
            {t("xraySelectInvoice")}:
          </label>
          <select
            value={inv.invoice_id}
            onChange={(e) => onSelectInvoiceId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 shadow-card focus:outline-none focus:border-[#0070BA]"
          >
            {invoices.map((item) => (
              <option key={item.invoice_id} value={item.invoice_id}>
                {item.invoice_id} — {item.vendor} (${item.amount.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Plain-Language Executive Verdict Banner */}
      <div
        className={`rounded-lg border p-5 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isSafe
            ? "bg-emerald-50/70 border-emerald-200"
            : isWarning
            ? "bg-amber-50/80 border-amber-200"
            : "bg-rose-50/80 border-rose-200"
        }`}
      >
        <div className="flex items-start gap-3.5">
          {isSafe ? (
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : isWarning ? (
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-sm font-bold ${
                  isSafe ? "text-emerald-900" : isWarning ? "text-amber-900" : "text-rose-900"
                }`}
              >
                {inv.invoice_id} • {inv.vendor_name}
              </span>
              <span
                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  isSafe
                    ? "bg-white text-emerald-700 border-emerald-200"
                    : isWarning
                    ? "bg-white text-amber-800 border-amber-200"
                    : "bg-white text-rose-700 border-rose-200"
                }`}
              >
                {report.risk_score}/100
              </span>
            </div>
            <p
              className={`mt-1.5 text-sm leading-relaxed font-medium ${
                isSafe ? "text-emerald-800" : isWarning ? "text-amber-900" : "text-rose-900"
              }`}
            >
              {summaryText}
            </p>
          </div>
        </div>

        <div className="font-mono text-right shrink-0">
          <div className="text-xs text-slate-500 uppercase">Total</div>
          <div className="text-2xl font-bold text-slate-900">
            ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {inv.currency}
          </div>
        </div>
      </div>

      {/* Side-by-Side Visual Document Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Sheet: Normal Human View */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-sm font-semibold text-slate-900">{t("xrayHumanSheet")}</div>
                <div className="text-xs text-slate-500">{t("xrayHumanCaption")}</div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-100/70 flex-1 flex items-center justify-center">
            <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <img
                src={`data:image/png;base64,${page.preview_image_base64}`}
                alt={`Human view ${report.filename}`}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>

        {/* Right Sheet: Hidden Layers X-Ray */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanEye className="w-4 h-4 text-rose-600" />
              <div>
                <div className="text-sm font-semibold text-slate-900">{t("xrayHiddenSheet")}</div>
                <div className="text-xs text-slate-500">{t("xrayHiddenCaption")}</div>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                layers.length > 0
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {layers.length} {lang === "es" ? "Capas" : "Layers"}
            </span>
          </div>

          <div className="p-4 bg-slate-100/70 flex-1 flex flex-col items-center justify-center gap-3">
            <div className="relative w-full max-w-[460px] bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
              <img
                src={`data:image/png;base64,${page.preview_image_base64}`}
                alt={`X-Ray view ${report.filename}`}
                className={`w-full h-auto block transition-all ${
                  layers.length > 0 ? "opacity-75 contrast-125" : ""
                }`}
              />

              {/* Red Highlight Boxes + Numbered Pins */}
              {onPageLayers.map(({ layer, pinNumber }) => {
                const [nx0, ny0, nx1, ny1] = layer.norm_bbox!;
                const leftPct = Math.max(1, nx0 * 100);
                const topPct = Math.max(1, ny0 * 100);
                const widthPct = Math.max(20, (nx1 - nx0) * 100);
                const heightPct = Math.max(3.2, (ny1 - ny0) * 100);
                const isSelected = selectedLayerIdx === pinNumber - 1;

                return (
                  <button
                    key={pinNumber}
                    type="button"
                    onClick={() => setSelectedLayerIdx(pinNumber - 1)}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${Math.min(96 - leftPct, widthPct)}%`,
                      height: `${heightPct}%`,
                    }}
                    className={`absolute border-2 rounded cursor-pointer transition-all xray-pin-pulse ${
                      isSelected
                        ? "border-rose-600 bg-rose-500/25 ring-2 ring-rose-600/40"
                        : "border-rose-500 bg-rose-500/15 hover:bg-rose-500/25"
                    }`}
                  >
                    <span className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-rose-600 text-white font-mono text-[11px] font-bold flex items-center justify-center shadow">
                      #{pinNumber}
                    </span>
                  </button>
                );
              })}

              {/* Off-Page / Metadata Pins Bar */}
              {offPageOrMetaLayers.length > 0 && (
                <div className="bg-rose-900/95 text-white px-3 py-2 flex flex-wrap items-center gap-2 border-t border-rose-700">
                  <span className="text-[11px] font-semibold uppercase tracking-wide">
                    {lang === "es" ? "Capas Fuera de Pagina / XML:" : "Off-Page / XML Layers:"}
                  </span>
                  {offPageOrMetaLayers.map(({ layer, pinNumber }) => {
                    const isSelected = selectedLayerIdx === pinNumber - 1;
                    return (
                      <button
                        key={pinNumber}
                        type="button"
                        onClick={() => setSelectedLayerIdx(pinNumber - 1)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                          isSelected
                            ? "bg-white text-rose-700"
                            : "bg-rose-700 text-white hover:bg-rose-600"
                        }`}
                      >
                        <span>#{pinNumber}</span>
                        <span className="font-normal">
                          {layer.layer_type === "POISONED_XMP_METADATA_STREAM" ? "XMP XML" : "x:-500, y:-500"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Crystal-Clear Pin Comparison Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-card space-y-4">
        {layers.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-emerald-700 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{t("xrayNoTraps")}</span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t("xrayPinPrompt")}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {layers.map((layer, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedLayerIdx(idx)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                      selectedLayerIdx === idx
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    }`}
                  >
                    #{idx + 1} {layer.layer_type.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {activeLayer && activeExplanation && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t("xrayEyesSee")}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeExplanation.humanView}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="text-xs font-semibold uppercase tracking-wider text-rose-700 mb-1.5">
                    {t("xrayAiReads")}
                  </div>
                  <p className="font-mono text-xs text-rose-900 break-words leading-relaxed">
                    {activeLayer.decoded_payload}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1.5">
                    {t("xrayWhyTrap")}
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {activeExplanation.whyTrap}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Direct Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {isSafe ? (
            <button
              type="button"
              disabled={executingPayPal}
              onClick={() => void onPaySafeInvoice()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0070BA] hover:bg-[#003087] text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
            >
              {executingPayPal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>
                {t("xrayAuthorizePay")} (${inv.amount.toFixed(2)})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void onDeployCanary()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors shadow-xs"
            >
              <Target className="w-4 h-4" />
              <span>{t("xrayDeployCanary")}</span>
            </button>
          )}

          <a
            href={`${API_BASE}/api/forensics/report-pdf/${inv.invoice_id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-[#003087]" />
            <span>{t("xrayDownloadReport")}</span>
          </a>

          <a
            href={`${API_BASE}/api/samples/${report.filename}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t("xrayDownloadOriginal")}</span>
          </a>
        </div>

        {/* Live Order Receipt Pill when PayPal paid */}
        {lastOrder && lastOrder.invoice_id === inv.invoice_id && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div className="text-xs">
              <span className="font-semibold text-emerald-900">Order {lastOrder.order_id}</span>{" "}
              <span className="text-emerald-700">({lastOrder.status})</span>
            </div>
            {lastOrder.approval_url && (
              <a
                href={lastOrder.approval_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#003087] hover:underline"
              >
                <span>Checkout</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Technical AST / OSINT Details */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnical((v) => !v)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left bg-slate-50/60 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-semibold text-slate-800">{t("xrayTechTab")}</span>
          {showTechnical ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showTechnical && (
          <div className="p-5 border-t border-slate-200 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500">SHA-256</div>
                <div className="mt-1 text-slate-900 break-all">{report.sha256}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500">PDF Structure</div>
                <div className="mt-1 text-slate-900">
                  PDF v{report.pdf_version} • {report.object_count} XREF • {report.file_size_bytes} bytes
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500">OSINT Domain Audit</div>
                <div className="mt-1 text-slate-900 font-semibold">
                  {report.osint_domain_audit.status}
                </div>
              </div>
            </div>

            {report.gemini_enrichment?.analysis_text && (
              <div className="p-3.5 rounded-lg bg-[#E6F2FA] border border-[#0070BA]/30 text-slate-800">
                <div className="font-semibold text-[#003087] mb-1">
                  Gemini 3.8 Flash Multimodal Verification
                </div>
                <p className="leading-relaxed">{report.gemini_enrichment.analysis_text}</p>
              </div>
            )}

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <th className="py-2 px-3">BBox [x0,y0,x1,y1]</th>
                    <th className="py-2 px-3">Font / Size</th>
                    <th className="py-2 px-3">Color / Lum</th>
                    <th className="py-2 px-3">Text</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {page.spans.map((sp) => (
                    <tr
                      key={sp.id}
                      className={sp.is_malicious ? "bg-rose-50 text-rose-900" : "text-slate-700"}
                    >
                      <td className="py-1.5 px-3 whitespace-nowrap">[{sp.bbox.join(", ")}]</td>
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        {sp.font} ({sp.font_size}pt)
                      </td>
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        {sp.color_hex} (L={sp.luminance})
                      </td>
                      <td className="py-1.5 px-3 max-w-md truncate" title={sp.text}>
                        {sp.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
