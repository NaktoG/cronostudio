import { describe, it, expect } from 'vitest';
import { buildActiveContentItems } from '@/domain/mappers/activeContent';
import type { Idea, Production } from '@/domain/types';

describe('buildActiveContentItems', () => {
  it('returns ideas when stage is idea', () => {
    const ideas: Idea[] = [
      {
        id: 'idea-1',
        title: 'CronoPadel',
        description: 'Idea description',
        status: 'draft',
        priority: 3,
        tags: [],
        channel_name: null,
        created_at: '2026-02-19T00:00:00.000Z',
      },
    ];
    const productions: Production[] = [];

    const items = buildActiveContentItems({ stage: 'idea', productions, ideas });
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('idea');
    expect(items[0].title).toBe('CronoPadel');
  });

  it('returns filtered productions for non-idea stage', () => {
    const productions: Production[] = [
      {
        id: 'prod-1',
        title: 'Video A',
        status: 'editing',
        shorts_count: 0,
        shorts_published: 0,
        posts_count: 0,
        posts_published: 0,
        updated_at: '2026-02-19T00:00:00.000Z',
      },
      {
        id: 'prod-2',
        title: 'Video B',
        status: 'scripting',
        shorts_count: 0,
        shorts_published: 0,
        posts_count: 0,
        posts_published: 0,
        updated_at: '2026-02-19T00:00:00.000Z',
      },
    ];

    const items = buildActiveContentItems({ stage: 'editing', productions, ideas: [] });
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('production');
    expect(items[0].title).toBe('Video A');
  });
});
