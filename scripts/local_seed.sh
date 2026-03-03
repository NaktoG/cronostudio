#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

echo "==> Seed local database"
"$repo_root/scripts/db_seed.sh"
