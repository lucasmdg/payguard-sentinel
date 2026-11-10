#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=== PayGuard Sentinel - Automated Local Build & Launch ==="

# 1. Backend Setup
cd "$ROOT_DIR/backend"
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "[Backend] Created default .env from .env.example (Zero-Config Sandbox Mode ready)"
fi

if [ ! -d ".venv" ]; then
  echo "[Backend] Creating Python virtual environment (.venv)..."
  python3 -m venv .venv
fi

echo "[Backend] Installing Python dependencies..."
./.venv/bin/pip install --upgrade pip -q
./.venv/bin/pip install -r requirements.txt -q

# 2. Frontend Setup
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo "[Frontend] Installing Node.js dependencies (npm install)..."
  npm install
fi

# 3. Launch Backend in background & Frontend in foreground
echo "[Launch] Starting FastAPI Backend on http://localhost:8000 ..."
cd "$ROOT_DIR/backend"
./.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

trap "kill $BACKEND_PID 2>/dev/null || true" EXIT

echo "[Launch] Starting Next.js Frontend on http://localhost:3000 ..."
echo "Open http://localhost:3000 in your browser (Switch to English 'EN' in the top-right bar)."
cd "$ROOT_DIR/frontend"
npm run dev
