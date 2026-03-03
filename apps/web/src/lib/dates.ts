export type IsoWeekInfo = {
  isoWeek: number;
  isoYear: number;
};

export function getIsoWeekInfo(date: Date): IsoWeekInfo {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);

  const day = tmp.getDay();
  const isoDay = day === 0 ? 7 : day;
  tmp.setDate(tmp.getDate() + 4 - isoDay);

  const isoYear = tmp.getFullYear();
  const yearStart = new Date(isoYear, 0, 1);
  const diff = tmp.getTime() - yearStart.getTime();
  const dayOfYear = Math.floor(diff / 86400000) + 1;
  const isoWeek = Math.ceil(dayOfYear / 7);

  return { isoWeek, isoYear };
}

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
}

export function getIsoWeekInfoInTimeZone(date: Date, timeZone: string): IsoWeekInfo {
  const parts = getZonedDateParts(date, timeZone);
  const tmp = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0));

  const day = tmp.getUTCDay();
  const isoDay = day === 0 ? 7 : day;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - isoDay);

  const isoYear = tmp.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const diff = tmp.getTime() - yearStart.getTime();
  const dayOfYear = Math.floor(diff / 86400000) + 1;
  const isoWeek = Math.ceil(dayOfYear / 7);

  return { isoWeek, isoYear };
}

export function getDateFromIsoWeek(isoYear: number, isoWeek: number): Date {
  const jan4 = new Date(isoYear, 0, 4);
  const day = jan4.getDay();
  const isoDay = day === 0 ? 7 : day;
  const mondayWeek1 = new Date(jan4.getTime());
  mondayWeek1.setDate(jan4.getDate() - (isoDay - 1));
  const target = new Date(mondayWeek1.getTime());
  target.setDate(mondayWeek1.getDate() + (isoWeek - 1) * 7);
  target.setHours(0, 0, 0, 0);
  return target;
}

export function startOfIsoWeek(date: Date): Date {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  const day = tmp.getDay();
  const isoDay = day === 0 ? 7 : day;
  tmp.setDate(tmp.getDate() - (isoDay - 1));
  return tmp;
}

export function startOfIsoWeekInTimeZone(date: Date, timeZone: string): Date {
  const parts = getZonedDateParts(date, timeZone);
  const tmp = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0));
  const day = tmp.getUTCDay();
  const isoDay = day === 0 ? 7 : day;
  tmp.setUTCDate(tmp.getUTCDate() - (isoDay - 1));
  return tmp;
}

export function endOfIsoWeek(date: Date): Date {
  const start = startOfIsoWeek(date);
  const end = new Date(start.getTime());
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function endOfIsoWeekInTimeZone(date: Date, timeZone: string): Date {
  const start = startOfIsoWeekInTimeZone(date, timeZone);
  const end = new Date(start.getTime());
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

export function setTimeOnDate(date: Date, timeHHmm: string): Date {
  const [hours, minutes] = timeHHmm.split(':').map((value) => parseInt(value, 10));
  const updated = new Date(date.getTime());
  updated.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return updated;
}

export function setTimeOnDateUtc(date: Date, timeHHmm: string): Date {
  const [hours, minutes] = timeHHmm.split(':').map((value) => parseInt(value, 10));
  const updated = new Date(date.getTime());
  updated.setUTCHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return updated;
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
});

const DAY_MONTH_FORMAT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
});

export function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return DATE_FORMAT.format(date);
}

export function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return DATE_TIME_FORMAT.format(date);
}

export function formatMonthYear(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return MONTH_YEAR_FORMAT.format(date);
}

export function formatDayMonth(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return DAY_MONTH_FORMAT.format(date);
}

export function getWeekdayDate(startOfWeek: Date, weekday: string): Date | null {
  const map: Record<string, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };
  const offset = map[weekday.toLowerCase()];
  if (offset === undefined) return null;
  const date = new Date(startOfWeek.getTime());
  date.setDate(startOfWeek.getDate() + offset);
  return date;
}

export function getWeekdayDateInTimeZone(startOfWeek: Date, weekday: string): Date | null {
  const map: Record<string, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };
  const offset = map[weekday.toLowerCase()];
  if (offset === undefined) return null;
  const date = new Date(startOfWeek.getTime());
  date.setUTCDate(startOfWeek.getUTCDate() + offset);
  return date;
}

export function getWeekdayNameInTimeZone(date: Date, timeZone: string): string {
  const parts = getZonedDateParts(date, timeZone);
  const tmp = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0));
  const day = tmp.getUTCDay();
  const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[day] ?? 'monday';
}
