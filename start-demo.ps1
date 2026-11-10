$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== PayGuard Sentinel - Automated Local Build & Launch ===" -ForegroundColor Cyan

# 1. Backend Setup
$BackendDir = Join-Path $RootDir "backend"
Set-Location $BackendDir

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[Backend] Created default .env from .env.example (Zero-Config Sandbox Mode ready)"
}

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "[Backend] Creating Python virtual environment (.venv)..."
    python -m venv .venv
}

Write-Host "[Backend] Installing Python dependencies..."
& .\.venv\Scripts\python.exe -m pip install --upgrade pip --quiet
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt --quiet

# 2. Frontend Setup
$FrontendDir = Join-Path $RootDir "frontend"
Set-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "[Frontend] Installing Node.js dependencies (npm install)..."
    npm install
}

# 3. Launch Both Servers
Write-Host "[Launch] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process -WorkingDirectory $BackendDir -FilePath (Join-Path $BackendDir ".venv\Scripts\python.exe") -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000"

Write-Host "[Launch] Starting Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Green
Write-Host "Open http://localhost:3000 in your browser (Toggle ES / EN in the top-right bar)." -ForegroundColor Yellow
npm run dev
