import type { CalendarItem as CalendarItemType } from '@/domain/types/calendar';
import { UI_COPY } from '@/config/uiCopy';

interface CalendarItemProps {
  item: CalendarItemType;
  onClick?: (item: CalendarItemType) => void;
}

export function CalendarItem({ item, onClick }: CalendarItemProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className="w-full text-left rounded-md border border-gray-800 bg-gray-900/60 px-2 py-1.5 text-xs text-slate-200 hover:border-yellow-500/40 hover:text-white transition"
      aria-label={`${item.title}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-semibold">{item.title}</span>
        <span className="text-[10px] text-slate-400">
          {UI_COPY.calendar.typeLabels[item.type] ?? item.type}
        </span>
      </div>
      <div className="mt-1 text-[10px] text-slate-500">
        {UI_COPY.calendar.statusLabel}: {item.status}
      </div>
    </button>
  );
}
