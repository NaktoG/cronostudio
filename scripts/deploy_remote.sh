#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

DEPLOY_HOST=${DEPLOY_HOST:?"DEPLOY_HOST is required"}
DEPLOY_USER=${DEPLOY_USER:?"DEPLOY_USER is required"}
DEPLOY_PORT=${DEPLOY_PORT:-22}
DEPLOY_KEY=${DEPLOY_KEY:-"$HOME/.ssh/id_ed25519"}
DEPLOY_PATH=${DEPLOY_PATH:?"DEPLOY_PATH is required"}
DEPLOY_SERVICE_PATH=${DEPLOY_SERVICE_PATH:-"$(dirname "$DEPLOY_PATH")"}
DEPLOY_CMD=${DEPLOY_CMD:-"cd \"$DEPLOY_SERVICE_PATH\" && docker compose build && docker compose up -d"}

RSYNC_EXCLUDES=(
  ".git/"
  ".agentes/"
  "node_modules/"
  ".next/"
  "dist/"
  "out/"
  ".env"
  "infra/docker/docker-data/"
  "n8n/credentials/"
  "logs/"
  "*.log"
  ".DS_Store"
)

RSYNC_ARGS=(--delete -az)
for pattern in "${RSYNC_EXCLUDES[@]}"; do
  RSYNC_ARGS+=(--exclude "$pattern")
done

SSH_CMD=(ssh -p "$DEPLOY_PORT" -i "$DEPLOY_KEY" -o IdentitiesOnly=yes)

echo "==> Sync repo to $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"
rsync "${RSYNC_ARGS[@]}" -e "${SSH_CMD[*]}" "$ROOT_DIR/" "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

echo "==> Deploy: $DEPLOY_CMD"
"${SSH_CMD[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "$DEPLOY_CMD"

echo "==> Done"
