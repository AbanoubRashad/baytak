/** Helpers for visit slots, which are always in Cairo time (Egypt observes summer time). */
const TZ = 'Africa/Cairo';

/** Calendar parts of `date` as seen in Cairo. */
export function cairoParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
  };
}

/** "+03:00" — Cairo's UTC offset on a given date. */
function cairoOffset(date: Date): string {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value;
  const m = /GMT([+-]\d{2}):?(\d{2})?/.exec(name ?? '');
  return m ? `${m[1]}:${m[2] ?? '00'}` : '+02:00';
}

/** ISO timestamp for a Cairo wall-clock time, e.g. 2026-10-17T17:00:00+03:00. */
export function cairoIso(y: number, m: number, d: number, hour: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const probe = new Date(Date.UTC(y, m - 1, d, hour - 2));
  return `${y}-${pad(m)}-${pad(d)}T${pad(hour)}:00:00${cairoOffset(probe)}`;
}

export interface VisitDay {
  key: string;
  year: number;
  month: number;
  day: number;
  weekday: number;
  /** Days from today (1 = tomorrow). */
  offset: number;
  /** Noon UTC on that date — safe for formatting the day label. */
  date: Date;
}

/** The next `count` open days starting tomorrow (Cairo), skipping closed weekdays. */
export function nextVisitDays(now: Date, openDays: number[], count = 7): VisitDay[] {
  const out: VisitDay[] = [];
  const today = cairoParts(now);
  for (let offset = 1; out.length < count && offset < 21; offset++) {
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + offset, 12));
    const weekday = date.getUTCDay();
    if (!openDays.includes(weekday)) continue;
    out.push({
      key: date.toISOString().slice(0, 10),
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      weekday,
      offset,
      date,
    });
  }
  return out;
}

/** Two-hour visit slots inside opening hours: 11:00, 13:00, 15:00… */
export function visitSlots(openFrom: number, openTo: number): number[] {
  const slots: number[] = [];
  for (let h = openFrom; h <= openTo - 2; h += 2) slots.push(h);
  return slots;
}
