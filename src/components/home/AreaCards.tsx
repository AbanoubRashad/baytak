'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { AREAS, countByArea } from '@/lib/listing';
import { scrollToId } from '@/lib/client/scroll';
import type { AreaKey } from '@/lib/types';
import { container, eyebrow } from '@/components/ui/styles';
import { useHomeFilters } from './HomeExplorer';

const PHOTOS: Record<AreaKey, string> = {
  'new-cairo': '/photos/area-new-cairo.jpg',
  'north-coast': '/photos/area-north-coast.jpg',
  'new-capital': '/photos/area-new-capital.jpg',
  october: '/photos/area-october.jpg',
  zayed: '/photos/area-zayed.jpg',
};

/** "Explore by area": tall photo cards that filter the homes grid. */
export function AreaCards() {
  const { units, filters, update } = useHomeFilters();
  const t = useTranslations('areasSection');
  const tAreas = useTranslations('areas');
  const counts = useMemo(() => countByArea(units), [units]);

  function pick(area: AreaKey) {
    const c = counts[area];
    // If this area only has the other kind of home, switch the Off-plan / Ready tab too.
    let sale = filters.sale;
    if (sale === 'offplan' && c.offplan === 0 && c.ready > 0) sale = 'ready';
    else if (sale === 'ready' && c.ready === 0 && c.offplan > 0) sale = 'offplan';
    update({ area, sale });
    scrollToId('homes');
  }

  return (
    <section id="areas" aria-labelledby="areas-title" className={`${container} scroll-mt-24 pt-24`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={eyebrow}>{t('eyebrow')}</p>
          <h2 id="areas-title" className="mt-3 max-w-xl text-4xl font-extrabold sm:text-5xl">
            {t('title')}
          </h2>
        </div>
        <p className="max-w-sm text-ink-2">{t('note')}</p>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {AREAS.map((area) => {
          const count = counts[area].offplan + counts[area].ready;
          return (
            <li key={area} className="last:col-span-2 md:last:col-span-1">
              <button
                type="button"
                onClick={() => pick(area)}
                aria-pressed={filters.area === area}
                className="group relative isolate flex h-[260px] w-full flex-col justify-end overflow-hidden rounded-card p-4 text-start text-white sm:h-[380px] sm:p-5"
              >
                <Image
                  src={PHOTOS[area]}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 240px, (min-width: 768px) 33vw, 50vw"
                  className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(20,28,36,0)_30%,rgba(20,28,36,0.85)_100%)]" />
                <span className="font-display text-2xl font-extrabold sm:text-[28px]">{tAreas(area)}</span>
                <span className="mt-1 text-sm leading-snug text-white/90">{t(`desc-${area}`)}</span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#24303A]">{t('here', { count })}</span>
                  <span className="rounded-full bg-[#24303A]/55 px-2.5 py-1 text-xs font-semibold text-white">{t(`tag-${area}`)}</span>
                </span>
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-card ring-4 ring-inset ring-transparent group-aria-pressed:ring-white/85" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
