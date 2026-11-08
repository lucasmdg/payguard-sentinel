from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
LOCAL_ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=LOCAL_ENV_PATH, override=False)

IS_SERVERLESS = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
if IS_SERVERLESS:
    ENV_PATH = Path(tempfile.gettempdir()) / ".payguard.env"
    SAMPLES_DIR = Path(tempfile.gettempdir()) / "payguard_samples"
else:
    ENV_PATH = LOCAL_ENV_PATH
    SAMPLES_DIR = BASE_DIR / "samples"

try:
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    SAMPLES_DIR = Path(tempfile.gettempdir()) / "payguard_samples"
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def mask_secret(value: str, visible_chars: int = 6) -> str:
    if not value:
        return ""
    if len(value) <= visible_chars * 2:
        return "*" * len(value)
    return f"{value[:visible_chars]}...{value[-4:]}"


@dataclass
class RuntimeConfig:
    paypal_client_id: str = field(default_factory=lambda: os.getenv("PAYPAL_CLIENT_ID", "").strip())
    paypal_client_secret: str = field(default_factory=lambda: os.getenv("PAYPAL_CLIENT_SECRET", "").strip())
    paypal_base_url: str = field(
        default_factory=lambda: os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com").strip().rstrip("/")
    )
    gemini_api_key: str = field(default_factory=lambda: os.getenv("GEMINI_API_KEY", "").strip())

    # OAuth2 token cache & health
    paypal_access_token: Optional[str] = None
    paypal_token_expires_at: float = 0.0
    paypal_last_health: dict[str, Any] = field(
        default_factory=lambda: {
            "connected": False,
            "status": "INITIALIZING",
            "latency_ms": None,
            "scope": None,
            "app_id": None,
            "expires_in": None,
            "last_checked": None,
            "error": None,
        }
    )

    # Shared Firewall & Forensic State
    scanned_reports_by_sha: dict[str, dict[str, Any]] = field(default_factory=dict)
    scanned_reports_by_invoice: dict[str, dict[str, Any]] = field(default_factory=dict)
    blacklisted_invoices: set[str] = field(default_factory=set)
    blacklisted_merchants: set[str] = field(default_factory=set)
    ledger_events: list[dict[str, Any]] = field(default_factory=list)
    total_prevented_loss_usd: float = 0.0
    total_settled_usd: float = 0.0

    def persist_env(self) -> None:
        lines = [
            f"PAYPAL_CLIENT_ID={self.paypal_client_id}",
            f"PAYPAL_CLIENT_SECRET={self.paypal_client_secret}",
            f"PAYPAL_BASE_URL={self.paypal_base_url}",
            f"GEMINI_API_KEY={self.gemini_api_key}",
        ]
        try:
            ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
        except OSError:
            pass

    def update_keys(
        self,
        paypal_client_id: Optional[str] = None,
        paypal_client_secret: Optional[str] = None,
        paypal_base_url: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
    ) -> None:
        if paypal_client_id is not None and paypal_client_id.strip():
            self.paypal_client_id = paypal_client_id.strip()
        if paypal_client_secret is not None and paypal_client_secret.strip():
            self.paypal_client_secret = paypal_client_secret.strip()
        if paypal_base_url is not None and paypal_base_url.strip():
            self.paypal_base_url = paypal_base_url.strip().rstrip("/")
        if gemini_api_key is not None:
            self.gemini_api_key = gemini_api_key.strip()

        # Invalidate cached OAuth2 token when credentials change
        self.paypal_access_token = None
        self.paypal_token_expires_at = 0.0
        self.persist_env()

    def get_engine_mode(self) -> str:
        if self.gemini_api_key:
            return "LOCAL_AST_HEURISTIC + GEMINI_3.8_FLASH"
        return "LOCAL_AST_HEURISTIC_AUTONOMOUS"

    def record_scan_result(self, report: dict[str, Any]) -> None:
        sha256 = report.get("sha256")
        extracted = report.get("extracted_invoice_data") or {}
        invoice_id = extracted.get("invoice_id")
        if sha256:
            self.scanned_reports_by_sha[sha256] = report
        if invoice_id:
            self.scanned_reports_by_invoice[invoice_id] = report

    def record_ledger_event(self, event: dict[str, Any]) -> None:
        self.ledger_events.insert(0, event)
        if len(self.ledger_events) > 100:
            self.ledger_events = self.ledger_events[:100]

    def get_status_payload(self) -> dict[str, Any]:
        return {
            "paypal_configured": bool(self.paypal_client_id and self.paypal_client_secret),
            "paypal_client_id": self.paypal_client_id,
            "paypal_client_secret": self.paypal_client_secret,
            "paypal_client_id_masked": mask_secret(self.paypal_client_id, 8),
            "paypal_client_secret_masked": mask_secret(self.paypal_client_secret, 6),
            "paypal_base_url": self.paypal_base_url,
            "gemini_configured": bool(self.gemini_api_key),
            "gemini_api_key_masked": mask_secret(self.gemini_api_key, 6) if self.gemini_api_key else "",
            "engine_mode": self.get_engine_mode(),
            "paypal_health": self.paypal_last_health,
            "firewall_stats": {
                "scanned_count": len(self.scanned_reports_by_sha),
                "blacklisted_invoices": sorted(self.blacklisted_invoices),
                "blacklisted_merchants": sorted(self.blacklisted_merchants),
                "total_prevented_loss_usd": round(self.total_prevented_loss_usd, 2),
                "total_settled_usd": round(self.total_settled_usd, 2),
            },
            "timestamp": utc_now_iso(),
        }


runtime_config = RuntimeConfig()
