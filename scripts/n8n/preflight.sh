#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
env_file="$repo_root/infra/docker/.env"

if [[ ! -f "$env_file" ]]; then
  echo "Falta $env_file. Copia infra/docker/.env.example a infra/docker/.env" >&2
  exit 1
fi

set -a
source "$env_file"
set +a

echo "==> n8n preflight"
echo "CRONOSTUDIO_API_BASE_URL=${CRONOSTUDIO_API_BASE_URL:-}"

missing=()
for key in CRONOSTUDIO_API_BASE_URL CRONOSTUDIO_EMAIL CRONOSTUDIO_PASSWORD; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Faltan variables: ${missing[*]}"
else
  echo "Login CronoStudio..."
  status=$(curl -sS -o /tmp/cronostudio_n8n_login.json -w "%{http_code}\n" \
    -H "Content-Type: application/json" \
    -H "x-cronostudio-webhook-secret: ${CRONOSTUDIO_WEBHOOK_SECRET:-}" \
    -d "{\"email\":\"$CRONOSTUDIO_EMAIL\",\"password\":\"$CRONOSTUDIO_PASSWORD\"}" \
    "${CRONOSTUDIO_API_BASE_URL%/}/auth/login" || true)
  echo "Login status: $status"
fi

if [[ -z "${YOUTUBE_API_KEY:-}" ]]; then
  echo "YOUTUBE_API_KEY falta (sync channels/videos fallara)"
fi

if [[ -z "${YOUTUBE_ANALYTICS_ACCESS_TOKEN:-}" ]]; then
  echo "YOUTUBE_ANALYTICS_ACCESS_TOKEN falta (analytics fallara)"
fi

echo "==> n8n health"
curl -sS -o /tmp/cronostudio_n8n_healthz.json -w "%{http_code}\n" http://localhost:5678/healthz || true
