#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"
infra_env_example="$repo_root/infra/docker/.env.example"
web_env="$repo_root/apps/web/.env.local"
web_env_example="$repo_root/apps/web/.env.example"
compose_file="$repo_root/infra/docker/docker-compose.yml"

if [[ ! -f "$infra_env" ]]; then
  if [[ ! -f "$infra_env_example" ]]; then
    echo "Falta $infra_env_example. No se puede generar $infra_env" >&2
    exit 1
  fi

  cp "$infra_env_example" "$infra_env"
  echo "==> Creado $infra_env desde .env.example"
fi

if [[ ! -f "$web_env" ]]; then
  if [[ ! -f "$web_env_example" ]]; then
    echo "Falta $web_env_example. No se puede generar $web_env" >&2
    exit 1
  fi

  cp "$web_env_example" "$web_env"
  echo "==> Creado $web_env desde .env.example"
fi

echo "==> Levantando infraestructura"
if [[ "${ENABLE_LEGACY_N8N:-false}" == "true" ]]; then
  docker compose --profile legacy-n8n --env-file "$infra_env" -f "$compose_file" up -d
else
  docker compose --env-file "$infra_env" -f "$compose_file" up -d
fi

echo "==> Ejecutando migraciones"
"$repo_root/scripts/migrate.sh"

echo "==> Instalando dependencias web"
cd "$repo_root/apps/web"
npm install

echo "==> Iniciando Next.js (background)"
nohup npm run dev > /tmp/cronostudio-dev.log 2>&1 &

echo "==> Smoke test"
cd "$repo_root"
sleep 5
./scripts/smoke_test.sh

echo "Listo. Logs: /tmp/cronostudio-dev.log"
