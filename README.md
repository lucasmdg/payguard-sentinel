# PayGuard Sentinel

**Institutional B2B Payment Firewall, Byte-Level PDF Forensic AST Engine & Canary Active Defense**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

PayGuard Sentinel is a full-stack B2B financial security application built for the **PayPal AI Hackathon**. It protects automated accounts-payable pipelines and AI accounting agents against Indirect Prompt Injection, invisible white-on-white typography, off-page PDF stream manipulation, Unicode zero-width steganography, Business Email Compromise (BEC), and autonomous scraper bots before funds are disbursed through PayPal.

---

## Judge Quick Start & Testing Guide

**Zero-Configuration Out-of-the-Box Guarantee:**
PayGuard Sentinel is engineered so hackathon judges can clone, build, and test **100% of the application immediately without requiring any external API keys**.
- **PDF Generation & Forensic AST Engine**: Runs 100% locally and deterministically using `PyMuPDF` (`fitz`) and `ReportLab`. On startup, the backend automatically compiles and scans all **12 realistic B2B invoice PDFs** (`INV-001` through `INV-012`).
- **PayPal Sandbox Integration**: If you provide your own PayPal Sandbox REST API credentials (`PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` in `backend/.env` or live inside View 5 **"PayPal & Keys"** in the UI), the application executes live OAuth2 handshakes and creates real orders against `https://api-m.sandbox.paypal.com`. If no credentials are provided, it automatically activates the **Built-in Local Sandbox Emulator** (`APP-JUDGE-LOCAL-SANDBOX`) so single orders, batch payouts, order inspection, capture, and `HTTP 403 PAYPAL_FIREWALL_BLOCKED` interlocks work out-of-the-box.
- **Optional Gemini Multimodal Enrichment**: Works 100% autonomously without a Gemini key; judges may optionally paste a `GEMINI_API_KEY` into View 5 at runtime to append Gemini `gemini-3.8-flash` multimodal analysis.

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and `npm`

---

### Option A: One-Command Automated Setup & Launch

#### macOS / Linux
```bash
git clone https://github.com/lucasmdg/payguard-sentinel.git
cd payguard-sentinel
chmod +x start-demo.sh
./start-demo.sh
```

#### Windows (PowerShell)
```powershell
git clone https://github.com/lucasmdg/payguard-sentinel.git
cd payguard-sentinel
.\start-demo.ps1
```

Once started, open **`http://localhost:3000`** in your browser.
*(Tip for English-speaking judges: click the **`EN`** button in the top-right navigation bar to switch the entire interface and forensic explanations from Spanish to English in one click).*

---

### Option B: Manual Step-by-Step Setup (2 Terminals)

#### Terminal 1 — Start the FastAPI Forensic & PayPal Backend (Port 8000)
```bash
cd backend

# Optional: copy .env.example to .env (or leave as-is for Zero-Config Sandbox Mode)
cp .env.example .env

# Create and activate virtual environment
python -m venv .venv
# On macOS/Linux:
source .venv/bin/activate
# On Windows PowerShell:
# .\.venv\Scripts\Activate.ps1

# Install dependencies and start server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```
Verify backend health at `http://localhost:8000/api/health`.

#### Terminal 2 — Start the Next.js Enterprise Workstation Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## Step-by-Step Interactive Walkthrough for Judges

After opening `http://localhost:3000` (and clicking **`EN`** in the top bar for English):

1. **View 1 — Invoices & Payouts (`Inbox`)**:
   - Inspect the executive KPI cards at the top: **12 Total Invoices (`$30,220.50`)**, **5 Safe Invoices Cleared for PayPal (`$2,480.50`)**, and **7 AI Attacks Blocked (`$27,740.00 Protected`)**.
   - Click **"Pay Safe Invoices with PayPal (5)"** to execute a batch PayPal settlement order across all 5 verified invoices (`INV-001` Cloudflare, `INV-002` AWS, `INV-003` Vercel, `INV-004` GitHub, `INV-011` FibraSur).
   - Click **"Inspect X-Ray"** on any invoice (or upload your own PDF) to open the deep forensic workbench.

2. **View 2 — X-Ray Inspector (`Forensic AST & Layer Decompiler`)**:
   - Select **`INV-005` (Logistica Global Express — `$4,850.00`)** or **`INV-006` (Suministros Industriales Norte — `$8,900.00`)**.
   - Compare the **Left Pane (What the Human Sees)** against the **Right Pane (X-Ray Hidden Layers Revealed)** with numbered red threat pins (`#1`, `#2`) exposing microscopic `0.8pt #FFFFFF` white-on-white prompt injections, off-page `(-500, -500)` coordinates, poisoned XMP metadata, Base64 jailbreaks (`INV-008`), homograph domain spoofing + `$70.00` VAT math fraud (`INV-007`), and zero-width Unicode steganography (`INV-009`).
   - Click **"Download Audit PDF"** to generate and download a printable **Executive Security & Fraud Audit Report PDF** (`GET /api/forensics/report-pdf/{invoice_id}`).

3. **View 3 — Anti-Bot Canary Trap (`Active Defense`)**:
   - Select any suspicious invoice and click **Step 1 ("Generate Bait PDF with Trap")** to compile a `Payment_Verification_Remittance_Advice.pdf` embedded with a hidden `1pt #FFFFFF` + XMP Canary Honeytoken URL.
   - Click **Step 2 ("Simulate Attacker Bot")** to dispatch a real headless Python/PyMuPDF bot that downloads the bait PDF, extracts the hidden trap URL, and triggers the callback in **`~150 ms`** (proving non-human velocity vs. 15–30s human reading time) and permanently blacklists the invoice and merchant in the PayPal Firewall.

4. **View 4 — Attack Lab (`Custom Adversarial PDF Compiler`)**:
   - Choose any of the **5 injection vectors** (`Invisible White Text 0.8pt`, `Off-Page (-500,-500) + XMP`, `Homograph Domain Spoofing`, `Intentional Math Fraud`, or `Base64 Footer Jailbreak`), customize the vendor, amount, and hidden LLM prompt, and click **"Compile & Scan Live"** to build a real binary PDF on disk and inspect its AST detection results.

5. **View 5 — PayPal & Keys (`Settlement Firewall & Runtime API Vault`)**:
   - Click **"Test HTTP 403 Block (INV-005)"** to verify deterministic firewall enforcement (`HTTP 403 PAYPAL_FIREWALL_BLOCKED` / `FINSEC-INTERLOCK-403`) preventing fraudulent payouts from reaching PayPal.
   - Inspect the live **PayPal Settlement & Security Ledger**, capture or inspect orders, or dynamically input your own `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, or `GEMINI_API_KEY` in the **Runtime API Vault** without restarting the server.

---

## 12-Invoice B2B Test Corpus Summary

| ID | Vendor | Amount (USD) | Expected Verdict | Attack Vector / Scenario |
| :--- | :--- | :--- | :--- | :--- |
| `INV-001` | Cloudflare Enterprise | `$340.00` | `SAFE` (4/100) | Legitimate B2B edge infrastructure invoice |
| `INV-002` | Amazon Web Services EMEA | `$1,120.50` | `SAFE` (2/100) | Legitimate cloud compute invoice |
| `INV-003` | Vercel Inc. | `$60.00` | `SAFE` (5/100) | Legitimate frontend hosting invoice |
| `INV-004` | GitHub Enterprise | `$420.00` | `SAFE` (3/100) | Legitimate developer seat subscription |
| `INV-005` | Logistica Global Express | `$4,850.00` | `CRITICAL` (98/100) | `0.8pt #FFFFFF` white-on-white Indirect Prompt Injection |
| `INV-006` | Suministros Industriales Norte | `$8,900.00` | `CRITICAL` (100/100) | Off-page `(-500, -500)` coordinates + poisoned XMP metadata |
| `INV-007` | PaypaI B2B Settlement Corp | `$1,290.00` | `CRITICAL` (100/100) | Homograph domain (`paypaI` with capital `I`) + `$70.00` VAT math fraud |
| `INV-008` | Consultoria Legal & Fiscal SL | `$3,400.00` | `CRITICAL` (100/100) | Base64-encoded LLM jailbreak payload hidden in footer |
| `INV-009` | 24/7 Urgent Server Recovery | `$6,200.00` | `CRITICAL` (100/100) | Zero-width Unicode steganography + executive urgency coercion |
| `INV-010` | Agencia Creativa MediaPro | `$950.00` | `CRITICAL` (98/100) | BEC duplicate invoice + unverified bank/PayPal destination hijack |
| `INV-011` | Telecomunicaciones FibraSur | `$540.00` | `SAFE` (8/100) | Legitimate fiber maintenance invoice |
| `INV-012` | Seguridad Integral Iberica | `$2,150.00` | `CRITICAL` (100/100) | Multi-layer AI agent hijack + Canary Honeytoken target |

---

## Repository Structure

```text
payguard-sentinel/
├── LICENSE                  # Open Source MIT License (detected by GitHub)
├── README.md                # Setup, architecture & judge testing guide
├── start-demo.ps1           # One-command setup & launch script (Windows PowerShell)
├── start-demo.sh            # One-command setup & launch script (macOS / Linux)
├── vercel.json              # Vercel Services multi-runtime configuration
├── backend/
│   ├── .env.example         # Sanitized environment template (zero secrets)
│   ├── main.py              # FastAPI endpoints & startup catalog warm-scanner
│   ├── pdf_forensics.py     # 12-invoice PDF generator, PyMuPDF AST analyzer & Audit PDF builder
│   ├── canary_engine.py     # Bait PDF generator, Honeytoken trap & headless bot simulator
│   ├── paypal_client.py     # PayPal Sandbox REST v2 client + Zero-Config Judge Emulator + 403 Firewall
│   ├── config_store.py      # Runtime API Vault state & ledger persistence
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── package.json         # Next.js 15 + React 19 + Tailwind CSS dependencies
    └── src/
        ├── app/             # Next.js App Router entrypoints
        ├── components/      # 5 Enterprise Daylight workspace views
        └── lib/             # Typed API client & bilingual (ES/EN) dictionary
```

---

## License

This project is open source and released under the **MIT License**. See the [LICENSE](LICENSE) file in the root of this repository for full license text.
