'use client';

import { track as vercelTrack } from '@vercel/analytics';

/** The four events Romany cares about (Vercel Analytics custom events). */
export type TrackEvent = 'WhatsApp click' | 'Call click' | 'Booking' | 'Chat started';

export function track(event: TrackEvent, props?: Record<string, string | number | boolean | null>) {
  try {
    vercelTrack(event, props);
  } catch {
    /* analytics must never break the page */
  }
}
