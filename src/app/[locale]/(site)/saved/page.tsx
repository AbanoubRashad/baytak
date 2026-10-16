import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getUnits } from '@/lib/data/listings';
import { getSettings } from '@/lib/data/settings';
import { pick } from '@/lib/format';
import { currentLocale } from '@/lib/server/locale';
import { SavedList } from '@/components/listing/SavedList';
import { unitCards } from '@/components/listing/cardMaps';
import { container } from '@/components/ui/styles';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('saved');
  // Personal to each visitor — nothing to index.
  return { title: t('title'), robots: { index: false } };
}

export default async function SavedPage() {
  const locale = await currentLocale();
  const [units, settings, t] = await Promise.all([getUnits(), getSettings(), getTranslations('saved')]);
  const name = pick(locale, settings.consultantName, settings.consultantNameAr);
  return (
    <div className={`${container} pb-24 pt-32`}>
      <h1 className="text-4xl font-extrabold sm:text-5xl">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-2">{t('intro')}</p>
      <SavedList units={units} cards={unitCards(units, name)} consultantName={name} whatsapp={settings.whatsapp} />
    </div>
  );
}
