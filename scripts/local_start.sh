#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"
web_env="$repo_root/apps/web/.env.local"
compose_file="$repo_root/infra/docker/docker-compose.yml"

if [[ ! -f "$infra_env" ]]; then
  echo "Falta $infra_env. Copia infra/docker/.env.example a infra/docker/.env" >&2
  exit 1
fi

if [[ ! -f "$web_env" ]]; then
  echo "Falta $web_env. Copia apps/web/.env.example a apps/web/.env.local" >&2
  exit 1
fi

echo "==> Levantando infraestructura"
docker compose --env-file "$infra_env" -f "$compose_file" up -d

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
