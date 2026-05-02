import { describe, expect, it } from 'vitest';

import { extractYouTubeId } from '@/app/hooks/useDashboardActions';

describe('extractYouTubeId', () => {
  it('returns id from standard youtube url', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=abc123XYZ')).toBe('abc123XYZ');
  });

  it('returns id from youtu.be url', () => {
    expect(extractYouTubeId('https://youtu.be/abc123XYZ')).toBe('abc123XYZ');
  });

  it('returns empty string for invalid urls', () => {
    expect(extractYouTubeId('not-a-url')).toBe('');
    expect(extractYouTubeId('')).toBe('');
  });
});
