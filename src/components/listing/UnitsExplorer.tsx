'use client';

import { useMemo, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { applyFilters, defaultFilters, parseFilters, type Filters, type Sort } from '@/lib/listing';
import { openChat } from '@/lib/client/events';
import { scrollToId } from '@/lib/client/scroll';
import { useInitialSearch } from '@/lib/client/use-initial-search';
import { useUrlFilters } from '@/lib/client/use-url-filters';
import type { UnitWithCompound } from '@/lib/types';
import { btn } from '@/components/ui/styles';
import { FilterBar, type FilterOptions } from './FilterBar';

const PAGE_SIZE = 9;

interface Props {
  units: UnitWithCompound[];
  /** Server-rendered cards by unit id; this component only filters, sorts and paginates them. */
  cards: Record<string, ReactNode>;
  options: FilterOptions;
  consultantName: string;
}

/** Server-renders the full list; filters from the URL (a shared search) apply right after hydration. */
export function UnitsExplorer(props: Props) {
  const search = useInitialSearch();
  return <Explorer key={search} {...props} initial={search ? parseFilters(new URLSearchParams(search)) : defaultFilters} />;
}

function Explorer({ units, cards, options, consultantName, initial }: Props & { initial: Filters }) {
  const t = useTranslations('units');
  const tHomes = useTranslations('homes');
  const tSearch = useTranslations('search');
  const [filters, update] = useUrlFilters(initial);
  const results = useMemo(() => applyFilters(units, filters), [units, filters]);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goTo = (p: number) => {
    update({ page: p });
    scrollToId('results');
  };

  const sorts: [Sort, string][] = [
    ['featured', tHomes('sortFeatured')],
    ['price-asc', tHomes('sortLow')],
    ['price-desc', tHomes('sortHigh')],
    ['size-desc', tHomes('sortLarge')],
  ];

  return (
    <>
      <FilterBar
        variant="full"
        filters={filters}
        onChange={update}
        resultCount={results.length}
        options={options}
        onReset={() => update({ ...defaultFilters })}
      />

      <div id="results" className="mt-10 flex scroll-mt-24 flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-semibold text-ink" aria-live="polite">
          {t('results', { count: results.length })}
        </p>
        <label className="flex items-center gap-2 text-[15px] text-ink-2">
          {tSearch('sort')}
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as Sort })}
            className="min-h-11 rounded-btn border border-line bg-card px-3 text-ink"
          >
            {sorts.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line bg-card p-8 text-center sm:p-12">
          <p className="mx-auto max-w-xl text-lg text-ink-2">{tHomes('empty')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => openChat()} className={btn.primary}>
              {tHomes('emptyCta', { name: consultantName })}
            </button>
            <button type="button" onClick={() => update({ ...defaultFilters })} className={btn.outline}>
              {tHomes('resetFilters')}
            </button>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((u) => (
            <li key={u.id} className="grid">
              {cards[u.id]}
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label={t('pagination')} className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => goTo(page - 1)} disabled={page === 1} className={btn.outline}>
            <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
            {t('prev')}
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={t('goPage', { n: p })}
              className="inline-flex size-11 items-center justify-center rounded-btn border border-line bg-card font-semibold text-ink aria-[current=page]:border-strong aria-[current=page]:bg-strong aria-[current=page]:text-on-strong"
            >
              {p}
            </button>
          ))}
          <button type="button" onClick={() => goTo(page + 1)} disabled={page === pages} className={btn.outline}>
            {t('next')}
            <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
          </button>
          <p className="sr-only" aria-live="polite">
            {t('page', { page, total: pages })}
          </p>
        </nav>
      )}
    </>
  );
}
