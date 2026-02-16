#!/usr/bin/env bash
set -euo pipefail

PORT=2222
TARGET_HOST=89.167.30.137
TARGET_USER=deploy
KEY_PATH=~/.ssh/id_ed25519

exec ssh -N \
  -i "${KEY_PATH}" \
  -o IdentitiesOnly=yes \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -L ${PORT}:localhost:22 \
  ${TARGET_USER}@${TARGET_HOST}
