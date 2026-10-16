import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/config/site';
import { formatNumber } from '@/lib/format';
import { egp, unitDelivery, unitHeadline, unitTitle, type T } from '@/lib/listing-text';
import { photoUrl } from '@/lib/photos';
import type { UnitWithCompound } from '@/lib/types';

/** Compact card: photo, price, compound and a one-line summary. Used in swipeable rows. */
export function UnitMiniCard({ unit: u, showType = true }: { unit: UnitWithCompound; showType?: boolean }) {
  const t = useTranslations() as unknown as T;
  const locale = useLocale() as Locale;
  const cover = u.photos[0];
  const meta = [
    t(`unitTypes.${u.unitType}`),
    t('common.beds', { n: u.beds }),
    t('common.m2', { n: formatNumber(u.sizeM2, locale) }),
    unitDelivery(u, t, locale),
  ].join(' · ');

  return (
    <Link
      href={`/units/${u.slug}`}
      prefetch={false}
      className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-card shadow-soft"
    >
      <span className="sr-only">{unitTitle(u, t, locale)} — </span>
      <span className="relative block h-[150px] overflow-hidden bg-fill">
        {cover && (
          <Image
            src={photoUrl(cover.path)}
            alt=""
            fill
            sizes="(min-width: 1024px) 280px, 75vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        {showType && (
          <span className="absolute start-2.5 top-2.5 rounded-full bg-card/95 px-2.5 py-0.5 text-xs font-semibold text-ink">
            {t(`unitTypes.${u.unitType}`)}
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col p-4">
        <span className="font-display text-lg font-bold text-ink">{egp(u.price, t, locale)}</span>
        <span className="mt-0.5 truncate font-semibold text-ink">{unitHeadline(u, locale)}</span>
        <span className="mt-1 text-[13px] leading-snug text-ink-2">{meta}</span>
      </span>
    </Link>
  );
}
