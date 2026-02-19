// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PriorityActions from '@/app/components/PriorityActions';
import type { PendingActionItem } from '@/domain/types/actions';

describe('PriorityActions', () => {
  it('renders distinct primary and secondary CTAs', () => {
    const actions: PendingActionItem[] = [
      {
        id: 'action-1',
        type: 'script',
        title: 'Continuar guión',
        productionTitle: 'Demo',
        productionId: 'prod-1',
        urgency: 'high',
        stage: 'scripting',
        primaryCta: { label: 'Continuar', href: '/productions/prod-1' },
        secondaryCta: { label: 'Ver en pipeline', href: '/?stage=scripting' },
      },
    ];

    render(<PriorityActions actions={actions} />);
    const primary = screen.getByText('Continuar');
    const secondary = screen.getByText('Ver en pipeline');
    expect(primary.textContent).not.toEqual(secondary.textContent);
  });

  it('fires primary and secondary handlers', () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    const actions: PendingActionItem[] = [
      {
        id: 'action-2',
        type: 'seo',
        title: 'Optimizar SEO',
        productionTitle: 'Demo',
        productionId: 'prod-2',
        urgency: 'medium',
        stage: 'publishing',
        primaryCta: { label: 'Optimizar', href: '/productions/prod-2' },
        secondaryCta: { label: 'Ver en pipeline', href: '/?stage=publishing' },
      },
    ];

    render(<PriorityActions actions={actions} onActionPrimaryClick={onPrimary} onActionSecondaryClick={onSecondary} />);
    fireEvent.click(screen.getByText('Optimizar'));
    fireEvent.click(screen.getByText('Ver en pipeline'));
    expect(onPrimary).toHaveBeenCalledWith(actions[0]);
    expect(onSecondary).toHaveBeenCalledWith(actions[0]);
  });
});
