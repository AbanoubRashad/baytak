'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { savedStore, toggleSaved } from '@/lib/client/saved';
import { trackSave } from '@/actions/saves';

/** Heart toggle. Saved homes live in localStorage; the count feeds Romany's "most-saved" stat. */
export function SaveButton({ unitId, className = '' }: { unitId: string; className?: string }) {
  const t = useTranslations('card');
  const saved = savedStore.useValue().includes(unitId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t('unsave') : t('save')}
      onClick={() => {
        const nowSaved = toggleSaved(unitId);
        void trackSave(unitId, nowSaved ? 1 : -1);
      }}
      className={`inline-flex size-11 items-center justify-center rounded-full bg-card/95 text-ink shadow-soft transition-transform hover:scale-105 ${className}`}
    >
      <Heart className={`size-5 ${saved ? 'fill-heart text-heart' : ''}`} />
    </button>
  );
}
