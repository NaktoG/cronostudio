#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(process.cwd());
const workflowsDir = path.join(repoRoot, 'n8n', 'workflows');
const envFile = path.join(repoRoot, 'infra', 'docker', '.env');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

function extractEnvRefs(obj) {
  const refs = new Set();
  const stack = [obj];
  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;
    if (typeof item === 'string') {
      const matches = item.match(/\$env\.([A-Z0-9_]+)/g);
      if (matches) {
        for (const match of matches) {
          refs.add(match.replace('$env.', ''));
        }
      }
    } else if (Array.isArray(item)) {
      for (const entry of item) stack.push(entry);
    } else if (typeof item === 'object') {
      for (const value of Object.values(item)) stack.push(value);
    }
  }
  return Array.from(refs).sort();
}

const env = parseEnv(envFile);
const files = fs.readdirSync(workflowsDir).filter((f) => f.endsWith('.json'));

console.log('==> n8n workflow audit');
console.log(`Workflows: ${files.length}`);

for (const file of files) {
  const fullPath = path.join(workflowsDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const nodes = data.nodes || [];
  const envRefs = extractEnvRefs(nodes);
  const missingEnv = envRefs.filter((key) => !env[key]);
  const functionNodes = nodes.filter((n) => n.type === 'n8n-nodes-base.function');
  const functionMissing = functionNodes.filter((n) => !n.parameters || !n.parameters.functionCode);
  const youtubeNodes = nodes.filter((n) => n.type === 'n8n-nodes-base.httpRequest' && typeof n.parameters?.url === 'string' && n.parameters.url.includes('youtube'));
  const youtubeMissingParams = youtubeNodes.filter((n) => !n.parameters.url.includes('?'));
  const langchainNodes = nodes.filter((n) => typeof n.type === 'string' && n.type.includes('n8n-nodes-langchain'));

  console.log(`\n${data.name || file}`);
  if (envRefs.length) console.log(`  env: ${envRefs.join(', ')}`);
  if (missingEnv.length) console.log(`  missing env: ${missingEnv.join(', ')}`);
  if (functionMissing.length) console.log(`  missing function code: ${functionMissing.map((n) => n.name).join(', ')}`);
  if (youtubeMissingParams.length) console.log(`  youtube nodes missing params: ${youtubeMissingParams.map((n) => n.name).join(', ')}`);
  if (langchainNodes.length) console.log('  requires LangChain community nodes');
}
