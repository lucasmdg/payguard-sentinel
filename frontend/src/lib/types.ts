export type Language = "es" | "en";

export type ViewId = "inbox" | "xray" | "canary" | "lab" | "paypal";

export interface PdfSpan {
  id: string;
  page: number;
  text: string;
  bbox: [number, number, number, number];
  norm_bbox: [number, number, number, number];
  font: string;
  font_size: number;
  color_hex: string;
  luminance: number;
  bg_luminance: number;
  is_microscopic: boolean;
  is_invisible: boolean;
  is_offpage: boolean;
  is_malicious: boolean;
  threat_reasons: string[];
}

export interface PdfPageInfo {
  page_number: number;
  width: number;
  height: number;
  preview_image_base64: string;
  span_count: number;
  malicious_span_count: number;
  spans: PdfSpan[];
}

export interface HiddenLayer {
  layer_type: string;
  page: number;
  bbox: [number, number, number, number] | null;
  norm_bbox: [number, number, number, number] | null;
  font: string;
  font_size: number;
  color_hex: string;
  luminance: number | null;
  bg_luminance?: number | null;
  decoded_payload: string;
  threat_reasons: string[];
}

export interface DomainAuditEntry {
  domain: string;
  severity: "CLEAN" | "CRITICAL" | string;
  flags: string[];
  non_ascii_chars: Array<{ char: string; codepoint: string; name: string }>;
}

export interface ExtractedInvoiceData {
  invoice_id: string;
  vendor_name: string;
  vendor_email: string | null;
  vendor_domain: string | null;
  all_visible_emails: string[];
  all_discovered_emails: string[];
  all_domains: string[];
  amount: number;
  currency: string;
  subtotal: number | null;
  tax: number | null;
  expected_total: number;
  arithmetic_valid: boolean;
  arithmetic_discrepancy_usd: number;
  iban: string | null;
}

export interface GeminiEnrichment {
  enabled: boolean;
  status: string;
  model: string;
  interaction_id?: string;
  latency_ms: number;
  usage?: Record<string, unknown>;
  error?: string;
  analysis_text: string | null;
}

export interface ForensicScanReport {
  filename: string;
  sha256: string;
  file_size_bytes: number;
  pdf_version: string;
  object_count: number;
  page_count: number;
  scan_duration_ms: number;
  scanned_at: string;
  engine_mode: string;
  risk_score: number;
  risk_level: "SAFE" | "WARNING" | "CRITICAL";
  paypal_firewall_clearance: boolean;
  threat_classification: string;
  recommended_action: string;
  plain_language_summary?: {
    es: string;
    en: string;
  };
  findings_summary: string[];
  extracted_invoice_data: ExtractedInvoiceData;
  hidden_layers_detected: HiddenLayer[];
  osint_domain_audit: {
    domains_inspected: DomainAuditEntry[];
    anomalies: DomainAuditEntry[];
    status: string;
  };
  font_size_distribution: Record<string, number>;
  color_luminance_matrix: Record<string, number>;
  info_metadata: Record<string, string>;
  xmp_metadata: string;
  xmp_poisoned: boolean;
  suspicious_actions: string[];
  pages: PdfPageInfo[];
  gemini_enrichment: GeminiEnrichment | null;
}

export interface InvoiceInboxRow {
  invoice_id: string;
  filename: string;
  vendor: string;
  vendor_email: string | null;
  vendor_domain: string | null;
  category: string;
  amount: number;
  currency: string;
  risk_score: number;
  risk_level: "SAFE" | "WARNING" | "CRITICAL";
  threat_classification: string;
  attack_vector: string;
  plain_language_summary?: {
    es: string;
    en: string;
  };
  paypal_firewall_clearance: boolean;
  is_blacklisted: boolean;
  hidden_layers_count: number;
  sha256: string;
  download_url: string;
  report_pdf_url: string;
}

export interface InvoiceInboxResponse {
  invoices: InvoiceInboxRow[];
  kpis: {
    total_count: number;
    total_amount: number;
    safe_count: number;
    safe_amount: number;
    blocked_count: number;
    blocked_amount: number;
  };
}

export interface PayPalHealth {
  connected: boolean;
  status: string;
  latency_ms: number | null;
  token_type?: string;
  scope?: string | null;
  app_id?: string | null;
  expires_in?: number | null;
  base_url?: string;
  last_checked: string | null;
  error: string | null;
}

export interface ConfigStatus {
  paypal_configured: boolean;
  paypal_client_id: string;
  paypal_client_secret: string;
  paypal_client_id_masked: string;
  paypal_client_secret_masked: string;
  paypal_base_url: string;
  gemini_configured: boolean;
  gemini_api_key_masked: string;
  engine_mode: string;
  paypal_health: PayPalHealth;
  firewall_stats: {
    scanned_count: number;
    blacklisted_invoices: string[];
    blacklisted_merchants: string[];
    total_prevented_loss_usd: number;
    total_settled_usd: number;
  };
  timestamp: string;
}

export interface CanaryTokenRecord {
  token_id: string;
  invoice_id: string;
  vendor_name: string;
  amount: number;
  currency: string;
  attacker_merchant: string;
  trap_url: string;
  hidden_payload: string;
  filename: string;
  download_url: string;
  sha256: string;
  size_bytes: number;
  armed_at: string;
  status: string;
  hit_count: number;
  preview_image_base64?: string;
}

export interface CanaryTelemetryEvent {
  event_id: string;
  timestamp: string;
  token_id: string;
  invoice_id: string;
  vendor_name: string;
  amount_protected_usd: number;
  attacker_merchant: string;
  http_method: string;
  reaction_latency_ms: number;
  tti_since_armed_ms: number;
  velocity_verdict: string;
  classification: string;
  user_agent: string;
  client_ip: string;
  x_forwarded_for: string;
  asn_fingerprint: string;
  query_params: Record<string, string>;
  captured_headers: Record<string, string>;
  extracted_payload: string;
  body_preview: string;
  countermeasure: string;
}

export interface CanaryTelemetrySnapshot {
  armed_tokens: CanaryTokenRecord[];
  latest_token_id: string | null;
  events: CanaryTelemetryEvent[];
  blacklisted_invoices: string[];
  blacklisted_merchants: string[];
}

export interface PayPalOrderResponse {
  firewall_clearance: string;
  risk_score?: number;
  order_id: string;
  status: string;
  invoice_id?: string;
  invoice_ids?: string[];
  item_count?: number;
  paypal_invoice_ref?: string;
  amount?: number;
  total_amount?: number;
  currency: string;
  latency_ms: number;
  approval_url: string | null;
  links: Array<{ href: string; rel: string; method?: string }>;
  raw_response: Record<string, unknown>;
  created_at: string;
}

export interface PayPalBlockResponse {
  error: string;
  message: string;
  policy_code: string;
  invoice_id: string;
  vendor_name: string;
  risk_score: number;
  blacklisted: boolean;
  prevented_loss_usd: number;
  reasons: string[];
  timestamp: string;
}

export interface LedgerEvent {
  event_id: string;
  timestamp: string;
  type: string;
  order_id?: string;
  invoice_id: string;
  vendor_name: string;
  amount: number;
  currency: string;
  status: string;
  risk_score?: number;
  latency_ms?: number;
  approval_url?: string | null;
  detail: string;
}

export interface LedgerSnapshot {
  events: LedgerEvent[];
  blacklisted_invoices: string[];
  blacklisted_merchants: string[];
  total_prevented_loss_usd: number;
  total_settled_usd: number;
}
