#!/usr/bin/env bash
set -euo pipefail

root_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
env_file="${ENV_FILE:-$root_dir/infra/docker/.env}"
compose_file="$root_dir/infra/docker/docker-compose.yml"
migrations_dir="$root_dir/infra/docker"

if [[ ! -f "$env_file" ]]; then
  echo "No se encontro $env_file. Copia infra/docker/.env.example a infra/docker/.env"
  exit 1
fi

set -a
source "$env_file"
set +a

: "${POSTGRES_DB:?POSTGRES_DB requerido}"
: "${POSTGRES_USER:?POSTGRES_USER requerido}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD requerido}"

psql_cmd=(docker compose -f "$compose_file" exec -T postgres env PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1)

"${psql_cmd[@]}" -c "CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())"

compute_checksum() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    sha256sum "$1" | awk '{print $1}'
  fi
}

apply_migration() {
  local file="$1"
  local name
  name=$(basename "$file")
  local checksum
  checksum=$(compute_checksum "$file")

  local exists
  exists=$("${psql_cmd[@]}" -tAc "SELECT 1 FROM schema_migrations WHERE id = '$name'")
  if [[ "$exists" == "1" ]]; then
    echo "[skip] $name"
    return
  fi

  echo "[apply] $name"
  cat "$file" | "${psql_cmd[@]}" -f -
  "${psql_cmd[@]}" -c "INSERT INTO schema_migrations (id, checksum) VALUES ('$name', '$checksum')"
}

apply_migration "$migrations_dir/schema.sql"

for file in "$migrations_dir"/migration_*.sql; do
  [[ -f "$file" ]] || continue
  apply_migration "$file"
done

echo "Migraciones completas."
