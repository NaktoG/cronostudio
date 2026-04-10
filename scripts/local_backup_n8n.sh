#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
backup_dir="$repo_root/backups/n8n"
timestamp=$(date +%Y%m%d_%H%M%S)
output_dir="$backup_dir/$timestamp"

base_url=${N8N_BASE_URL:-http://localhost:5678}
api_key=${N8N_API_KEY:-}

if [[ -z "$api_key" ]]; then
  echo "N8N_API_KEY no definido. Exporta la API key antes de ejecutar." >&2
  exit 1
fi

mkdir -p "$output_dir"

export N8N_BASE_URL="$base_url"
export N8N_API_KEY="$api_key"
export N8N_BACKUP_DIR="$output_dir"

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
const apiKey = process.env.N8N_API_KEY;
const outputDir = process.env.N8N_BACKUP_DIR;

async function req(pathname) {
  const res = await fetch(`${baseUrl}/api/v1${pathname}`, {
    headers: { 'X-N8N-API-KEY': apiKey },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(JSON.stringify(data) || res.statusText);
  return data;
}

(async () => {
  const list = await req('/workflows');
  const items = list?.data || [];
  for (const wf of items) {
    const detail = await req(`/workflows/${wf.id}`);
    const fileName = `${wf.name.replace(/[^a-zA-Z0-9_-]+/g, '_')}_${wf.id}.json`;
    fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(detail, null, 2));
  }
  console.log(`Exportados ${items.length} workflows a ${outputDir}`);
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
NODE

echo "Backup n8n listo: $output_dir"
