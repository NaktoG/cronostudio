export type CalendarItemType = 'production' | 'short' | 'social';

export interface CalendarItem {
  id: string;
  title: string;
  type: CalendarItemType;
  scheduledAt: string;
  status: string;
  route: string;
}

export interface CalendarDay {
  dateKey: string;
  label: string;
  isCurrentMonth: boolean;
}

export interface CalendarResponse {
  items: CalendarItem[];
}
