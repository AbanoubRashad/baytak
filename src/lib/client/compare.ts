'use client';

import { createLocalStore } from './local-store';

export const MAX_COMPARE = 3;

/** Unit ids picked for side-by-side comparison (max 3). */
export const compareStore = createLocalStore<string[]>('baytak:compare', []);

/** Returns false when the list is already full. */
export function toggleCompare(unitId: string): boolean {
  const ids = compareStore.get();
  if (ids.includes(unitId)) {
    compareStore.set(ids.filter((id) => id !== unitId));
    return true;
  }
  if (ids.length >= MAX_COMPARE) return false;
  compareStore.set([...ids, unitId]);
  return true;
}
