// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarMonthGrid } from '@/components/calendar/CalendarMonthGrid';
import { UI_COPY } from '@/config/uiCopy';

describe('CalendarMonthGrid', () => {
  it('renders empty state without crashing', () => {
    render(
      <CalendarMonthGrid
        days={[{ dateKey: '2026-02-01', label: '01/02', isCurrentMonth: true }]}
        itemsByDay={{}}
      />
    );

    expect(screen.getByText(UI_COPY.calendar.emptyTitle)).toBeInTheDocument();
  });
});
