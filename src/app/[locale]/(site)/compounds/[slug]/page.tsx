import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, Check, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { site } from '@/config/site';
import { Link } from '@/i18n/navigation';
import { getCompoundBySlug, getCompounds, getUnits } from '@/lib/data/listings';
import { getSettings } from '@/lib/data/settings';
import { toConsultant } from '@/lib/consultant';
import { formatCompact, formatNumber, pick } from '@/lib/format';
import { compoundLocation, compoundName } from '@/lib/listing-text';
import { photoUrl } from '@/lib/photos';
import { compoundJsonLd, localeAlternates } from '@/lib/seo';
import { currentLocale } from '@/lib/server/locale';
import { JsonLd } from '@/components/JsonLd';
import { PageSkeleton } from '@/components/PageSkeleton';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { AskButton } from '@/components/listing/AskButton';
import { CompoundCarousel } from '@/components/listing/CompoundCarousel';
import { CompoundCard } from '@/components/listing/CompoundCard';
import { UnitCard } from '@/components/listing/UnitCard';
import { btn, container, eyebrow } from '@/components/ui/styles';

export async function generateStaticParams() {
  return (await getCompounds()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/compounds/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const [c, locale] = await Promise.all([getCompoundBySlug(slug), currentLocale()]);
  if (!c) return {};
  const name = compoundName(c, locale);
  return {
    title: name,
    description: pick(locale, c.descriptionEn, c.descriptionAr),
    alternates: localeAlternates(`/compounds/${slug}`, locale),
  };
}

export default function CompoundPage({ params }: PageProps<'/[locale]/compounds/[slug]'>) {
  return (
    <Suspense fallback={<PageSkeleton variant="compound" />}>
      <CompoundContent params={params} />
    </Suspense>
  );
}

async function CompoundContent({ params }: Pick<PageProps<'/[locale]/compounds/[slug]'>, 'params'>) {
  const { slug } = await params;
  const locale = await currentLocale();
  const [c, compounds, units, settings, t, tTypes, tFinishing, tAreas] = await Promise.all([
    getCompoundBySlug(slug),
    getCompounds(),
    getUnits(),
    getSettings(),
    getTranslations('compoundPage'),
    getTranslations('unitTypes'),
    getTranslations('finishing'),
    getTranslations('areas'),
  ]);
  if (!c) notFound();
  const consultant = toConsultant(settings, locale);
  const name = compoundName(c, locale);
  const homes = units.filter((u) => u.compoundId === c.id);
  const amenities = locale === 'ar' && c.amenitiesAr.length ? c.amenitiesAr : c.amenities;
  const note = pick(locale, c.consultantNote ?? '', c.consultantNoteAr);
  const url = `${site.url}${locale === 'ar' ? '/ar' : ''}/compounds/${c.slug}`;
  const similar = compounds.filter((x) => x.id !== c.id && x.area === c.area).slice(0, 8);
  const askText = (await getTranslations('compoundsSection'))('ask', { name: consultant.name, compound: name });

  const facts: [label: string, value: string][] = [];
  if (c.priceFrom) facts.push([t('startPrice'), `EGP ${formatCompact(c.priceFrom, locale)}`]);
  if (c.resalePriceFrom) facts.push([t('resale'), `EGP ${formatCompact(c.resalePriceFrom, locale)}`]);
  if (c.downPaymentMinPct) facts.push([t('downLabel'), t('downMin', { pct: c.downPaymentMinPct })]);
  if (c.maxYears) facts.push([t('yearsLabel'), t('upTo', { n: c.maxYears })]);
  if (c.masterPlanAcres) facts.push([t('sizeLabel'), t('acres', { n: formatNumber(c.masterPlanAcres, locale) })]);
  if (c.finishing) facts.push([t('finishing'), tFinishing(c.finishing)]);

  const delta = 0.015;
  const mapSrc =
    c.lat != null && c.lng != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${c.lng - delta * 1.6}%2C${c.lat - delta}%2C${c.lng + delta * 1.6}%2C${c.lat + delta}&layer=mapnik&marker=${c.lat}%2C${c.lng}`
      : null;

  return (
    <>
      <JsonLd data={compoundJsonLd(c, url, locale)} />
      <div className={`${container} pb-20 pt-28`}>
        <Link href="/compounds" className={`${btn.outline} px-4`}>
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          {t('all')}
        </Link>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div>
            <p className={eyebrow}>
              {t('eyebrow')} · {tAreas(c.area)}
            </p>
            <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{name}</h1>
            <p className="mt-3 flex items-start gap-1.5 text-lg text-ink-2">
              <MapPin aria-hidden className="mt-1.5 size-4 shrink-0" />
              {compoundLocation(c, locale)}
              {c.developer ? ` · ${c.developer}` : ''}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <AskButton detail={{ compoundId: c.id, message: askText }} className={btn.primary}>
                {t('ask', { name: consultant.name, compound: name })}
              </AskButton>
              <WhatsAppButton number={consultant.whatsapp} message={`${askText} ${url}`} className={btn.sand} from="compound">
                WhatsApp
              </WhatsAppButton>
            </div>
          </div>
          <div className="relative h-[280px] overflow-hidden rounded-card bg-fill sm:h-[360px]">
            {c.photos[0] && <Image src={photoUrl(c.photos[0].path)} alt={name} fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />}
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-2">
          {(await getTranslations('common'))('photosIllustrative')}
          {c.sourceCheckedAt ? ` · ${t('checked', { date: site.pricesCheckedLabel[locale] })}` : ''}
        </p>

        {facts.length > 0 && (
          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-[20px] border border-line bg-card p-4">
                <dt className="text-sm text-ink-2">{label}</dt>
                <dd className="mt-1 font-display text-xl font-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-12">
            <section aria-labelledby="overview-title">
              <h2 id="overview-title" className="text-3xl font-extrabold">
                {t('overview')}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-2">{pick(locale, c.descriptionEn, c.descriptionAr)}</p>
              {note && <p className="mt-4 rounded-2xl border border-sky-line bg-pale p-5 text-ink">{note}</p>}
            </section>

            {amenities.length > 0 && (
              <section aria-labelledby="amenities-title">
                <h2 id="amenities-title" className="text-3xl font-extrabold">
                  {t('amenities')}
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {amenities.map((a) => (
                    <li key={a} className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
                      <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky text-primary">
                        <Check className="size-4" />
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="masterplan-title">
              <h2 id="masterplan-title" className="text-3xl font-extrabold">
                {t('masterPlan')}
              </h2>
              {c.photos.find((p) => p.label?.toLowerCase().includes('master')) ? (
                <div className="relative mt-5 h-[360px] overflow-hidden rounded-card border border-line bg-card">
                  <Image
                    src={photoUrl(c.photos.find((p) => p.label?.toLowerCase().includes('master'))!.path)}
                    alt={`${t('masterPlan')} — ${name}`}
                    fill
                    sizes="(min-width: 1024px) 700px, 100vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <p className="mt-4 text-ink-2">{t('masterPlanNote')}</p>
              )}
            </section>
          </div>

          {mapSrc && (
            <aside>
              <div className="overflow-hidden rounded-card border border-line lg:sticky lg:top-24">
                <iframe title={name} src={mapSrc} loading="lazy" className="h-[340px] w-full border-0" />
              </div>
            </aside>
          )}
        </div>

        <section aria-labelledby="homes-title" className="mt-16">
          <h2 id="homes-title" className="text-3xl font-extrabold">
            {t('homes')}
          </h2>
          {homes.length ? (
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {homes.map((u) => (
                <li key={u.id} className="grid">
                  <UnitCard unit={u} consultantName={consultant.name} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-card border border-dashed border-line bg-card p-6 text-ink-2">{t('noHomes')}</p>
          )}
          {c.unitTypes.length > 0 && (
            <p className="mt-4 text-ink-2">
              {t('unitTypes')}: {c.unitTypes.map((ty) => tTypes(ty)).join(' · ')}
            </p>
          )}
        </section>

        {similar.length > 0 && (
          <section aria-labelledby="similar-compounds" className="mt-16">
            <h2 id="similar-compounds" className="text-3xl font-extrabold">
              {(await getTranslations('unit'))('similarCompounds')}
            </h2>
            <CompoundCarousel
              items={similar.map((x) => ({ key: x.id, card: <CompoundCard compound={x} action="link" consultantName={consultant.name} /> }))}
              label={name}
            />
          </section>
        )}
      </div>
    </>
  );
}
