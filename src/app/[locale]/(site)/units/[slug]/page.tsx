import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Check, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { site } from '@/config/site';
import { Link } from '@/i18n/navigation';
import { getCompounds, getUnitBySlug, getUnits } from '@/lib/data/listings';
import { getSettings } from '@/lib/data/settings';
import { toConsultant } from '@/lib/consultant';
import { formatNumber, pick } from '@/lib/format';
import { planTag, pricePerM2 } from '@/lib/listing';
import { compoundLocation, compoundName, egp, unitDelivery, unitTitle, type T } from '@/lib/listing-text';
import { photoUrl } from '@/lib/photos';
import { currentLocale } from '@/lib/server/locale';
import { unitJsonLd, localeAlternates } from '@/lib/seo';
import { Avatar } from '@/components/ui/Avatar';
import { container } from '@/components/ui/styles';
import { JsonLd } from '@/components/JsonLd';
import { PageSkeleton } from '@/components/PageSkeleton';
import { PhotoGallery } from '@/components/unit/PhotoGallery';
import { PriceCard } from '@/components/unit/PriceCard';
import { UnitActions } from '@/components/unit/UnitActions';
import { UnitMiniCard } from '@/components/listing/UnitMiniCard';
import { CompoundCarousel } from '@/components/listing/CompoundCarousel';
import { CompoundCard } from '@/components/listing/CompoundCard';

export async function generateStaticParams() {
  return (await getUnits()).map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/units/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const [unit, locale, t] = await Promise.all([getUnitBySlug(slug), currentLocale(), getTranslations()]);
  if (!unit) return {};
  const title = unitTitle(unit, t as unknown as T, locale);
  const description = `${egp(unit.price, t as unknown as T, locale)} · ${compoundLocation(unit.compound, locale)}. ${pick(locale, unit.consultantNote ?? '', unit.consultantNoteAr)}`.slice(0, 300);
  const cover = unit.photos[0];
  return {
    title,
    description,
    alternates: localeAlternates(`/units/${slug}`, locale),
    openGraph: { title, description, images: cover ? [{ url: photoUrl(cover.path), width: 1800, height: 1200, alt: title }] : undefined },
  };
}

export default function UnitPage({ params }: PageProps<'/[locale]/units/[slug]'>) {
  return (
    <Suspense fallback={<PageSkeleton variant="unit" />}>
      <UnitContent params={params} />
    </Suspense>
  );
}

async function UnitContent({ params }: Pick<PageProps<'/[locale]/units/[slug]'>, 'params'>) {
  const { slug } = await params;
  const locale = await currentLocale();
  const [unit, units, compounds, settings, tRaw] = await Promise.all([
    getUnitBySlug(slug),
    getUnits(),
    getCompounds(),
    getSettings(),
    getTranslations(),
  ]);
  if (!unit) notFound();
  const t = tRaw as unknown as T;
  const consultant = toConsultant(settings, locale);
  const title = unitTitle(unit, t, locale);
  const cName = compoundName(unit.compound, locale);
  const location = compoundLocation(unit.compound, locale);
  const price = egp(unit.price, t, locale);
  const note = pick(locale, unit.consultantNote ?? '', unit.consultantNoteAr);
  const amenities = locale === 'ar' && unit.compound.amenitiesAr.length ? unit.compound.amenitiesAr : unit.compound.amenities;
  const url = `${site.url}${locale === 'ar' ? '/ar' : ''}/units/${unit.slug}`;

  const similar = units
    .filter((u) => u.id !== unit.id && u.compound.area === unit.compound.area && u.status !== 'sold')
    .sort((a, b) => Math.abs(a.price - unit.price) - Math.abs(b.price - unit.price))
    .slice(0, 3);
  const similarCompounds = compounds
    .filter((c) => c.id !== unit.compound.id && c.area === unit.compound.area)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 8);

  const facts: [string, string][] = [
    [t('unit.bedrooms'), String(unit.beds)],
    [t('unit.bathrooms'), String(unit.baths)],
    [t('unit.builtUp'), t('common.m2', { n: formatNumber(unit.sizeM2, locale) })],
  ];
  if (unit.gardenM2) facts.push([t('unit.gardenM2'), t('common.m2', { n: formatNumber(unit.gardenM2, locale) })]);
  if (unit.terraceM2) facts.push([t('unit.terraceM2'), t('common.m2', { n: formatNumber(unit.terraceM2, locale) })]);
  if (unit.landM2) facts.push([t('unit.land'), t('common.m2', { n: formatNumber(unit.landM2, locale) })]);
  facts.push([t('unit.finishing'), unit.finishing ? t(`finishing.${unit.finishing}`) : t('unit.askMe')]);

  const delta = 0.012;
  const mapSrc =
    unit.compound.lat != null && unit.compound.lng != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${unit.compound.lng - delta * 1.6}%2C${unit.compound.lat - delta}%2C${unit.compound.lng + delta * 1.6}%2C${unit.compound.lat + delta}&layer=mapnik&marker=${unit.compound.lat}%2C${unit.compound.lng}`
      : null;

  return (
    <>
      <JsonLd data={unitJsonLd(unit, title, url, locale, settings)} />
      <div className={`${container} pb-20 pt-28`}>
        <UnitActions unitId={unit.id} title={title} />

        <div className="mt-8 flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-sky px-3.5 py-1.5 text-primary-hover dark:text-primary">
            {unit.saleType === 'offplan' ? t('unit.developerSale') : t('unit.readySale')}
          </span>
          <span className="rounded-full bg-sand px-3.5 py-1.5 text-on-sand">{planTag(unit, (k, v) => t(`listing.${k}`, v))}</span>
          <span className="rounded-full border border-line bg-card px-3.5 py-1.5 text-ink">
            {unit.delivery === 'ready' || unit.delivery === 'near' ? unitDelivery(unit, t, locale) : t('unit.deliveryOn', { date: unitDelivery(unit, t, locale) })}
          </span>
          {unit.status === 'reserved' && <span className="rounded-full bg-sand px-3.5 py-1.5 text-on-sand">{t('listing.reserved')}</span>}
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
            <p className="mt-3 flex items-start gap-1.5 text-lg text-ink-2">
              <MapPin aria-hidden className="mt-1.5 size-4 shrink-0" />
              <span>
                <Link href={`/compounds/${unit.compound.slug}`} className="underline-offset-4 hover:underline">
                  {cName}
                </Link>
                , {location}
                {unit.compound.developer ? ` · ${t('listing.by', { developer: unit.compound.developer })}` : ''}
              </span>
            </p>
          </div>
          <div className="text-start sm:text-end">
            <p className="font-display text-4xl font-extrabold">{price}</p>
            <p className="mt-1 text-ink-2">
              {t('common.perM2', { amount: formatNumber(pricePerM2(unit), locale) })}
              {unit.priceMax ? ` · ${t('unit.upTo', { max: formatNumber(unit.priceMax, locale) })}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <PhotoGallery photos={unit.photos} title={title} />
          <p className="mt-3 text-sm text-ink-2">{t('unit.photosNote')}</p>
        </div>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-12">
            {unit.status === 'reserved' && <p className="rounded-2xl bg-sand px-5 py-4 text-on-sand">{t('unit.reserved')}</p>}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {facts.map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-line bg-card p-4">
                  <dt className="text-sm text-ink-2">{label}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            {note && (
              <section aria-labelledby="why-title" className="flex gap-5 rounded-card border border-line bg-card p-6 sm:p-7">
                <Avatar src={consultant.avatar} alt={consultant.name} size={64} className="hidden sm:block" />
                <div>
                  <h2 id="why-title" className="text-2xl font-bold">
                    {t('unit.whyTitle')}
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed text-ink-2">{note}</p>
                </div>
              </section>
            )}

            {amenities.length > 0 && (
              <section aria-labelledby="life-title">
                <h2 id="life-title" className="text-3xl font-extrabold">
                  {t('unit.life', { compound: cName })}
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

            {mapSrc && (
              <section aria-labelledby="map-title">
                <h2 id="map-title" className="text-3xl font-extrabold">
                  {t('unit.map')}
                </h2>
                <div className="mt-5 overflow-hidden rounded-card border border-line">
                  <iframe title={t('unit.mapTitle', { compound: cName })} src={mapSrc} loading="lazy" className="h-[320px] w-full border-0" />
                </div>
                <p className="mt-2 text-sm text-ink-2">{t('unit.mapNote')}</p>
              </section>
            )}

            {similar.length > 0 && (
              <section aria-labelledby="similar-title">
                <h2 id="similar-title" className="text-3xl font-extrabold">
                  {t('unit.similar')}
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-3">
                  {similar.map((u) => (
                    <li key={u.id}>
                      <UnitMiniCard unit={u} showType={false} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <PriceCard
            unit={unit}
            title={title}
            location={`${cName}, ${location}`}
            consultant={consultant}
            whatsappMessage={t('unit.whatsappMessage', { name: consultant.name, title, price, url })}
          />
        </div>

        {similarCompounds.length > 0 && (
          <section aria-labelledby="similar-compounds-title" className="mt-20">
            <h2 id="similar-compounds-title" className="text-3xl font-extrabold">
              {t('unit.similarCompounds')}
            </h2>
            <div className="mt-2">
              <CompoundCarousel
                items={similarCompounds.map((c) => ({ key: c.id, card: <CompoundCard compound={c} action="link" consultantName={consultant.name} /> }))}
                label={t('unit.similarCompounds')}
              />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
