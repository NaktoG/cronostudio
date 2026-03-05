#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"

backup_file=${1:-}
if [[ -z "$backup_file" ]]; then
  echo "Uso: ./scripts/local_restore_db.sh <archivo.sql>" >&2
  exit 1
fi

if [[ ! -f "$backup_file" ]]; then
  echo "No existe: $backup_file" >&2
  exit 1
fi

if [[ -f "$infra_env" ]]; then
  set -a
  source "$infra_env"
  set +a
fi

echo "==> Restaurando DB desde $backup_file"
cat "$backup_file" | docker exec -i cronostudio-postgres psql -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-postgres}"
echo "Restore listo."
