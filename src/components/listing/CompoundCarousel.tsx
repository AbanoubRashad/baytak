'use client';

import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** Horizontal scroll-snap row of (server-rendered) cards with previous / next buttons. */
export function CompoundCarousel({ items, label }: { items: { key: string; card: ReactNode }[]; label: string }) {
  const t = useTranslations('compoundsSection');
  const track = useRef<HTMLUListElement>(null);

  function scroll(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' });
  }

  const ctrl = 'inline-flex size-11 items-center justify-center rounded-full border border-line bg-card text-ink hover:border-ink-2';

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <button type="button" onClick={() => scroll(-1)} className={ctrl} aria-label={t('prev')}>
          <ChevronLeft className="size-5 rtl:rotate-180" />
        </button>
        <button type="button" onClick={() => scroll(1)} className={ctrl} aria-label={t('next')}>
          <ChevronRight className="size-5 rtl:rotate-180" />
        </button>
      </div>
      <ul
        ref={track}
        aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {items.map((item) => (
          <li key={item.key} className="w-[78%] shrink-0 snap-start sm:w-[300px]">
            {item.card}
          </li>
        ))}
      </ul>
    </div>
  );
}
