// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveContentList from '@/app/components/ActiveContentList';
import type { ActiveContentItem } from '@/domain/types';
import { UI_COPY } from '@/config/uiCopy';

describe('ActiveContentList', () => {
  it('renders ideas and triggers onIdeaClick', () => {
    const onIdeaClick = vi.fn();
    const items: ActiveContentItem[] = [
      {
        kind: 'idea',
        id: 'idea-1',
        title: 'CronoPadel',
        description: 'Idea preview',
        status: 'draft',
        score: 2,
      },
    ];

    render(
      <ActiveContentList
        items={items}
        activeStage="idea"
        onIdeaClick={onIdeaClick}
        onViewAllIdeas={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('CronoPadel'));
    expect(onIdeaClick).toHaveBeenCalledWith('idea-1');
  });

  it('shows empty ideas copy when no items', () => {
    render(
      <ActiveContentList
        items={[]}
        activeStage="idea"
        onCreateIdea={vi.fn()}
      />
    );

    expect(screen.getByText(UI_COPY.activeContent.ideasEmptyTitle)).toBeInTheDocument();
  });
});
