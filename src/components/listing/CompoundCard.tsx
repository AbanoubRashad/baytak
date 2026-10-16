import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/config/site';
import { formatCompact } from '@/lib/format';
import { compoundLocation, compoundName } from '@/lib/listing-text';
import { photoUrl } from '@/lib/photos';
import type { Compound } from '@/lib/types';
import { ChatTrigger } from './ChatTrigger';

export type CompoundCardData = Pick<
  Compound,
  'id' | 'slug' | 'name' | 'nameAr' | 'developer' | 'location' | 'locationAr' | 'priceFrom' | 'maxYears' | 'photos'
>;

interface Props {
  compound: CompoundCardData;
  /** "chat" opens the chat pre-filled with this compound; "link" goes to the compound page. */
  action: 'chat' | 'link';
  consultantName: string;
  homesLabel?: string;
}

/** Server-rendered compound card; only the chat trigger (when used) hydrates. */
export function CompoundCard({ compound: c, action, consultantName, homesLabel }: Props) {
  const t = useTranslations('compoundsSection');
  const locale = useLocale() as Locale;
  const name = compoundName(c, locale);
  const cover = c.photos[0];

  const body = (
    <>
      <span className="relative block h-[180px] overflow-hidden bg-fill">
        {cover && (
          <Image
            src={photoUrl(cover.path)}
            alt=""
            fill
            sizes="(min-width: 1024px) 300px, 80vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        {c.developer && (
          <span className="absolute start-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-ink">{c.developer}</span>
        )}
      </span>
      <span className="flex flex-1 flex-col p-5 text-start">
        <span className="block text-lg font-bold leading-snug text-ink">{name}</span>
        <span className="mt-1 block text-sm text-ink-2">{compoundLocation(c, locale)}</span>
        <span className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="font-semibold text-ink">
            {c.priceFrom ? t('from', { price: formatCompact(c.priceFrom, locale) }) : homesLabel}
          </span>
          {c.maxYears && (
            <span className="rounded-full bg-sky px-2.5 py-0.5 text-xs font-semibold text-primary-hover dark:text-primary">
              {t('yrs', { n: c.maxYears })}
            </span>
          )}
        </span>
        {c.priceFrom && homesLabel && <span className="mt-1 block text-[13px] text-ink-2">{homesLabel}</span>}
      </span>
    </>
  );

  const cls = 'group flex h-full w-full flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft';

  if (action === 'link') {
    return (
      <Link href={`/compounds/${c.slug}`} className={cls} prefetch={false}>
        {body}
      </Link>
    );
  }
  return (
    <ChatTrigger
      className={cls}
      label={`${name} — ${t('askAbout', { compound: name })}`}
      detail={{ compoundId: c.id, message: t('ask', { name: consultantName, compound: name }) }}
    >
      {body}
    </ChatTrigger>
  );
}
