import { createHash } from 'crypto';

type WorkflowKey = 'youtube.sync.channels' | 'youtube.sync.videos';
type AuthVia = 'user' | 'service';

export type CutoverDecision = {
  mode: 'legacy_sync' | 'queue_only';
  percent: number;
  bucket: number;
  reason: string;
};

function parseBoolean(raw: string | undefined, fallback = false): boolean {
  if (!raw) return fallback;
  const value = raw.trim().toLowerCase();
  if (value === 'true' || value === '1' || value === 'yes' || value === 'on') return true;
  if (value === 'false' || value === '0' || value === 'no' || value === 'off') return false;
  return fallback;
}

function parsePercent(raw: string | undefined): number {
  const parsed = Number(raw ?? '0');
  if (!Number.isFinite(parsed)) return 0;
  if (parsed < 0) return 0;
  if (parsed > 100) return 100;
  return Math.floor(parsed);
}

function hashBucket(input: string): number {
  const digest = createHash('sha256').update(input).digest('hex').slice(0, 8);
  const num = Number.parseInt(digest, 16);
  return num % 100;
}

function workflowPercent(workflow: WorkflowKey): number {
  if (workflow === 'youtube.sync.channels') {
    return parsePercent(process.env.AUTOMATION_CUTOVER_YOUTUBE_SYNC_CHANNELS_PERCENT);
  }
  return parsePercent(process.env.AUTOMATION_CUTOVER_YOUTUBE_SYNC_VIDEOS_PERCENT);
}

export function decideAutomationCutover(
  tenantUserId: string,
  workflow: WorkflowKey,
  via: AuthVia,
  opts?: { serviceIntent?: boolean }
): CutoverDecision {
  const enabled = parseBoolean(process.env.AUTOMATION_CUTOVER_ENABLED, false);
  const killSwitch = parseBoolean(process.env.AUTOMATION_CUTOVER_KILL_SWITCH, false);
  const includeUserTraffic = parseBoolean(process.env.AUTOMATION_CUTOVER_INCLUDE_USER_REQUESTS, false);
  const percent = workflowPercent(workflow);
  const bucket = hashBucket(`${tenantUserId}:${workflow}`);

  if (!enabled) {
    return { mode: 'legacy_sync', percent, bucket, reason: 'cutover_disabled' };
  }
  if (killSwitch) {
    return { mode: 'legacy_sync', percent, bucket, reason: 'kill_switch' };
  }
  const serviceIntent = opts?.serviceIntent === true;
  if (via === 'user' && !includeUserTraffic && !serviceIntent) {
    return { mode: 'legacy_sync', percent, bucket, reason: 'user_traffic_excluded' };
  }
  if (percent <= 0) {
    return { mode: 'legacy_sync', percent, bucket, reason: 'percent_zero' };
  }
  if (bucket >= percent) {
    return { mode: 'legacy_sync', percent, bucket, reason: 'bucket_outside_percent' };
  }

  return { mode: 'queue_only', percent, bucket, reason: 'bucket_selected' };
}
