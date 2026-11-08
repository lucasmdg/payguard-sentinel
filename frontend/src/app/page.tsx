"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from "lucide-react";
import EnterpriseShell from "@/components/EnterpriseShell";
import ViewAttackLab from "@/components/ViewAttackLab";
import ViewCanaryHunter from "@/components/ViewCanaryHunter";
import ViewInbox from "@/components/ViewInbox";
import ViewPayPalVault from "@/components/ViewPayPalVault";
import ViewXRayInspector from "@/components/ViewXRayInspector";
import {
  buildCustomAdversarialPdf,
  capturePayPalOrder,
  createBatchPayPalOrder,
  createPayPalOrder,
  generateCanaryDocument,
  getCanaryTelemetry,
  getConfigStatus,
  getInvoicesInbox,
  getPayPalLedger,
  inspectPayPalOrder,
  scanInvoiceById,
  scanUploadedPdf,
  simulateAttackerBot,
  updateConfigKeys,
  verifyPayPalConnection,
} from "@/lib/api";
import type {
  CanaryTelemetrySnapshot,
  CanaryTokenRecord,
  ConfigStatus,
  ForensicScanReport,
  InvoiceInboxResponse,
  InvoiceInboxRow,
  Language,
  LedgerSnapshot,
  PayPalBlockResponse,
  PayPalOrderResponse,
  ViewId,
} from "@/lib/types";

interface ToastAlert {
  level: "safe" | "warning" | "critical";
  text: string;
}

export default function PayGuardSentinelApp() {
  const [lang, setLang] = useState<Language>("es");
  const [activeView, setActiveView] = useState<ViewId>("inbox");

  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [inbox, setInbox] = useState<InvoiceInboxResponse | null>(null);
  const [activeReport, setActiveReport] = useState<ForensicScanReport | null>(null);
  const [telemetry, setTelemetry] = useState<CanaryTelemetrySnapshot | null>(null);
  const [latestCanary, setLatestCanary] = useState<CanaryTokenRecord | null>(null);
  const [ledger, setLedger] = useState<LedgerSnapshot | null>(null);

  const [latestOrder, setLatestOrder] = useState<PayPalOrderResponse | null>(null);
  const [batchOrder, setBatchOrder] = useState<PayPalOrderResponse | null>(null);
  const [lastBlock, setLastBlock] = useState<PayPalBlockResponse | null>(null);

  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [batchPaying, setBatchPaying] = useState(false);
  const [executingPayPal, setExecutingPayPal] = useState(false);
  const [busyCanary, setBusyCanary] = useState(false);
  const [buildingCustom, setBuildingCustom] = useState(false);
  const [verifyingPayPal, setVerifyingPayPal] = useState(false);
  const [savingVault, setSavingVault] = useState(false);
  const [testingBlock, setTestingBlock] = useState(false);

  const [toast, setToast] = useState<ToastAlert | null>(null);

  const refreshAll = useCallback(async () => {
    const [cfg, ibx, tel, led] = await Promise.all([
      getConfigStatus(false),
      getInvoicesInbox(),
      getCanaryTelemetry(),
      getPayPalLedger(),
    ]);
    setConfig(cfg);
    setInbox(ibx);
    setTelemetry(tel);
    setLedger(led);
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        await refreshAll();
        // Preload INV-005 into X-Ray inspector so View 2 is immediately ready
        const defaultRep = await scanInvoiceById("INV-005");
        setActiveReport(defaultRep);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Backend no disponible en http://localhost:8000";
        setToast({ level: "critical", text: msg });
      } finally {
        setLoadingInbox(false);
      }
    };
    void boot();
  }, [refreshAll]);

  const handleInspectInvoice = useCallback(async (invoiceId: string) => {
    setActiveView("xray");
    setLoadingReport(true);
    try {
      const rep = await scanInvoiceById(invoiceId);
      setActiveReport(rep);
    } catch (err) {
      setToast({
        level: "critical",
        text: err instanceof Error ? err.message : "Error cargando factura",
      });
    } finally {
      setLoadingReport(false);
    }
  }, []);

  const handleUploadPdf = useCallback(
    async (file: File) => {
      setUploadingPdf(true);
      try {
        const rep = await scanUploadedPdf(file);
        setActiveReport(rep);
        await refreshAll();
        setActiveView("xray");
        setToast({
          level: rep.risk_score < 25 ? "safe" : "critical",
          text:
            lang === "es"
              ? `PDF analizado: ${rep.filename} (Riesgo ${rep.risk_score}/100)`
              : `PDF analyzed: ${rep.filename} (Risk ${rep.risk_score}/100)`,
        });
      } catch (err) {
        setToast({
          level: "critical",
          text: err instanceof Error ? err.message : "Error al analizar PDF",
        });
      } finally {
        setUploadingPdf(false);
      }
    },
    [lang, refreshAll]
  );

  const handleBatchPayPal = useCallback(
    async (rows: InvoiceInboxRow[]) => {
      if (rows.length === 0) return;
      setBatchPaying(true);
      try {
        const payload = rows.map((r) => ({
          invoice_id: r.invoice_id,
          vendor_name: r.vendor,
          vendor_email: r.vendor_email,
          amount: r.amount,
          currency: r.currency,
          sha256: r.sha256,
          risk_score: r.risk_score,
        }));
        const res = await createBatchPayPalOrder(payload);
        if (res.ok) {
          setBatchOrder(res.data);
          setLatestOrder(res.data);
          setLastBlock(null);
          setToast({
            level: "safe",
            text:
              lang === "es"
                ? `Orden PayPal Sandbox creada: ${res.data.order_id} (${res.data.item_count} facturas)`
                : `PayPal Sandbox batch order created: ${res.data.order_id} (${res.data.item_count} invoices)`,
          });
        } else {
          setLastBlock(res.block);
          setToast({
            level: "critical",
            text: `HTTP 403 FIREWALL: ${res.block.message} (${res.block.invoice_id})`,
          });
        }
        await refreshAll();
      } catch (err) {
        setToast({
          level: "critical",
          text: err instanceof Error ? err.message : "Error en pago por lotes PayPal",
        });
      } finally {
        setBatchPaying(false);
      }
    },
    [lang, refreshAll]
  );

  const handlePaySingleSafe = useCallback(async () => {
    if (!activeReport) return;
    setExecutingPayPal(true);
    try {
      const inv = activeReport.extracted_invoice_data;
      const res = await createPayPalOrder({
        invoice_id: inv.invoice_id,
        vendor_name: inv.vendor_name,
        vendor_email: inv.vendor_email,
        amount: inv.amount,
        currency: inv.currency,
        sha256: activeReport.sha256,
        risk_score: activeReport.risk_score,
      });
      if (res.ok) {
        setLatestOrder(res.data);
        setLastBlock(null);
        setToast({
          level: "safe",
          text:
            lang === "es"
              ? `Orden PayPal autorizada: ${res.data.order_id} ($${inv.amount.toFixed(2)})`
              : `PayPal order authorized: ${res.data.order_id} ($${inv.amount.toFixed(2)})`,
        });
      } else {
        setLastBlock(res.block);
        setToast({
          level: "critical",
          text: `HTTP 403 BLOCKED: ${res.block.reasons.join(" | ")}`,
        });
      }
      await refreshAll();
    } catch (err) {
      setToast({
        level: "critical",
        text: err instanceof Error ? err.message : "PayPal order error",
      });
    } finally {
      setExecutingPayPal(false);
    }
  }, [activeReport, lang, refreshAll]);

  const handleDeployCanaryFromXray = useCallback(async () => {
    if (!activeReport) return;
    setBusyCanary(true);
    try {
      const inv = activeReport.extracted_invoice_data;
      const doc = await generateCanaryDocument({
        invoice_id: inv.invoice_id,
        vendor_name: inv.vendor_name,
        amount: inv.amount,
        currency: inv.currency,
        attacker_merchant:
          inv.all_discovered_emails?.find((e) => e.includes("dark") || e.includes("offshore")) ||
          inv.vendor_email ||
          "merchant-9941@dark-settlement.io",
      });
      setLatestCanary(doc);
      await refreshAll();
      setActiveView("canary");
      setToast({
        level: "warning",
        text:
          lang === "es"
            ? `Documento cebo Canary generado (${doc.token_id}). Ya puedes simular el bot estafador.`
            : `Canary bait PDF armed (${doc.token_id}). Ready to simulate scammer bot.`,
      });
    } finally {
      setBusyCanary(false);
    }
  }, [activeReport, lang, refreshAll]);

  const handleGenerateCanaryInView = useCallback(
    async (row: InvoiceInboxRow) => {
      setBusyCanary(true);
      try {
        const doc = await generateCanaryDocument({
          invoice_id: row.invoice_id,
          vendor_name: row.vendor,
          amount: row.amount,
          currency: row.currency,
          attacker_merchant: row.vendor_email || "merchant-9941@dark-settlement.io",
        });
        setLatestCanary(doc);
        await refreshAll();
        setToast({
          level: "warning",
          text:
            lang === "es"
              ? `PDF Cebo armado: ${doc.filename} (Token ${doc.token_id})`
              : `Bait PDF armed: ${doc.filename} (Token ${doc.token_id})`,
        });
      } finally {
        setBusyCanary(false);
      }
    },
    [lang, refreshAll]
  );

  const handleSimulateBotInView = useCallback(
    async (row: InvoiceInboxRow) => {
      setBusyCanary(true);
      try {
        const matchingToken = telemetry?.armed_tokens?.find(
          (tok) => tok.invoice_id === row.invoice_id && tok.hit_count === 0
        );
        const targetTokenId =
          matchingToken?.token_id ||
          (latestCanary?.invoice_id === row.invoice_id ? latestCanary.token_id : null);

        const sim = await simulateAttackerBot({
          token_id: targetTokenId,
          auto_generate: !targetTokenId,
          invoice_id: row.invoice_id,
          vendor_name: row.vendor,
          amount: row.amount,
          attacker_merchant: row.vendor_email || "merchant-9941@dark-settlement.io",
        });
        if (sim.canary_document) {
          setLatestCanary(sim.canary_document);
        }
        await refreshAll();
        setToast({
          level: "critical",
          text:
            lang === "es"
              ? `Bot estafador capturado (${row.invoice_id}) — Cuenta bloqueada en el Firewall de PayPal`
              : `Scammer bot trapped (${row.invoice_id}) — Account permanently locked in PayPal Firewall`,
        });
      } finally {
        setBusyCanary(false);
      }
    },
    [lang, latestCanary, refreshAll, telemetry?.armed_tokens]
  );

  const handleCompileCustom = useCallback(
    async (payload: {
      vendor_name: string;
      amount_usd: number;
      currency: string;
      attack_type: string;
      hidden_prompt: string;
      invoice_id: string;
    }) => {
      setBuildingCustom(true);
      try {
        const rep = await buildCustomAdversarialPdf(payload);
        setActiveReport(rep);
        await refreshAll();
        setToast({
          level: rep.risk_score < 25 ? "safe" : "critical",
          text:
            lang === "es"
              ? `Prueba compilada y detectada: ${rep.extracted_invoice_data.invoice_id} (${rep.risk_score}/100)`
              : `Custom PDF compiled & scanned: ${rep.extracted_invoice_data.invoice_id} (${rep.risk_score}/100)`,
        });
        return rep;
      } finally {
        setBuildingCustom(false);
      }
    },
    [lang, refreshAll]
  );

  const handleRefreshPayPal = useCallback(async () => {
    setVerifyingPayPal(true);
    try {
      await verifyPayPalConnection();
      await refreshAll();
    } finally {
      setVerifyingPayPal(false);
    }
  }, [refreshAll]);

  const handleTestHttp403Block = useCallback(async () => {
    setTestingBlock(true);
    try {
      const res = await createPayPalOrder({
        invoice_id: "INV-005",
        vendor_name: "Logistica Global Express",
        vendor_email: "accounts@logisticaglobalexpress.com",
        amount: 4850.0,
        currency: "USD",
        risk_score: 98,
      });
      if (!res.ok) {
        setLastBlock(res.block);
        setToast({
          level: "critical",
          text: `HTTP 403 INTERLOCK VERIFIED: ${res.block.message}`,
        });
      }
      await refreshAll();
    } finally {
      setTestingBlock(false);
    }
  }, [refreshAll]);

  const handleInspectOrder = useCallback(async (orderId: string) => {
    const res = await inspectPayPalOrder(orderId);
    setLatestOrder((prev) =>
      prev && prev.order_id === orderId
        ? { ...prev, status: res.status, latency_ms: res.latency_ms, raw_response: res.raw_response }
        : prev
    );
  }, []);

  const handleCaptureOrder = useCallback(
    async (orderId: string) => {
      try {
        const res = await capturePayPalOrder(orderId);
        setLatestOrder((prev) =>
          prev && prev.order_id === orderId
            ? { ...prev, status: res.status, latency_ms: res.latency_ms, raw_response: res.raw_response }
            : prev
        );
        await refreshAll();
      } catch (err) {
        setToast({
          level: "warning",
          text:
            err instanceof Error
              ? err.message
              : "La orden requiere aprobacion en sandbox.paypal.com antes de capturar.",
        });
      }
    },
    [refreshAll]
  );

  const handleSaveKeys = useCallback(
    async (payload: {
      paypal_client_id: string;
      paypal_client_secret: string;
      paypal_base_url: string;
      gemini_api_key: string;
    }) => {
      setSavingVault(true);
      try {
        const updated = await updateConfigKeys(payload);
        setConfig(updated);
        setToast({
          level: updated.paypal_health.connected ? "safe" : "warning",
          text: updated.paypal_health.connected
            ? `PayPal Sandbox conectado (${updated.paypal_health.latency_ms} ms)`
            : `Claves guardadas (${updated.paypal_health.status})`,
        });
      } finally {
        setSavingVault(false);
      }
    },
    []
  );

  const blockedAmountTotal = inbox?.kpis?.blocked_amount ?? 27740.0;
  const settledAmountTotal = inbox?.kpis?.safe_amount ?? 2480.5;

  return (
    <EnterpriseShell
      lang={lang}
      onChangeLang={setLang}
      activeView={activeView}
      onSelectView={setActiveView}
      config={config}
      verifyingPayPal={verifyingPayPal}
      onRefreshPayPal={() => void handleRefreshPayPal()}
      blockedAmountTotal={blockedAmountTotal}
      settledAmountTotal={settledAmountTotal}
    >
      {/* Clean Dismissible Notification Banner */}
      {toast && (
        <div
          className={`mb-5 px-4 py-3 rounded-lg border flex items-center justify-between gap-3 text-sm font-medium shadow-card ${
            toast.level === "critical"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : toast.level === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.level === "critical" ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            ) : toast.level === "warning" ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="truncate">{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded hover:bg-black/5 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeView === "inbox" && (
        <ViewInbox
          lang={lang}
          inbox={inbox}
          loading={loadingInbox}
          uploading={uploadingPdf}
          batchPaying={batchPaying}
          batchOrder={batchOrder}
          onInspectInvoice={(id) => void handleInspectInvoice(id)}
          onUploadPdf={handleUploadPdf}
          onOpenLab={() => setActiveView("lab")}
          onExecuteBatchPayPal={handleBatchPayPal}
        />
      )}

      {activeView === "xray" && (
        <ViewXRayInspector
          lang={lang}
          invoices={inbox?.invoices ?? []}
          report={activeReport}
          loading={loadingReport}
          executingPayPal={executingPayPal}
          lastOrder={latestOrder}
          onSelectInvoiceId={(id) => void handleInspectInvoice(id)}
          onPaySafeInvoice={handlePaySingleSafe}
          onDeployCanary={handleDeployCanaryFromXray}
        />
      )}

      {activeView === "canary" && (
        <ViewCanaryHunter
          lang={lang}
          invoices={inbox?.invoices ?? []}
          telemetry={telemetry}
          latestCanary={latestCanary}
          busyCanary={busyCanary}
          onGenerateCanary={handleGenerateCanaryInView}
          onSimulateBot={handleSimulateBotInView}
        />
      )}

      {activeView === "lab" && (
        <ViewAttackLab
          lang={lang}
          building={buildingCustom}
          onCompileAndScan={handleCompileCustom}
          onOpenInXray={(rep) => {
            setActiveReport(rep);
            setActiveView("xray");
          }}
        />
      )}

      {activeView === "paypal" && (
        <ViewPayPalVault
          lang={lang}
          config={config}
          ledger={ledger}
          latestOrder={latestOrder}
          lastBlock={lastBlock}
          verifyingPayPal={verifyingPayPal}
          savingVault={savingVault}
          testingBlock={testingBlock}
          onRefreshPayPal={handleRefreshPayPal}
          onTestHttp403Block={handleTestHttp403Block}
          onInspectOrder={handleInspectOrder}
          onCaptureOrder={handleCaptureOrder}
          onSaveKeys={handleSaveKeys}
        />
      )}
    </EnterpriseShell>
  );
}
