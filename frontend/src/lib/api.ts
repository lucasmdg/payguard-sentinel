import type {
  CanaryTelemetrySnapshot,
  CanaryTokenRecord,
  ConfigStatus,
  ForensicScanReport,
  InvoiceInboxResponse,
  LedgerSnapshot,
  PayPalBlockResponse,
  PayPalHealth,
  PayPalOrderResponse,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

function getOriginBase(): string {
  if (API_BASE) return API_BASE;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(data?.detail || data?.message || `HTTP ${res.status}`) as Error & {
      status?: number;
      payload?: unknown;
    };
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data as T;
}

export async function getInvoicesInbox(): Promise<InvoiceInboxResponse> {
  const res = await fetch(`${API_BASE}/api/invoices`, { cache: "no-store" });
  return parseJsonOrThrow<InvoiceInboxResponse>(res);
}

export async function getConfigStatus(refreshPayPal = false): Promise<ConfigStatus> {
  const res = await fetch(`${API_BASE}/api/config/status?refresh_paypal=${refreshPayPal}`, {
    cache: "no-store",
  });
  return parseJsonOrThrow<ConfigStatus>(res);
}

export async function updateConfigKeys(payload: {
  paypal_client_id?: string;
  paypal_client_secret?: string;
  paypal_base_url?: string;
  gemini_api_key?: string;
}): Promise<ConfigStatus> {
  const res = await fetch(`${API_BASE}/api/config/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<ConfigStatus>(res);
}

export async function verifyPayPalConnection(): Promise<PayPalHealth> {
  const res = await fetch(`${API_BASE}/api/paypal/Verify-connection`, {
    cache: "no-store",
  });
  return parseJsonOrThrow<PayPalHealth>(res);
}

export async function scanInvoiceById(invoiceId: string): Promise<ForensicScanReport> {
  const res = await fetch(`${API_BASE}/api/forensics/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });
  return parseJsonOrThrow<ForensicScanReport>(res);
}

export async function scanUploadedPdf(file: File): Promise<ForensicScanReport> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/forensics/scan`, {
    method: "POST",
    body: form,
  });
  return parseJsonOrThrow<ForensicScanReport>(res);
}

export async function buildCustomAdversarialPdf(payload: {
  vendor_name: string;
  amount_usd: number;
  currency: string;
  attack_type: string;
  hidden_prompt: string;
  invoice_id: string;
}): Promise<ForensicScanReport> {
  const res = await fetch(`${API_BASE}/api/forensics/build-custom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow<ForensicScanReport>(res);
}

export async function generateCanaryDocument(payload: {
  invoice_id: string;
  vendor_name: string;
  amount: number;
  currency?: string;
  attacker_merchant?: string;
}): Promise<CanaryTokenRecord> {
  const res = await fetch(`${API_BASE}/api/canary/generate-document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, base_url: getOriginBase() }),
  });
  return parseJsonOrThrow<CanaryTokenRecord>(res);
}

export async function simulateAttackerBot(payload: {
  token_id?: string | null;
  auto_generate?: boolean;
  invoice_id?: string;
  vendor_name?: string;
  amount?: number;
  attacker_merchant?: string;
}): Promise<{
  simulation_status: string;
  token_id: string;
  extracted_trap_url: string;
  bot_user_agent: string;
  telemetry_event: unknown;
  canary_document?: CanaryTokenRecord;
}> {
  const res = await fetch(`${API_BASE}/api/canary/simulate-attacker-bot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, base_url: getOriginBase() }),
  });
  return parseJsonOrThrow(res);
}

export async function getCanaryTelemetry(): Promise<CanaryTelemetrySnapshot> {
  const res = await fetch(`${API_BASE}/api/canary/telemetry`, { cache: "no-store" });
  return parseJsonOrThrow<CanaryTelemetrySnapshot>(res);
}

export async function createPayPalOrder(payload: {
  invoice_id: string;
  vendor_name: string;
  vendor_email?: string | null;
  amount: number;
  currency?: string;
  sha256?: string;
  risk_score?: number;
}): Promise<{ ok: true; data: PayPalOrderResponse } | { ok: false; status: number; block: PayPalBlockResponse }> {
  const res = await fetch(`${API_BASE}/api/paypal/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.status === 403) {
    return { ok: false, status: 403, block: data as PayPalBlockResponse };
  }
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || `PayPal HTTP ${res.status}`);
  }
  return { ok: true, data: data as PayPalOrderResponse };
}

export async function createBatchPayPalOrder(
  items: Array<{
    invoice_id: string;
    vendor_name: string;
    vendor_email?: string | null;
    amount: number;
    currency?: string;
    sha256?: string;
    risk_score?: number;
  }>
): Promise<{ ok: true; data: PayPalOrderResponse } | { ok: false; status: number; block: PayPalBlockResponse }> {
  const res = await fetch(`${API_BASE}/api/paypal/create-batch-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  if (res.status === 403) {
    return { ok: false, status: 403, block: data as PayPalBlockResponse };
  }
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || `PayPal HTTP ${res.status}`);
  }
  return { ok: true, data: data as PayPalOrderResponse };
}

export async function inspectPayPalOrder(orderId: string): Promise<{
  order_id: string;
  status: string;
  latency_ms: number;
  raw_response: Record<string, unknown>;
}> {
  const res = await fetch(`${API_BASE}/api/paypal/order/${orderId}`, { cache: "no-store" });
  return parseJsonOrThrow(res);
}

export async function capturePayPalOrder(orderId: string): Promise<{
  order_id: string;
  status: string;
  latency_ms: number;
  raw_response: Record<string, unknown>;
}> {
  const res = await fetch(`${API_BASE}/api/paypal/capture-order/${orderId}`, { method: "POST" });
  return parseJsonOrThrow(res);
}

export async function getPayPalLedger(): Promise<LedgerSnapshot> {
  const res = await fetch(`${API_BASE}/api/paypal/ledger`, { cache: "no-store" });
  return parseJsonOrThrow<LedgerSnapshot>(res);
}
