import { describe, it, expect, beforeEach } from 'vitest';
import { decideAutomationCutover } from '@/lib/automation/cutover';

describe('automation cutover', () => {
  beforeEach(() => {
    delete process.env.AUTOMATION_CUTOVER_ENABLED;
    delete process.env.AUTOMATION_CUTOVER_KILL_SWITCH;
    delete process.env.AUTOMATION_CUTOVER_INCLUDE_USER_REQUESTS;
    delete process.env.AUTOMATION_CUTOVER_YOUTUBE_SYNC_CHANNELS_PERCENT;
    delete process.env.AUTOMATION_CUTOVER_YOUTUBE_SYNC_VIDEOS_PERCENT;
  });

  it('stays legacy when cutover disabled', () => {
    const decision = decideAutomationCutover('tenant-1', 'youtube.sync.channels', 'service');
    expect(decision.mode).toBe('legacy_sync');
    expect(decision.reason).toBe('cutover_disabled');
  });

  it('applies kill switch even if enabled', () => {
    process.env.AUTOMATION_CUTOVER_ENABLED = 'true';
    process.env.AUTOMATION_CUTOVER_KILL_SWITCH = 'true';
    process.env.AUTOMATION_CUTOVER_YOUTUBE_SYNC_CHANNELS_PERCENT = '100';

    const decision = decideAutomationCutover('tenant-1', 'youtube.sync.channels', 'service');
    expect(decision.mode).toBe('legacy_sync');
    expect(decision.reason).toBe('kill_switch');
  });

  it('excludes user traffic unless include flag or service intent', () => {
    process.env.AUTOMATION_CUTOVER_ENABLED = 'true';
    process.env.AUTOMATION_CUTOVER_YOUTUBE_SYNC_CHANNELS_PERCENT = '100';

    const userDecision = decideAutomationCutover('tenant-1', 'youtube.sync.channels', 'user');
    expect(userDecision.mode).toBe('legacy_sync');
    expect(userDecision.reason).toBe('user_traffic_excluded');

    const serviceIntentDecision = decideAutomationCutover('tenant-1', 'youtube.sync.channels', 'user', { serviceIntent: true });
    expect(serviceIntentDecision.mode).toBe('queue_only');
  });

  it('is deterministic for same tenant/workflow', () => {
    process.env.AUTOMATION_CUTOVER_ENABLED = 'true';
    process.env.AUTOMATION_CUTOVER_YOUTUBE_SYNC_VIDEOS_PERCENT = '50';

    const d1 = decideAutomationCutover('tenant-42', 'youtube.sync.videos', 'service');
    const d2 = decideAutomationCutover('tenant-42', 'youtube.sync.videos', 'service');
    expect(d1.bucket).toBe(d2.bucket);
    expect(d1.mode).toBe(d2.mode);
  });
});
