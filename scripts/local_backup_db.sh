#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"
backup_dir="$repo_root/backups"
timestamp=$(date +%Y%m%d_%H%M%S)
backup_file="$backup_dir/cronostudio_${timestamp}.sql"

mkdir -p "$backup_dir"

if [[ -f "$infra_env" ]]; then
  set -a
  source "$infra_env"
  set +a
fi

echo "==> Backup DB -> $backup_file"
docker exec cronostudio-postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-postgres}" > "$backup_file"

echo "Backup listo: $backup_file"
