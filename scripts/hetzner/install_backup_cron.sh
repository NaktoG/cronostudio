#!/usr/bin/env bash
set -euo pipefail

BACKUP_SCRIPT=${BACKUP_SCRIPT:-/usr/local/bin/cronostudio-backup}
CRON_PATH=${CRON_PATH:-/etc/cron.d/cronostudio-backup}

POSTGRES_CONTAINER=${POSTGRES_CONTAINER:-postgres_platform}
POSTGRES_DB=${POSTGRES_DB:-cronostudio_db}
POSTGRES_USER=${POSTGRES_USER:-cronostudio_user}
N8N_CONTAINER=${N8N_CONTAINER:-n8n}

echo "==> Installing backup cron: $CRON_PATH"
echo "0 2 * * * root POSTGRES_CONTAINER=$POSTGRES_CONTAINER POSTGRES_DB=$POSTGRES_DB POSTGRES_USER=$POSTGRES_USER N8N_CONTAINER=$N8N_CONTAINER $BACKUP_SCRIPT" | sudo tee "$CRON_PATH" >/dev/null

echo "==> Done"
