import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..', '..');
const workflowsDir = path.join(repoRoot, 'n8n', 'workflows');
const dumpPath = path.join(workflowsDir, 'workflows_dump.json');
const exportsDir = path.join(workflowsDir, '_exports');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workflow';
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function listVersionedWorkflows() {
  const entries = fs.readdirSync(workflowsDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'workflows_dump.json') continue;
    if (entry.name === '_exports') continue;
    if (!entry.isFile()) continue;
    if (entry.name === 'README.md') continue;
    if (!entry.name.endsWith('.json')) continue;
    files.push(path.join(workflowsDir, entry.name));
  }
  return files;
}

function buildNameMap(files) {
  const map = new Map();
  for (const file of files) {
    try {
      const data = readJson(file);
      if (data && typeof data.name === 'string' && data.name.trim()) {
        map.set(data.name.trim(), file);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return map;
}

function sanitizeWorkflow(workflow) {
  const sanitized = { ...workflow };
  if ('pinData' in sanitized) delete sanitized.pinData;
  if ('staticData' in sanitized) delete sanitized.staticData;
  return sanitized;
}

function parseDumpLines() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Missing dump file at ${dumpPath}`);
  }
  const raw = fs.readFileSync(dumpPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSON on line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writePrettyJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function main() {
  ensureDir(exportsDir);

  const versionedFiles = listVersionedWorkflows();
  const nameMap = buildNameMap(versionedFiles);
  const dumpWorkflows = parseDumpLines();

  let updated = 0;
  let exported = 0;
  const names = [];

  for (const workflow of dumpWorkflows) {
    const name = typeof workflow?.name === 'string' ? workflow.name.trim() : '';
    if (!name) continue;
    names.push(name);

    const sanitized = sanitizeWorkflow(workflow);
    const existingPath = nameMap.get(name);
    if (existingPath) {
      writePrettyJson(existingPath, sanitized);
      updated += 1;
      continue;
    }

    let id = 'unknown';
    if (typeof workflow?.id === 'string' && workflow.id.trim()) {
      id = workflow.id.trim();
    } else if (typeof workflow?.id === 'number' && Number.isFinite(workflow.id)) {
      id = String(workflow.id);
    }
    const fileName = `${slugify(name)}-${id}.json`;
    const targetPath = path.join(exportsDir, fileName);
    writePrettyJson(targetPath, sanitized);
    exported += 1;
  }

  const summary = {
    updated,
    exported,
    names,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main();
