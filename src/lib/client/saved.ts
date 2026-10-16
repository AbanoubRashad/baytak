'use client';

import { createLocalStore } from './local-store';

/** Unit ids the visitor has saved (hearted). Stored only in this browser. */
export const savedStore = createLocalStore<string[]>('baytak:saved', []);

export function toggleSaved(unitId: string): boolean {
  const isSaved = savedStore.get().includes(unitId);
  savedStore.set((ids) => (isSaved ? ids.filter((id) => id !== unitId) : [...ids, unitId]));
  return !isSaved;
}
