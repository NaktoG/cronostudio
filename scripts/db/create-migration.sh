#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: $0 <descripcion_kebab-case>" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")"/../.. && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/infra/migrations"
mkdir -p "$MIGRATIONS_DIR"

timestamp=$(date +%Y%m%d%H%M)
filename="${timestamp}__${1}.sql"
filepath="$MIGRATIONS_DIR/$filename"

cat <<'SQL' > "$filepath"
-- Describe el cambio y dependencias aquí
-- Ejemplo: ALTER TABLE ideas ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;

BEGIN;

-- TODO

COMMIT;
SQL

echo "Creado $filepath"
