import type { CalendarDay, CalendarItem } from '@/domain/types/calendar';
import { UI_COPY } from '@/config/uiCopy';
import { CalendarDayCell } from '@/components/calendar/CalendarDayCell';

interface CalendarMonthGridProps {
  days: CalendarDay[];
  itemsByDay: Record<string, CalendarItem[]>;
  onItemClick?: (item: CalendarItem) => void;
}

export function CalendarMonthGrid({ days, itemsByDay, onItemClick }: CalendarMonthGridProps) {
  const hasItems = days.some((day) => (itemsByDay[day.dateKey] ?? []).length > 0);

  return (
    <div className="space-y-4">
      {!hasItems && (
        <div className="surface-card glow-hover p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">{UI_COPY.calendar.emptyTitle}</h3>
          <p className="text-sm text-slate-400">{UI_COPY.calendar.emptyDescription}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {days.map((day) => (
          <CalendarDayCell
            key={day.dateKey}
            dateLabel={day.label}
            isCurrentMonth={day.isCurrentMonth}
            items={itemsByDay[day.dateKey] ?? []}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}
