import Image from 'next/image';
import { BedDouble, Bath, MapPin, Ruler } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/config/site';
import { formatNumber } from '@/lib/format';
import { planTag, pricePerM2 } from '@/lib/listing';
import { compoundLocation, egp, unitDelivery, unitHeadline, unitTitle, type T } from '@/lib/listing-text';
import { photoUrl } from '@/lib/photos';
import type { UnitWithCompound } from '@/lib/types';
import { btn } from '@/components/ui/styles';
import { AskUnitButton } from './AskUnitButton';
import { CompareToggle } from './CompareToggle';
import { SaveButton } from './SaveButton';

interface UnitCardProps {
  unit: UnitWithCompound;
  consultantName: string;
  /** Set on the first visible row so the LCP image loads eagerly. */
  priority?: boolean;
}

export function UnitCard({ unit: u, consultantName, priority }: UnitCardProps) {
  const t = useTranslations() as unknown as T;
  const locale = useLocale() as Locale;
  const cover = u.photos[0];
  const title = unitTitle(u, t, locale);
  const href = `/units/${u.slug}`;
  const location = [compoundLocation(u.compound, locale), u.compound.developer].filter(Boolean).join(' · ');
  const tagCls = 'rounded-full px-3 py-1 text-[13px] font-semibold';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft">
      <div className="relative h-[250px] overflow-hidden bg-fill">
        {cover && (
          <Image
            src={photoUrl(cover.path)}
            alt={title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute start-3.5 top-3.5 flex flex-wrap gap-1.5">
          <span className={`${tagCls} bg-card/95 text-ink`}>{t(`unitTypes.${u.unitType}`)}</span>
          <span className={`${tagCls} bg-[#24303A]/85 text-white`}>{unitDelivery(u, t, locale)}</span>
          {u.status === 'reserved' && <span className={`${tagCls} bg-sand text-on-sand`}>{t('listing.reserved')}</span>}
        </div>
        <SaveButton unitId={u.id} className="absolute end-3.5 top-3.5 z-10" />
        <span className={`${tagCls} absolute bottom-3.5 start-3.5 bg-card/95 text-primary-hover dark:text-primary`}>
          {planTag(u, (k, v) => t(`listing.${k}`, v))}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="font-display text-[26px] font-bold leading-tight text-ink">{egp(u.price, t, locale)}</p>
          <p className="text-[13px] text-ink-2">{t('common.perM2', { amount: formatNumber(pricePerM2(u), locale) })}</p>
        </div>
        <h3 className="mt-2 text-[19px] font-bold leading-snug text-ink" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none" prefetch={false}>
            <span className="sr-only">{title} — </span>
            {unitHeadline(u, locale)}
          </Link>
        </h3>
        <p className="mt-1 flex items-start gap-1.5 text-[15px] text-ink-2">
          <MapPin aria-hidden className="mt-1 size-4 shrink-0" />
          {location}
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-y border-line py-3.5 text-[15px] text-ink">
          <li className="flex items-center gap-1.5">
            <BedDouble aria-hidden className="size-[18px] text-primary" />
            {t('common.beds', { n: u.beds })}
          </li>
          <li className="flex items-center gap-1.5">
            <Bath aria-hidden className="size-[18px] text-primary" />
            {t('common.baths', { n: u.baths })}
          </li>
          <li className="flex items-center gap-1.5">
            <Ruler aria-hidden className="size-[18px] text-primary" />
            {t('common.m2', { n: formatNumber(u.sizeM2, locale) })}
          </li>
        </ul>
        <div className="relative z-10 mt-auto flex gap-2 pt-4">
          <Link href={href} className={`${btn.strong} flex-1`} tabIndex={-1} aria-hidden prefetch={false}>
            {t('card.view')}
          </Link>
          <CompareToggle unitId={u.id} />
          <AskUnitButton unitId={u.id} message={t('unit.chatMessage', { name: consultantName, title })} label={t('card.ask', { name: consultantName })} />
        </div>
      </div>
    </article>
  );
}
