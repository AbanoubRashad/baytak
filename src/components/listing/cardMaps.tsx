import type { ReactNode } from 'react';
import type { UnitWithCompound } from '@/lib/types';
import { UnitCard } from './UnitCard';
import { UnitMiniCard } from './UnitMiniCard';

/**
 * Server-rendered cards keyed by unit id. Client grids (home, /units, saved) only decide which
 * ids to show and in what order, so the card markup itself never needs to hydrate.
 */
export function unitCards(units: UnitWithCompound[], consultantName: string, priorityIds: string[] = []): Record<string, ReactNode> {
  return Object.fromEntries(
    units.map((u) => [u.id, <UnitCard key={u.id} unit={u} consultantName={consultantName} priority={priorityIds.includes(u.id)} />]),
  );
}

export function unitMiniCards(units: UnitWithCompound[]): Record<string, ReactNode> {
  return Object.fromEntries(units.map((u) => [u.id, <UnitMiniCard key={u.id} unit={u} />]));
}
