// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductionsList from '@/app/components/ProductionsList';
import type { Production } from '@/domain/types';

describe('ProductionsList', () => {
  it('calls onProductionClick when a card is clicked', () => {
    const onProductionClick = vi.fn();
    const productions: Production[] = [
      {
        id: 'prod-1',
        title: 'Demo production',
        status: 'scripting',
        shorts_count: 0,
        shorts_published: 0,
        posts_count: 0,
        posts_published: 0,
        updated_at: '2026-02-19T10:00:00.000Z',
      },
    ];

    render(<ProductionsList productions={productions} onProductionClick={onProductionClick} />);
    fireEvent.click(screen.getByText('Demo production'));
    expect(onProductionClick).toHaveBeenCalledWith(productions[0]);
  });
});
