#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:3000"}
API_BASE="$BASE_URL/api"

echo "==> Smoke test: $API_BASE"

echo "-> /api/health"
curl -sS -o /tmp/cronostudio_health.json -w "%{http_code}\n" "$API_BASE/health" | tail -n 1
cat /tmp/cronostudio_health.json

echo "-> /api/auth/login (expected 400)"
curl -sS -o /tmp/cronostudio_login.json -w "%{http_code}\n" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$API_BASE/auth/login" | tail -n 1
cat /tmp/cronostudio_login.json

echo "-> /api/health (n8n check)"
if command -v jq >/dev/null 2>&1; then
  jq -r '.services.n8n' /tmp/cronostudio_health.json || true
fi

echo "Smoke test complete."
