import type { Settings } from './types';

type Hours = Pick<Settings, 'available' | 'openDays' | 'openFrom' | 'openTo'>;

/** True when Romany's manual switch is on and it's within his hours, Cairo time. */
export function isAvailableAt(settings: Hours, date: Date): boolean {
  if (!settings.available) return false;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
  return settings.openDays.includes(day) && hour >= settings.openFrom && hour < settings.openTo;
}
