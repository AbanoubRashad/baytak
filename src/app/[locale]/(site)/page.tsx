import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCompounds, getUnits } from '@/lib/data/listings';
import { getSettings, getStory } from '@/lib/data/settings';
import { toConsultant } from '@/lib/consultant';
import { pick } from '@/lib/format';
import { currentLocale } from '@/lib/server/locale';
import { HeroSlideshow } from '@/components/home/HeroSlideshow';
import { HeroContent } from '@/components/home/HeroContent';
import { HOME_BASE, HomeExplorer } from '@/components/home/HomeExplorer';
import { unitCards, unitMiniCards } from '@/components/listing/cardMaps';
import { applyFilters, defaultFilters } from '@/lib/listing';
import { SearchSection } from '@/components/home/SearchSection';
import { PromiseStrip } from '@/components/home/PromiseStrip';
import { HomesGrid } from '@/components/home/HomesGrid';
import { ConsultantRow } from '@/components/home/ConsultantRow';
import { AreaCards } from '@/components/home/AreaCards';
import { AffordCalculator } from '@/components/home/AffordCalculator';
import { Statement } from '@/components/home/Statement';
import { AboutRomany } from '@/components/home/AboutRomany';
import { HowWeWork } from '@/components/home/HowWeWork';
import { CallbackSection } from '@/components/home/CallbackSection';
import { CompoundCarousel } from '@/components/listing/CompoundCarousel';
import { CompoundCard } from '@/components/listing/CompoundCard';
import { container, eyebrow } from '@/components/ui/styles';
import { JsonLd } from '@/components/JsonLd';
import { agentJsonLd } from '@/lib/seo';

export default async function HomePage() {
  const locale = await currentLocale();
  const [settings, story, units, compounds, t, tHero] = await Promise.all([
    getSettings(),
    getStory(),
    getUnits(),
    getCompounds(),
    getTranslations('compoundsSection'),
    getTranslations('hero'),
  ]);
  const consultant = toConsultant(settings, locale);
  const featuredCompounds = compounds.filter((c) => c.featured);
  const firstIds = applyFilters(units, { ...defaultFilters, ...HOME_BASE }).slice(0, 3).map((u) => u.id);
  const cards = unitCards(units, consultant.name, firstIds);

  const slides = [
    { src: '/photos/hero-villa-pool.jpg', caption: tHero('slide1') },
    { src: '/photos/hero-glass-villa.jpg', caption: tHero('slide2') },
    { src: '/photos/hero-villa-dusk.jpg', caption: tHero('slide3') },
  ];

  const explorerContent = (
    <>
      <div className={`${container} relative z-10 -mt-36 sm:-mt-40`}>
        <SearchSection />
        <div className="hidden sm:block">
          <PromiseStrip name={consultant.name} />
        </div>
      </div>
      <HomesGrid cards={cards} miniCards={unitMiniCards(units)} />
      <div className={`${container} mt-8 sm:hidden`}>
        <ConsultantRow consultant={consultant} />
      </div>
      <AreaCards />
      <AffordCalculator />
    </>
  );
  const explorerProps = { units, consultantName: consultant.name };

  return (
    <>
      <JsonLd data={agentJsonLd(settings, locale)} />
      <HeroSlideshow slides={slides}>
        <HeroContent consultant={consultant} />
      </HeroSlideshow>

      <HomeExplorer {...explorerProps}>{explorerContent}</HomeExplorer>

      <Statement quote={pick(locale, settings.quote, settings.quoteAr)} consultant={consultant} />
      <AboutRomany consultant={consultant} settings={settings} story={story} locale={locale} />

      <section aria-labelledby="compounds-title" className={`${container} pt-24`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={eyebrow}>{t('eyebrow')}</p>
            <h2 id="compounds-title" className="mt-3 text-4xl font-extrabold sm:text-5xl">
              {t('title')}
            </h2>
          </div>
          <p className="text-ink-2">
            {t('note', { name: consultant.name })} ·{' '}
            <Link href="/compounds" className="font-semibold text-primary underline-offset-4 hover:underline">
              {t('viewAll')}
            </Link>
          </p>
        </div>
        <div className="mt-4">
          <CompoundCarousel
            items={featuredCompounds.map((c) => ({ key: c.id, card: <CompoundCard compound={c} action="chat" consultantName={consultant.name} /> }))}
            label={t('title')}
          />
        </div>
      </section>

      <HowWeWork name={consultant.name} />
      <CallbackSection consultant={consultant} />
    </>
  );
}
