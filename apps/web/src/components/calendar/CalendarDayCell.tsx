import type { CalendarItem as CalendarItemType } from '@/domain/types/calendar';
import { CalendarItem } from '@/components/calendar/CalendarItem';

interface CalendarDayCellProps {
  dateLabel: string;
  isCurrentMonth: boolean;
  items: CalendarItemType[];
  onItemClick?: (item: CalendarItemType) => void;
}

export function CalendarDayCell({ dateLabel, isCurrentMonth, items, onItemClick }: CalendarDayCellProps) {
  return (
    <div
      className={`min-h-[110px] border border-gray-800 rounded-xl p-2 ${
        isCurrentMonth ? 'bg-gray-900/50' : 'bg-gray-950/40 text-slate-500'
      }`}
    >
      <div className="text-xs text-slate-400 mb-2">{dateLabel}</div>
      <div className="space-y-2">
        {items.map((item) => (
          <CalendarItem key={`${item.type}-${item.id}`} item={item} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
}
