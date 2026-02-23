#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"
compose_file="$repo_root/infra/docker/docker-compose.yml"

echo "==> Deteniendo Next.js"
pkill -f "next dev" || true

echo "==> Bajando infraestructura"
if [[ -f "$infra_env" ]]; then
  docker compose --env-file "$infra_env" -f "$compose_file" down
else
  docker compose -f "$compose_file" down
fi

echo "Listo."
