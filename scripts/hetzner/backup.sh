#!/usr/bin/env bash
set -euo pipefail

# Configuración
BACKUP_ROOT="/var/backups/cronostudio"
RETENTION_DAYS="7"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

POSTGRES_CONTAINER="cronostudio-postgres"
POSTGRES_DB="${POSTGRES_DB:-cronostudio}"
POSTGRES_USER="${POSTGRES_USER:-crono}"

N8N_CONTAINER="cronostudio-n8n"
N8N_EXPORT_DIR="$BACKUP_ROOT/n8n"

mkdir -p "$BACKUP_ROOT/postgres" "$N8N_EXPORT_DIR"

echo "[backup] Dump Postgres..."
docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "$BACKUP_ROOT/postgres/${TIMESTAMP}.sql.gz"

echo "[backup] Exportar workflows n8n..."
docker exec "$N8N_CONTAINER" sh -c 'tar -czf - -C /home/node .n8n' > "$N8N_EXPORT_DIR/${TIMESTAMP}.tar.gz"

echo "[backup] Rotación (${RETENTION_DAYS} días)"
find "$BACKUP_ROOT" -type f -mtime +"$RETENTION_DAYS" -delete

echo "[backup] Listo"
