'use client';

import { useState } from 'react';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackSave } from '@/actions/saves';
import { savedStore, toggleSaved } from '@/lib/client/saved';
import { btn } from '@/components/ui/styles';

/** Back link, share (Web Share API, else copy link) and save, above the unit title. */
export function UnitActions({ unitId, title }: { unitId: string; title: string }) {
  const t = useTranslations('unit');
  const saved = savedStore.useValue().includes(unitId);
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/units" className={`${btn.outline} px-4`}>
        <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
        {t('allHomes')}
      </Link>
      <div className="flex items-center gap-2">
        <span role="status" className="text-sm font-medium text-online-ink">
          {copied ? t('copied') : ''}
        </span>
        <button type="button" onClick={share} className={btn.icon} aria-label={t('share')}>
          <Share2 className="size-[18px]" />
        </button>
        <button
          type="button"
          onClick={() => void trackSave(unitId, toggleSaved(unitId) ? 1 : -1)}
          aria-pressed={saved}
          className={btn.icon}
          aria-label={saved ? t('unsave') : t('save')}
        >
          <Heart className={`size-[18px] ${saved ? 'fill-heart text-heart' : ''}`} />
        </button>
      </div>
    </div>
  );
}
