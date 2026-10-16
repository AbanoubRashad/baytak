'use client';

import { Heart } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { site, type Locale } from '@/config/site';
import { Link } from '@/i18n/navigation';
import { savedStore } from '@/lib/client/saved';
import { egp, unitTitle, type T } from '@/lib/listing-text';
import type { UnitWithCompound } from '@/lib/types';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { btn } from '@/components/ui/styles';
import type { ReactNode } from 'react';

export function SavedList({ units, cards, consultantName, whatsapp }: { units: UnitWithCompound[]; cards: Record<string, ReactNode>; consultantName: string; whatsapp: string }) {
  const t = useTranslations() as unknown as T;
  const locale = useLocale() as Locale;
  const ids = savedStore.useValue();
  const saved = ids.map((id) => units.find((u) => u.id === id)).filter((u): u is UnitWithCompound => Boolean(u));

  if (!saved.length) {
    return (
      <div className="mt-10 rounded-card border border-dashed border-line bg-card p-10 text-center">
        <Heart aria-hidden className="mx-auto size-8 text-heart" />
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-2">{t('saved.empty')}</p>
        <Link href="/units" className={`${btn.primary} mt-6`}>
          {t('saved.browse')}
        </Link>
      </div>
    );
  }

  const base = `${site.url}${locale === 'ar' ? '/ar' : ''}`;
  const message = t('saved.message', {
    name: consultantName,
    brand: locale === 'ar' ? site.brandAr : site.brand,
    list: saved.map((u) => `• ${unitTitle(u, t, locale)} — ${egp(u.price, t, locale)}\n  ${base}/units/${u.slug}`).join('\n'),
  });

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-3">
        <WhatsAppButton number={whatsapp} message={message} className={btn.primary} from="saved">
          {t('saved.send')}
        </WhatsAppButton>
        <button type="button" onClick={() => savedStore.set([])} className={btn.outline}>
          {t('saved.clear')}
        </button>
      </div>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((u) => (
          <li key={u.id} className="grid">
            {cards[u.id]}
          </li>
        ))}
      </ul>
    </>
  );
}
