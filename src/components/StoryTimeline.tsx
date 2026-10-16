import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/config/site';
import { pick } from '@/lib/format';
import type { StoryItem } from '@/lib/types';

/** My story timeline (2019 / 2021 / 2023 / Today) — items are edited in Admin → Settings. */
export async function StoryTimeline({ items, locale }: { items: StoryItem[]; locale: Locale }) {
  const t = await getTranslations('story');
  return (
    <ol className="relative mt-8 space-y-6 ps-10 before:absolute before:bottom-3 before:start-[9px] before:top-3 before:w-0.5 before:bg-line">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const year = item.year.toLowerCase() === 'today' ? t('today') : item.year;
        return (
          <li key={item.id} className="relative">
            <span
              aria-hidden
              className={`absolute -start-10 top-1 size-5 rounded-full border-4 border-bg ${last ? 'bg-primary' : 'bg-sand'}`}
            />
            <p className="font-display text-lg font-bold text-primary">{year}</p>
            <p className="font-semibold text-ink">{pick(locale, item.title, item.titleAr)}</p>
            <p className="mt-1 text-[15px] text-ink-2">{pick(locale, item.text, item.textAr)}</p>
          </li>
        );
      })}
    </ol>
  );
}
