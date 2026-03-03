#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"
compose_file="$repo_root/infra/docker/docker-compose.yml"

backup_dir="$repo_root/backups"
timestamp=$(date +%Y%m%d_%H%M%S)
backup_file="$backup_dir/cronostudio_${timestamp}.sql"

confirm=${1:-}
if [[ "$confirm" != "--yes" ]]; then
  echo "Esto BORRA los volumenes de Postgres y n8n."
  echo "Se creara un backup en $backup_file"
  read -r -p "Continuar? [y/N] " reply
  if [[ "$reply" != "y" && "$reply" != "Y" ]]; then
    echo "Cancelado."
    exit 0
  fi
fi

mkdir -p "$backup_dir"

echo "==> Backup DB"
if [[ -f "$infra_env" ]]; then
  set -a
  source "$infra_env"
  set +a
fi

docker exec cronostudio-postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-postgres}" > "$backup_file"

echo "==> Bajar infraestructura y borrar volumenes"
if [[ -f "$infra_env" ]]; then
  docker compose --env-file "$infra_env" -f "$compose_file" down -v
else
  docker compose -f "$compose_file" down -v
fi

echo "Reset completo. Backup: $backup_file"
