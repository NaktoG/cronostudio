#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.OBS_PORT || 7071;
const LOG_PATH = path.resolve(process.cwd(), 'metrics.log');

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end('Only POST');
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    try {
      const payload = JSON.parse(body || '{}');
      const line = `[${new Date().toISOString()}] ${payload.name}=${payload.value} tags=${JSON.stringify(payload.tags || {})}`;
      console.log(line);
      fs.appendFileSync(LOG_PATH, line + '\n');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Metrics server listening on http://localhost:${PORT}`);
  console.log(`Appending logs to ${LOG_PATH}`);
});
