import type { CalendarDay, CalendarItem } from '@/domain/types/calendar';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

export const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatDayLabel = (date: Date): string => {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
};

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const startOfWeek = (date: Date): Date => {
  const day = date.getDay();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
};

const endOfWeek = (date: Date): Date => {
  const day = date.getDay();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - day));
};

export const buildMonthDays = (month: Date): CalendarDay[] => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: CalendarDay[] = [];
  for (let timestamp = gridStart.getTime(); timestamp <= gridEnd.getTime(); timestamp += MS_PER_DAY) {
    const date = new Date(timestamp);
    days.push({
      dateKey: formatDateKey(date),
      label: formatDayLabel(date),
      isCurrentMonth: date.getMonth() === month.getMonth(),
    });
  }
  return days;
};

export const groupCalendarItemsByDay = (items: CalendarItem[]): Record<string, CalendarItem[]> => {
  return items.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    const date = new Date(item.scheduledAt);
    const key = formatDateKey(date);
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});
};

export const getMonthRange = (month: Date): { from: Date; to: Date } => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  return { from: startOfWeek(monthStart), to: endOfWeek(monthEnd) };
};

export const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * MS_PER_DAY);

export const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
