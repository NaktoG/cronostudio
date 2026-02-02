#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Este script requiere sudo/root" >&2
  exit 1
fi

DOMAIN_MAIN=${1:-cronostudio.example.com}
DOMAIN_N8N=${2:-n8n.example.com}

CONFIG_SRC="$(cd "$(dirname "$0")"/../.. && pwd)/infra/nginx/cronostudio.conf"
CONFIG_DST="/etc/nginx/sites-available/cronostudio.conf"

if [[ ! -f "$CONFIG_SRC" ]]; then
  echo "No se encontró $CONFIG_SRC" >&2
  exit 1
fi

cp "$CONFIG_SRC" "$CONFIG_DST"
sed -i "s/cronostudio.example.com/$DOMAIN_MAIN/g" "$CONFIG_DST"
sed -i "s/n8n.example.com/$DOMAIN_N8N/g" "$CONFIG_DST"

ln -sf "$CONFIG_DST" /etc/nginx/sites-enabled/cronostudio.conf
rm -f /etc/nginx/sites-enabled/default

systemctl reload nginx

echo "Configuración copiada. Ejecuta certbot para los dominios:" "$DOMAIN_MAIN" "$DOMAIN_N8N"
