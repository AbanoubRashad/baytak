'use client';

import { useSyncExternalStore } from 'react';
import { isAvailableAt } from '@/lib/availability';
import type { Settings } from '@/lib/types';

type Hours = Pick<Settings, 'available' | 'openDays' | 'openFrom' | 'openTo'>;

const MINUTE = 60_000;
const currentMinute = () => Math.floor(Date.now() / MINUTE);

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, MINUTE / 2);
  return () => window.clearInterval(id);
}

/**
 * Live "available now" status. The server render (and hydration) uses the manual switch only,
 * then the client refines it with the real Cairo time, re-checked every minute.
 */
export function useAvailable(hours: Hours): boolean {
  const minute = useSyncExternalStore(subscribe, currentMinute, () => null);
  return minute == null ? hours.available : isAvailableAt(hours, new Date(minute * MINUTE));
}

/** Current time (minute precision) after hydration; null during server render. */
export function useNow(): Date | null {
  const minute = useSyncExternalStore(subscribe, currentMinute, () => null);
  return minute == null ? null : new Date(minute * MINUTE);
}
