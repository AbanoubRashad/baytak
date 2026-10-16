'use client';

import { createContext, use, useMemo, type ReactNode } from 'react';
import { applyFilters, defaultFilters, parseFilters, type Filters } from '@/lib/listing';
import { useInitialSearch } from '@/lib/client/use-initial-search';
import { useUrlFilters } from '@/lib/client/use-url-filters';
import type { UnitWithCompound } from '@/lib/types';

/** The home page searches off-plan homes by default (first tab). */
export const HOME_BASE: Partial<Filters> = { sale: 'offplan' };

interface HomeFilters {
  units: UnitWithCompound[];
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  results: UnitWithCompound[];
  consultantName: string;
}

const Ctx = createContext<HomeFilters | null>(null);

export function useHomeFilters() {
  const v = use(Ctx);
  if (!v) throw new Error('useHomeFilters must be used inside <HomeExplorer>');
  return v;
}

interface Props {
  units: UnitWithCompound[];
  consultantName: string;
  children: ReactNode;
}

/** Renders with default filters on the server, then applies a shared link's filters (?area=…) on the client. */
export function HomeExplorer(props: Props) {
  const search = useInitialSearch();
  const initial = search ? parseFilters(new URLSearchParams(search), HOME_BASE) : { ...defaultFilters, ...HOME_BASE };
  return <HomeExplorerInner key={search} {...props} initial={initial} />;
}

function HomeExplorerInner({ units, consultantName, children, initial }: Props & { initial: Filters }) {
  const [filters, update] = useUrlFilters(initial, HOME_BASE);
  const results = useMemo(() => applyFilters(units, filters), [units, filters]);
  const value = useMemo(() => ({ units, filters, update, results, consultantName }), [units, filters, update, results, consultantName]);
  return <Ctx value={value}>{children}</Ctx>;
}
