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
  login_url="${CRONOSTUDIO_API_BASE_URL%/}/auth/login"
  login_payload="{\"email\":\"$CRONOSTUDIO_EMAIL\",\"password\":\"$CRONOSTUDIO_PASSWORD\"}"
  if [[ "$login_url" == *"host.docker.internal"* ]]; then
    status=$(docker exec cronostudio-n8n sh -c "wget -qO /tmp/cronostudio_n8n_login.json --header='Content-Type: application/json' --header='x-cronostudio-webhook-secret: ${CRONOSTUDIO_WEBHOOK_SECRET:-}' --post-data='$login_payload' '$login_url' >/dev/null; echo \$?" || true)
    if [[ "$status" == "0" ]]; then
      echo "Login status: 200 (via n8n container)"
    else
      echo "Login status: error (via n8n container)"
    fi
  else
    status=$(curl -sS -o /tmp/cronostudio_n8n_login.json -w "%{http_code}\n" \
      -H "Content-Type: application/json" \
      -H "x-cronostudio-webhook-secret: ${CRONOSTUDIO_WEBHOOK_SECRET:-}" \
      -d "$login_payload" \
      "$login_url" || true)
    echo "Login status: $status"
  fi
fi

echo "YouTube API Key: not required (OAuth via CronoStudio)"

echo "YouTube Analytics token: not required (OAuth via CronoStudio)"

echo "==> n8n health"
curl -sS -o /tmp/cronostudio_n8n_healthz.json -w "%{http_code}\n" http://localhost:5678/healthz || true
