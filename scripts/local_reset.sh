#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"
compose_file="$repo_root/infra/docker/docker-compose.yml"

backup_dir="$repo_root/backups"
timestamp=$(date +%Y%m%d_%H%M%S)
backup_file="$backup_dir/cronostudio_${timestamp}.sql"

confirm=${1:-}
if [[ "$confirm" != "--i-know" ]]; then
  echo "Bloqueado: local_reset borra datos persistentes." >&2
  echo "Para un reset intencional, ejecuta:" >&2
  echo "  ./scripts/local_reset.sh --i-know" >&2
  exit 1
fi

mkdir -p "$backup_dir"

echo "==> Backup DB"
"$repo_root/scripts/local_backup_db.sh"

echo "==> Bajar infraestructura y borrar volumenes"
if [[ -f "$infra_env" ]]; then
  docker compose --env-file "$infra_env" -f "$compose_file" down -v
else
  docker compose -f "$compose_file" down -v
fi

echo "Reset completo. Backup: $backup_file"
