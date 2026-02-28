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

export function endOfIsoWeek(date: Date): Date {
  const start = startOfIsoWeek(date);
  const end = new Date(start.getTime());
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function setTimeOnDate(date: Date, timeHHmm: string): Date {
  const [hours, minutes] = timeHHmm.split(':').map((value) => parseInt(value, 10));
  const updated = new Date(date.getTime());
  updated.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return updated;
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
