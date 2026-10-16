'use client';

import { useSyncExternalStore } from 'react';

/**
 * The query string the page was opened with (e.g. a shared search link), read without
 * `useSearchParams` so the page hydrates normally instead of bailing out to client rendering.
 * Server render and hydration see '' (default filters); the real value applies right after.
 * It only changes on back/forward navigation — our own replaceState filter updates don't count.
 */
let cached: string | null = null;

function subscribe(onChange: () => void) {
  const onPop = () => {
    cached = window.location.search;
    onChange();
  };
  window.addEventListener('popstate', onPop);
  return () => {
    window.removeEventListener('popstate', onPop);
    cached = null; // next mount (a client navigation back to this page) re-reads the URL
  };
}

function getSnapshot() {
  cached ??= window.location.search;
  return cached;
}

export function useInitialSearch(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => '');
}
