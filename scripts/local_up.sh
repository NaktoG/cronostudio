#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"
infra_env_example="$repo_root/infra/docker/.env.example"
compose_file="$repo_root/infra/docker/docker-compose.yml"

if [[ ! -f "$infra_env" ]]; then
  if [[ ! -f "$infra_env_example" ]]; then
    echo "Falta $infra_env_example. No se puede generar $infra_env" >&2
    exit 1
  fi

  cp "$infra_env_example" "$infra_env"
  echo "==> Creado $infra_env desde .env.example"
fi

echo "==> Levantando infraestructura (persistente)"
if [[ "${ENABLE_LEGACY_N8N:-false}" == "true" ]]; then
  docker compose --profile legacy-n8n --env-file "$infra_env" -f "$compose_file" up -d
else
  docker compose --env-file "$infra_env" -f "$compose_file" up -d
fi
