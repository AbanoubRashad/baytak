'use client';

import { useLocale, useTranslations } from 'next-intl';
import { site, type Locale } from '@/config/site';
import { FilterBar } from '@/components/listing/FilterBar';
import { scrollToId } from '@/lib/client/scroll';
import { useHomeFilters } from './HomeExplorer';

/** The floating search card that overlaps the bottom of the hero. */
export function SearchSection() {
  const { filters, update, results, units } = useHomeFilters();
  const t = useTranslations('search');
  const locale = useLocale() as Locale;
  return (
    <FilterBar
      variant="home"
      filters={filters}
      onChange={update}
      resultCount={results.length}
      onShow={() => scrollToId('homes')}
      meta={t('meta', { count: units.length, month: site.pricesCheckedLabel[locale] })}
    />
  );
}
