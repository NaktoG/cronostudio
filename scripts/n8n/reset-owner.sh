#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: $0 <email_del_owner>" >&2
  exit 1
fi

EMAIL="$1"
REPO_ROOT="$(cd "$(dirname "$0")"/.. && pwd)"
COMPOSE_FILE="$REPO_ROOT/infra/docker/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker no está instalado" >&2
  exit 1
fi

cd "$REPO_ROOT/infra/docker"
echo "Reiniciando credenciales del owner de n8n ($EMAIL)..."
docker compose exec -T n8n n8n user-management:reset --instance-owner-email "$EMAIL"
echo "Listo. Revisa el enlace que imprime el comando para finalizar el proceso en la UI."
