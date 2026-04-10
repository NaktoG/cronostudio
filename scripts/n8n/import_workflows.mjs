#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(process.cwd());
const workflowsDir = path.join(repoRoot, 'n8n', 'workflows');

const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
const apiKey = process.env.N8N_API_KEY;

if (!apiKey) {
  console.error('N8N_API_KEY no definido. Exporta la API key antes de ejecutar.');
  process.exit(1);
}

const includeFiles = new Set([
  'cronostudio-sync-channels.json',
  'cronostudio-sync-videos.json',
  'cronostudio-ingest-analytics-daily.json',
  'cronostudio-demo-seed-channels.json',
  'cronostudio-demo-seed-videos.json',
  'cronostudio-demo-seed-analytics.json',
]);

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': apiKey,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

function stripIds(workflow) {
  const cloned = JSON.parse(JSON.stringify(workflow));
  if (Array.isArray(cloned.nodes)) {
    cloned.nodes = cloned.nodes.map((node) => {
      const next = { ...node };
      delete next.id;
      return next;
    });
  }
  return cloned;
}

function toApiPayload(workflow) {
  return {
    name: workflow.name,
    nodes: workflow.nodes || [],
    connections: workflow.connections || {},
    settings: workflow.settings || {},
  };
}

async function run() {
  const files = fs.readdirSync(workflowsDir).filter((f) => includeFiles.has(f));
  if (files.length === 0) {
    console.log('No se encontraron workflows para importar.');
    return;
  }

  const existing = await request('/api/v1/workflows');
  const existingByName = new Map(
    (existing?.data || []).map((w) => [w.name, w])
  );

  for (const file of files) {
    const fullPath = path.join(workflowsDir, file);
    const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const workflow = stripIds(raw);
    const payload = toApiPayload(workflow);

    if (existingByName.has(workflow.name)) {
      console.log(`[skip] ${workflow.name} (ya existe)`);
      continue;
    }

    await request('/api/v1/workflows', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log(`[create] ${workflow.name}`);
  }
}

run().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
