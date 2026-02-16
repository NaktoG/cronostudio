#!/usr/bin/env bash
set -euo pipefail

./ops/tunnel_up.sh

# Lo mínimo: levantar stack actual
ansible vps -m shell -a 'set -e; cd /home/deploy/agentos; ./up.sh'
