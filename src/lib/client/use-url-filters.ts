'use client';

import { useCallback, useState } from 'react';
import { filtersToQuery, type Filters } from '@/lib/listing';

/**
 * Filter state mirrored into the URL query (replaceState — no navigation, no server round trip),
 * so every search is shareable and survives a refresh.
 */
export function useUrlFilters(initial: Filters, base: Partial<Filters> = {}) {
  const [filters, setFilters] = useState(initial);

  const update = useCallback(
    (patch: Partial<Filters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch, page: patch.page ?? 1 };
        const url = `${window.location.pathname}${filtersToQuery(next, base)}${window.location.hash}`;
        window.history.replaceState(window.history.state, '', url);
        return next;
      });
    },
    // `base` is a constant per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return [filters, update] as const;
}
