// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdeas } from '@/hooks/useIdeas';
import type { IdeaUpdatePayload } from '@/domain/types';
import type { AuthFetch } from '@/services/types';

vi.mock('@/services/ideasService', () => ({
  ideasService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { ideasService } from '@/services/ideasService';

describe('useIdeas', () => {
  it('calls ideasService.update with payload', async () => {
    const authFetch: AuthFetch = vi.fn(async () => new Response());
    const payload: IdeaUpdatePayload = { title: 'Nuevo título', description: 'Nueva descripción' };

    const { result } = renderHook(() => useIdeas(authFetch, true));

    await act(async () => {
      await result.current.updateIdea('idea-1', payload);
    });

    expect(ideasService.update).toHaveBeenCalledWith(authFetch, 'idea-1', payload);
  });
});
