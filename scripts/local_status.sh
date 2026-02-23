#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"
compose_file="$repo_root/infra/docker/docker-compose.yml"

echo "==> Docker containers"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "==> API health"
curl -sS -o /tmp/cronostudio_health.json -w "%{http_code}\n" http://localhost:3000/api/health || true
cat /tmp/cronostudio_health.json 2>/dev/null || true

echo ""
echo "==> n8n health"
curl -sS -o /tmp/cronostudio_n8n_healthz.json -w "%{http_code}\n" http://localhost:5678/healthz || true

echo ""
echo "==> Next.js dev server"
if pgrep -f "next dev" >/dev/null 2>&1; then
  echo "running"
else
  echo "not running"
fi

echo ""
echo "==> Recent dev log (last 20 lines)"
if [[ -f /tmp/cronostudio-dev.log ]]; then
  tail -n 20 /tmp/cronostudio-dev.log
else
  echo "no /tmp/cronostudio-dev.log"
fi
