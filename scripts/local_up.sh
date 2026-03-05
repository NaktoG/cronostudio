#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"
compose_file="$repo_root/infra/docker/docker-compose.yml"

if [[ ! -f "$infra_env" ]]; then
  echo "Falta $infra_env. Copia infra/docker/.env.example a infra/docker/.env" >&2
  exit 1
fi

echo "==> Levantando infraestructura (persistente)"
docker compose --env-file "$infra_env" -f "$compose_file" up -d
