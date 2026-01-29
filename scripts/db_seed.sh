#!/usr/bin/env bash
set -euo pipefail

root_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
env_file="${ENV_FILE:-$root_dir/infra/docker/.env}"
compose_file="$root_dir/infra/docker/docker-compose.yml"
seed_file="$root_dir/infra/docker/seed_demo_data.sql"

if [[ ! -f "$env_file" ]]; then
  echo "No se encontro $env_file. Copia infra/docker/.env.example a infra/docker/.env"
  exit 1
fi

if [[ ! -f "$seed_file" ]]; then
  echo "No se encontro $seed_file"
  exit 1
fi

set -a
source "$env_file"
set +a

: "${POSTGRES_DB:?POSTGRES_DB requerido}"
: "${POSTGRES_USER:?POSTGRES_USER requerido}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD requerido}"

psql_cmd=(docker compose -f "$compose_file" exec -T postgres env PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1)

cat "$seed_file" | "${psql_cmd[@]}" -f -

echo "Seed completado."
