#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Uso: $0 <usuario> <password>" >&2
  exit 1
fi

user="$1"
password="$2"

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl no está instalado en este equipo" >&2
  exit 1
fi

hash=$(openssl passwd -apr1 "$password")

cat <<EOF
Credenciales para Nginx / Basic Auth:

1. Agrega esta línea a /etc/nginx/.adminer_htpasswd (en el VPS) y recarga Nginx:

$user:$hash

2. Actualiza infra/docker/.env con:
   N8N_BASIC_AUTH_USER=$user
   N8N_BASIC_AUTH_PASSWORD=$password

3. Ejecuta docker compose -f infra/docker/docker-compose.yml up -d n8n para aplicar los cambios.

NO compartas este output en repositorios ni issues públicos.
EOF
