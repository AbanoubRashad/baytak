'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { filtersToQuery, type Sort } from '@/lib/listing';
import { openChat } from '@/lib/client/events';
import type { ReactNode } from 'react';
import { btn, container, eyebrow } from '@/components/ui/styles';
import { useHomeFilters } from './HomeExplorer';

const FIRST = 6;

/** `cards` / `miniCards` are server-rendered per unit id; this component only filters and orders them. */
export function HomesGrid({ cards, miniCards }: { cards: Record<string, ReactNode>; miniCards: Record<string, ReactNode> }) {
  const { filters, update, results, consultantName } = useHomeFilters();
  const t = useTranslations('homes');
  const tAreas = useTranslations('areas');
  const tSearch = useTranslations('search');

  const eyebrowText = filters.sale === 'ready' ? t('eyebrowReady') : filters.sale === 'offplan' ? t('eyebrowOffplan') : t('eyebrowAll');
  const sorts: [Sort, string][] = [
    ['featured', t('sortFeatured')],
    ['price-asc', t('sortLow')],
    ['size-desc', t('sortLarge')],
  ];

  return (
    <section id="homes" aria-labelledby="homes-title" className={`${container} scroll-mt-24 pt-20 sm:pt-24`}>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className={eyebrow}>{eyebrowText}</p>
          <h2 id="homes-title" className="mt-3 text-4xl font-extrabold sm:text-5xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-ink-2" aria-live="polite">
            {t('count', { count: results.length, area: filters.area === 'all' ? tSearch('allAreas') : tAreas(filters.area) })}
          </p>
        </div>
        <div className="inline-flex rounded-2xl border border-line bg-card p-1" role="group" aria-label={tSearch('sort')}>
          {sorts.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filters.sort === value}
              onClick={() => update({ sort: value })}
              className="min-h-11 rounded-xl px-4 text-[15px] font-medium text-ink aria-pressed:bg-strong aria-pressed:font-semibold aria-pressed:text-on-strong"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-line bg-card p-8 text-center sm:p-12">
          <p className="mx-auto max-w-xl text-lg text-ink-2">{t('empty')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => openChat()} className={btn.primary}>
              {t('emptyCta', { name: consultantName })}
            </button>
            <button type="button" onClick={() => update({ area: 'all', beds: 'any', max: null })} className={btn.outline}>
              {t('resetFilters')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Phones: a swipeable "Picked for you" row of compact cards. */}
          <div className="mt-8 sm:hidden">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-2xl font-extrabold">{t('pickedForYou')}</h3>
              <Link href={`/units${filtersToQuery(filters)}`} className="inline-flex min-h-11 items-center font-semibold text-primary">
                {t('seeAll')}
              </Link>
            </div>
            <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2">
              {results.slice(0, 8).map((u) => (
                <li key={u.id} className="w-[78%] shrink-0 snap-start">
                  {miniCards[u.id]}
                </li>
              ))}
            </ul>
          </div>
          <ul className="mt-8 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, FIRST).map((u) => (
              <li key={u.id} className="grid">
                {cards[u.id]}
              </li>
            ))}
          </ul>
          {results.length > FIRST && (
            <div className="mt-10 hidden justify-center sm:flex">
              <Link href={`/units${filtersToQuery(filters)}`} className={`${btn.outline} min-h-12 px-7`}>
                {t('showAll', { count: results.length })}
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
