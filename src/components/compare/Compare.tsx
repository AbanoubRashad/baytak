'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/config/site';
import { compareStore } from '@/lib/client/compare';
import { openChat } from '@/lib/client/events';
import { formatNumber } from '@/lib/format';
import { planTag, pricePerM2 } from '@/lib/listing';
import { compoundLocation, egp, unitDelivery, unitHeadline, unitTitle, type T } from '@/lib/listing-text';
import { photoUrl } from '@/lib/photos';
import type { UnitWithCompound } from '@/lib/types';
import { btn } from '@/components/ui/styles';

/** Floating compare bar (thumbnails) + the comparison modal. Mounted once in the site layout. */
export function Compare({ units, consultantName }: { units: UnitWithCompound[]; consultantName: string }) {
  const t = useTranslations() as unknown as T;
  const locale = useLocale() as Locale;
  const ids = compareStore.useValue();
  const picked = ids.map((id) => units.find((u) => u.id === id)).filter((u): u is UnitWithCompound => Boolean(u));
  const dialog = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showDialog = isOpen && picked.length > 0;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (showDialog && !d.open) d.showModal();
    if (!showDialog && d.open) d.close();
  }, [showDialog]);

  if (picked.length === 0) return null;

  const remove = (id: string) => compareStore.set((list) => list.filter((x) => x !== id));
  const dash = '—';
  const rows: [string, (u: UnitWithCompound) => string][] = [
    [t('compare.price'), (u) => egp(u.price, t, locale)],
    [t('compare.perM2'), (u) => t('common.perM2', { amount: formatNumber(pricePerM2(u), locale) })],
    [t('compare.type'), (u) => t(`unitTypes.${u.unitType}`)],
    [t('compare.beds'), (u) => String(u.beds)],
    [t('compare.baths'), (u) => String(u.baths)],
    [t('compare.size'), (u) => t('common.m2', { n: formatNumber(u.sizeM2, locale) })],
    [
      t('compare.outdoor'),
      (u) => (u.gardenM2 || u.terraceM2 ? t('common.m2', { n: formatNumber((u.gardenM2 ?? 0) + (u.terraceM2 ?? 0), locale) }) : dash),
    ],
    [t('compare.delivery'), (u) => unitDelivery(u, t, locale)],
    [t('compare.finishing'), (u) => (u.finishing ? t(`finishing.${u.finishing}`) : dash)],
    [t('compare.plan'), (u) => planTag(u, (k, v) => t(`listing.${k}`, v))],
    [t('compare.location'), (u) => compoundLocation(u.compound, locale)],
    [t('compare.developer'), (u) => u.compound.developer ?? dash],
  ];

  const askMessage = t('compare.message', {
    name: consultantName,
    list: picked.map((u) => `• ${unitTitle(u, t, locale)} — ${egp(u.price, t, locale)}`).join('\n'),
  });

  return (
    <>
      <div className="fixed inset-x-3 bottom-[88px] z-30 mx-auto max-w-[640px] rounded-[20px] border border-line bg-card p-3 shadow-float lg:bottom-6">
        <div className="flex items-center gap-3">
          <ul className="flex -space-x-2 rtl:space-x-reverse">
            {picked.map((u) => (
              <li key={u.id} className="relative size-12 overflow-hidden rounded-xl border-2 border-card bg-fill">
                {u.photos[0] && <Image src={photoUrl(u.photos[0].path)} alt="" fill sizes="48px" className="object-cover" />}
              </li>
            ))}
          </ul>
          <p className="min-w-0 flex-1 text-[15px] font-semibold text-ink">
            {t('compare.bar', { count: picked.length })}
            {picked.length < 2 && <span className="block text-[13px] font-normal text-ink-2">{t('compare.needTwo')}</span>}
          </p>
          <button type="button" onClick={() => compareStore.set([])} className="hidden min-h-11 px-2 text-sm font-semibold text-ink-2 sm:inline-flex sm:items-center">
            {t('compare.clear')}
          </button>
          <button type="button" onClick={() => setIsOpen(true)} disabled={picked.length < 2} className={btn.strong}>
            {t('compare.open')}
          </button>
        </div>
      </div>

      <dialog
        ref={dialog}
        onClose={() => setIsOpen(false)}
        aria-labelledby="compare-title"
        className="m-auto max-h-[92dvh] w-[min(1080px,calc(100vw-24px))] rounded-card border border-line bg-card p-0 text-ink shadow-float backdrop:bg-[#141c24]/55"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-5 py-4">
          <h2 id="compare-title" className="text-2xl font-extrabold">
            {t('compare.title')}
          </h2>
          <button type="button" onClick={() => setIsOpen(false)} className={btn.icon} aria-label={t('compare.close')}>
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[640px] border-collapse text-start text-[15px]">
            <caption className="sr-only">{t('compare.title')}</caption>
            <thead>
              <tr>
                <td className="w-40" />
                {picked.map((u) => (
                  <th key={u.id} scope="col" className="px-2 pb-4 align-top font-normal">
                    <div className="relative h-36 overflow-hidden rounded-2xl bg-fill">
                      {u.photos[0] && <Image src={photoUrl(u.photos[0].path)} alt="" fill sizes="300px" className="object-cover" />}
                      <button
                        type="button"
                        onClick={() => remove(u.id)}
                        className="absolute end-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-card/95 text-ink"
                        aria-label={t('compare.remove', { name: unitHeadline(u, locale) })}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <Link
                      href={`/units/${u.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="mt-3 block text-start font-semibold leading-snug text-ink underline-offset-4 hover:underline"
                    >
                      {unitHeadline(u, locale)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-t border-line">
                  <th scope="row" className="py-3 pe-4 text-start font-medium text-ink-2">
                    {label}
                  </th>
                  {picked.map((u) => (
                    <td key={u.id} className="px-2 py-3 font-medium text-ink">
                      {value(u)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-line px-5 py-4">
          <button type="button" onClick={() => compareStore.set([])} className={btn.outline}>
            {t('compare.clear')}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              openChat({ source: 'compare', unitId: picked[0]?.id, message: askMessage });
            }}
            className={btn.primary}
          >
            {t('compare.ask', { name: consultantName })}
          </button>
        </div>
      </dialog>
    </>
  );
}
