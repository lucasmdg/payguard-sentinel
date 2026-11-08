# PayGuard Sentinel

**Institutional B2B Payment Firewall, Byte-Level PDF Forensic AST Engine & Canary Active Defense**

PayGuard Sentinel protects automated accounts-payable workflows and AI accounting agents against Indirect Prompt Injection, Unicode steganography, off-page PDF manipulation, Business Email Compromise (BEC), and autonomous scraper bots before funds ever touch PayPal.

---

## Key Capabilities

1. **Bilingual Enterprise Workstation (`ES / EN`)**: High-trust financial UI (`#F8FAFC` / `#FFFFFF` / PayPal `#003087` & `#0070BA`) organized into 5 focused views:
   - **Invoices & Payouts**: Filterable 12-invoice B2B inbox (`$30,220.50` dataset across safe invoices and multi-vector AI attacks), PDF upload scanning, and 1-click **Batch PayPal Sandbox** execution.
   - **X-Ray Forensic Inspector**: Side-by-side Human View vs. X-Ray AST layer inspection with numbered threat markers, pixel luminance contrast verification, math integrity auditing, and exportable Audit Report PDFs (`GET /api/forensics/report-pdf/{invoice_id}`).
   - **Anti-Bot Canary Trap**: Generates bait remittance PDFs embedded with hidden Canary Honeytokens and simulates autonomous bot extraction to capture IP, User-Agent, and sub-second reaction latency telemetry.
   - **Custom Attack Lab**: Compiles real PDFs testing 5 injection vectors (`white_text`, `offpage`, `homograph`, `math_fraud`, `base64`) and scans them live.
   - **PayPal Gateway & API Vault**: Live PayPal Sandbox OAuth2 telemetry, deterministic `HTTP 403 PAYPAL_FIREWALL_BLOCKED` interlock enforcement, order inspection/capture, and runtime credential overrides.

2. **Autonomous Local Forensic Engine (+ Optional Gemini Enrichment)**:
   - Deterministic Python AST/heuristic PDF analyzer (`PyMuPDF` + `ReportLab`) runs 100% locally out-of-the-box with zero external AI keys required.
   - Optionally supply a `GEMINI_API_KEY` at runtime to enrich forensic reports via Gemini `gemini-3.8-flash`.

---

## Architecture

- `/backend` — FastAPI API (`main.py`), PDF AST forensics & sample generator (`pdf_forensics.py`), Canary Honeytoken & async bot simulator (`canary_engine.py`), PayPal Sandbox REST v2 client (`paypal_client.py`), and runtime config manager (`config_store.py`).
- `/frontend` — Next.js 15 App Router + TypeScript + Tailwind CSS multi-view workstation.

---

## Quick Start

### 1. Configure Environment Variables

Copy the example file and add your own PayPal Sandbox credentials (never commit `.env`):

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
GEMINI_API_KEY=
```

### 2. Start Backend (Port 8000)

```bash
cd backend
uv venv .venv
# Linux / macOS: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

On startup, the backend automatically generates the 12 realistic B2B sample PDFs under `backend/samples/`, pre-scans all 12 documents, and verifies PayPal Sandbox OAuth2 connectivity.

### 3. Start Frontend (Port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.
