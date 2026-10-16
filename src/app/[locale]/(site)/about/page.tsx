import type { Metadata } from 'next';
import { Clock, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getSettings, getStory } from '@/lib/data/settings';
import { toConsultant } from '@/lib/consultant';
import { pick } from '@/lib/format';
import { agentJsonLd, localeAlternates } from '@/lib/seo';
import { currentLocale } from '@/lib/server/locale';
import { AboutRomany } from '@/components/home/AboutRomany';
import { ContactForm } from '@/components/forms/ContactForm';
import { JsonLd } from '@/components/JsonLd';
import { CallButton, WhatsAppButton } from '@/components/WhatsAppButton';
import { btn, container } from '@/components/ui/styles';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, settings, t] = await Promise.all([currentLocale(), getSettings(), getTranslations('about')]);
  const name = pick(locale, settings.consultantName, settings.consultantNameAr);
  return {
    title: t('title', { name }),
    description: pick(locale, settings.storyIntro, settings.storyIntroAr).slice(0, 200),
    alternates: localeAlternates('/about', locale),
    openGraph: { images: [{ url: settings.portraitPath, width: 1440, height: 1800, alt: name }] },
  };
}

export default async function AboutPage() {
  const locale = await currentLocale();
  const [settings, story, t, tFooter] = await Promise.all([getSettings(), getStory(), getTranslations('about'), getTranslations('footer')]);
  const consultant = toConsultant(settings, locale);
  const areas = locale === 'ar' ? settings.areasAr : settings.areas;

  return (
    <>
      <JsonLd data={agentJsonLd(settings, locale)} />
      <div className="pt-8">
        <AboutRomany consultant={consultant} settings={settings} story={story} locale={locale} headingLevel="h1" />
      </div>

      <div className={`${container} grid gap-5 pt-16 md:grid-cols-2`}>
        <section aria-labelledby="areas-title" className="rounded-card border border-line bg-card p-7">
          <h2 id="areas-title" className="flex items-center gap-2.5 text-2xl font-bold">
            <MapPin aria-hidden className="size-5 text-primary" />
            {t('areasTitle')}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a} className="rounded-full bg-sky px-4 py-2 font-medium text-primary-hover dark:text-primary">
                {a}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="hours-title" className="rounded-card border border-line bg-card p-7">
          <h2 id="hours-title" className="flex items-center gap-2.5 text-2xl font-bold">
            <Clock aria-hidden className="size-5 text-primary" />
            {t('hoursTitle')}
          </h2>
          <p className="mt-4 text-lg text-ink">{consultant.hours}</p>
        </section>
      </div>

      <section id="contact" aria-labelledby="contact-title" className={`${container} scroll-mt-24 pb-24 pt-16`}>
        <div className="grid gap-10 rounded-[32px] bg-sky p-6 sm:p-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h2 id="contact-title" className="text-4xl font-extrabold">
              {t('contactTitle')}
            </h2>
            <p className="mt-4 text-lg text-ink-2">{t('contactIntro')}</p>
            <p className="mt-8 font-semibold text-ink">{t('or')}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <WhatsAppButton number={settings.whatsapp} className={btn.primary} from="contact">
                {tFooter('whatsapp')}
              </WhatsAppButton>
              <CallButton phone={settings.phone} className={btn.outline} from="contact">
                {tFooter('call')}
              </CallButton>
              {settings.email && (
                <a href={`mailto:${settings.email}`} className={btn.outline}>
                  {settings.email}
                </a>
              )}
            </div>
          </div>
          <div className="rounded-card bg-card p-6 shadow-soft sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
