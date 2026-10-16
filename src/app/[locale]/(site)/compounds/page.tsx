import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import { getCompounds, getUnits } from '@/lib/data/listings';
import { getSettings } from '@/lib/data/settings';
import { pick } from '@/lib/format';
import { AREAS } from '@/lib/listing';
import { currentLocale } from '@/lib/server/locale';
import { CompoundCard } from '@/components/listing/CompoundCard';
import { areaTint } from '@/components/ui/area';
import { container } from '@/components/ui/styles';

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations('compoundsPage'), currentLocale()]);
  return { title: t('title'), description: t('intro'), alternates: localeAlternates('/compounds', locale) };
}

export default async function CompoundsPage() {
  const locale = await currentLocale();
  const [compounds, units, settings, t, tAreas] = await Promise.all([
    getCompounds(),
    getUnits(),
    getSettings(),
    getTranslations('compoundsPage'),
    getTranslations('areas'),
  ]);
  const consultantName = pick(locale, settings.consultantName, settings.consultantNameAr);
  const homes = new Map<string, number>();
  for (const u of units) homes.set(u.compoundId, (homes.get(u.compoundId) ?? 0) + 1);

  return (
    <div className={`${container} pb-24 pt-32`}>
      <h1 className="text-4xl font-extrabold sm:text-5xl">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-2">{t('intro')}</p>

      {AREAS.map((area) => {
        const list = compounds.filter((c) => c.area === area);
        if (!list.length) return null;
        return (
          <section key={area} aria-labelledby={`area-${area}`} className="mt-14">
            <h2 id={`area-${area}`} className="flex items-center gap-3 text-3xl font-extrabold">
              <span aria-hidden className={`inline-block size-4 rounded-full ring-1 ring-line ${areaTint[area]}`} />
              {tAreas(area)}
            </h2>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((c) => (
                <li key={c.id}>
                  <CompoundCard compound={c} action="link" consultantName={consultantName} homesLabel={t('homes', { count: homes.get(c.id) ?? 0 })} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
