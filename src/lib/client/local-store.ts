'use client';

import { useSyncExternalStore } from 'react';

/**
 * A tiny localStorage-backed store for per-visitor conveniences (saved homes, compare list, theme).
 * Reads are wrapped in try/catch because storage can be blocked (private mode, disabled cookies).
 */
export function createLocalStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cache: T = fallback;
  let loaded = false;

  function read(): T {
    if (!loaded && typeof window !== 'undefined') {
      loaded = true;
      try {
        const raw = window.localStorage.getItem(key);
        if (raw != null) cache = JSON.parse(raw) as T;
      } catch {
        /* storage unavailable — keep fallback */
      }
    }
    return cache;
  }

  function set(next: T | ((prev: T) => T)) {
    cache = typeof next === 'function' ? (next as (prev: T) => T)(read()) : next;
    try {
      window.localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      loaded = false;
      listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, read, () => fallback);
  }

  return { get: read, set, useValue };
}
