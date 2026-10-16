import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import { getUnits } from '@/lib/data/listings';
import { getSettings } from '@/lib/data/settings';
import { pick } from '@/lib/format';
import { applyFilters, defaultFilters, deliveryYear } from '@/lib/listing';
import { unitCards } from '@/components/listing/cardMaps';
import { compoundName } from '@/lib/listing-text';
import { currentLocale } from '@/lib/server/locale';
import type { Finishing, UnitType } from '@/lib/types';
import { UnitsExplorer } from '@/components/listing/UnitsExplorer';
import type { FilterOptions } from '@/components/listing/FilterBar';
import { container } from '@/components/ui/styles';

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations('units'), currentLocale()]);
  return { title: t('title'), description: t('intro'), alternates: localeAlternates('/units', locale) };
}

export default async function UnitsPage() {
  const locale = await currentLocale();
  const [units, settings, t] = await Promise.all([getUnits(), getSettings(), getTranslations('units')]);
  const consultantName = pick(locale, settings.consultantName, settings.consultantNameAr);

  const uniq = <T,>(xs: T[]) => [...new Set(xs)];
  const compounds = new Map(units.map((u) => [u.compound.slug, compoundName(u.compound, locale)]));
  const options: FilterOptions = {
    types: uniq(units.map((u) => u.unitType)) as UnitType[],
    developers: uniq(units.map((u) => u.compound.developer).filter((d): d is string => Boolean(d))).sort(),
    compounds: [...compounds].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name)),
    deliveryYears: uniq(units.map((u) => deliveryYear(u.delivery)).filter(Boolean)).sort(),
    finishings: uniq(units.map((u) => u.finishing).filter((f): f is Finishing => Boolean(f))),
  };
  const firstIds = applyFilters(units, defaultFilters).slice(0, 3).map((u) => u.id);
  const props = { units, options, consultantName, cards: unitCards(units, consultantName, firstIds) };

  return (
    <div className={`${container} pb-24 pt-32`}>
      <h1 className="text-4xl font-extrabold sm:text-5xl">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-2">{t('intro')}</p>
      <div className="mt-8">
        <UnitsExplorer {...props} />
      </div>
    </div>
  );
}
