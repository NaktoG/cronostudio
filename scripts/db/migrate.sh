#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")"/../.. && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/infra/migrations"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "No existe $MIGRATIONS_DIR" >&2
  exit 1
fi

connection_args=()
if [[ -n "${DATABASE_URL:-}" ]]; then
  connection_args=("$DATABASE_URL")
elif [[ -n "${POSTGRES_HOST:-}" ]]; then
  connection_args=("postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@${POSTGRES_HOST}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-postgres}")
else
  echo "Define DATABASE_URL o POSTGRES_HOST" >&2
  exit 1
fi

run_psql() {
  PGPASSWORD="${POSTGRES_PASSWORD:-}" psql "${connection_args[0]}" "$@"
}

run_psql <<'SQL'
CREATE TABLE IF NOT EXISTS public._migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

pending=()
shopt -s nullglob
for file in "$MIGRATIONS_DIR"/*.sql; do
  filename=$(basename "$file")
  applied=$(run_psql -t -c "SELECT 1 FROM public._migrations WHERE filename='${filename}'" | xargs)
  if [[ -z "$applied" ]]; then
    pending+=("$file")
  fi
done

if [[ ${#pending[@]} -eq 0 ]]; then
  echo "No hay migraciones pendientes"
  exit 0
fi

for file in "${pending[@]}"; do
  filename=$(basename "$file")
  echo "Ejecutando $filename"
  checksum=$(shasum -a 256 "$file" | awk '{print $1}')
  run_psql -v ON_ERROR_STOP=1 -f "$file"
  run_psql -c "INSERT INTO public._migrations (filename, checksum) VALUES ('$filename', '$checksum')"
done

echo "Migraciones completadas"
