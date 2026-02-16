#!/usr/bin/env bash
set -euo pipefail

# Si ya está escuchando, no hace nada
if lsof -nP -iTCP:2222 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Tunnel OK (2222 already listening)"
  exit 0
fi

echo "Starting SSH tunnel on 2222..."
ssh -fN \
  -i ~/.ssh/id_ed25519 \
  -o IdentitiesOnly=yes \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -L 2222:localhost:22 \
  deploy@89.167.30.137

sleep 0.5
lsof -nP -iTCP:2222 -sTCP:LISTEN
echo "Tunnel READY"
