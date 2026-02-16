#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

echo "==> (1) Ensuring SSH tunnel is up on :2222"
if ! lsof -nP -iTCP:2222 -sTCP:LISTEN >/dev/null 2>&1; then
  ./tunnel_up.sh
fi

echo "==> (2) Ansible ping"
ansible vps -i ops/inventory.ini -m ping

echo "==> (3) Run up.sh on VPS"
ansible vps -i ops/inventory.ini -m shell -a 'set -e; cd /home/deploy/agentos; ./up.sh'

echo "==> (4) Quick status"
ansible vps -i ops/inventory.ini -m shell -a 'docker ps | sed -n "1,15p"'
