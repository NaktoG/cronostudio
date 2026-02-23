#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(process.cwd());
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

const env = parseEnv(envFile);
const rawBaseUrl = env.CRONOSTUDIO_API_BASE_URL || 'http://localhost:3000/api';
const baseUrl = rawBaseUrl.includes('host.docker.internal')
  ? 'http://localhost:3000/api'
  : rawBaseUrl.replace(/\/$/, '');
const webhookSecret = env.CRONOSTUDIO_WEBHOOK_SECRET || '';

if (!webhookSecret) {
  console.error('CRONOSTUDIO_WEBHOOK_SECRET no esta definido en infra/docker/.env');
  process.exit(1);
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-cronostudio-webhook-secret': webhookSecret,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data?.error ? data.error : response.statusText;
    throw new Error(`${response.status} ${message}`);
  }

  return data;
}

async function ensureChannel(channel) {
  try {
    const result = await request('/channels', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
    return result.id;
  } catch (error) {
    if (!String(error).includes('409')) throw error;
    const list = await request('/channels');
    const match = Array.isArray(list)
      ? list.find((item) => item.youtube_channel_id === channel.youtubeChannelId)
      : null;
    return match?.id || null;
  }
}

async function ensureVideo(video) {
  try {
    const result = await request('/videos', {
      method: 'POST',
      body: JSON.stringify(video),
    });
    return result.id;
  } catch (error) {
    if (!String(error).includes('409')) throw error;
    const list = await request(`/videos?channelId=${video.channelId}&limit=50&offset=0`);
    const data = Array.isArray(list?.data) ? list.data : [];
    const match = data.find((item) => item.youtube_video_id === video.youtubeVideoId);
    return match?.id || null;
  }
}

async function createAnalytics(entries) {
  for (const entry of entries) {
    await request('/analytics', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }
}

async function run() {
  const channels = [
    { name: 'Canal Demo A', youtubeChannelId: 'UCDEMO001' },
    { name: 'Canal Demo B', youtubeChannelId: 'UCDEMO002' },
  ];

  const channelIds = [];
  for (const channel of channels) {
    const id = await ensureChannel(channel);
    if (id) channelIds.push(id);
  }

  if (channelIds.length === 0) {
    console.log('No se pudo crear canales demo.');
    return;
  }

  const videoId = await ensureVideo({
    channelId: channelIds[0],
    youtubeVideoId: `DEMO_${channelIds[0].slice(0, 8)}`,
    title: 'Video Local',
    description: 'Video demo local',
    publishedAt: '2026-02-22T00:00:00Z',
  });

  if (!videoId) {
    console.log('No se pudo crear video demo.');
    return;
  }

  const analytics = [
    {
      videoId,
      date: '2026-02-22',
      views: 10,
      watchTimeMinutes: 15,
      avgViewDurationSeconds: 30,
    },
    {
      videoId,
      date: '2026-02-21',
      views: 8,
      watchTimeMinutes: 12,
      avgViewDurationSeconds: 28,
    },
  ];

  await createAnalytics(analytics);
  console.log('Demo seed completado.');
}

run().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
