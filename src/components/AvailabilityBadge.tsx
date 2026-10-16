'use client';

import { useTranslations } from 'next-intl';
import type { Consultant } from '@/components/layout/types';
import { useAvailable } from '@/lib/client/use-available';

/** The white card overlaid on Romany's portrait: name, hours and a live availability dot. */
export function AvailabilityBadge({ consultant, className = '' }: { consultant: Consultant; className?: string }) {
  const t = useTranslations('story');
  const online = useAvailable(consultant);
  return (
    <div className={`flex items-center justify-between gap-3 rounded-[18px] bg-card/97 px-4 py-3 shadow-soft ${className}`}>
      <div>
        <p className="font-semibold text-ink">{consultant.name}</p>
        <p className="text-[13px] text-ink-2">{consultant.hours}</p>
      </div>
      <p className={`flex items-center gap-1.5 text-[13px] font-semibold ${online ? 'text-online-ink' : 'text-ink-2'}`}>
        <span aria-hidden className={`size-2 rounded-full ${online ? 'bg-online' : 'bg-ink-2'}`} />
        {online ? t('available') : t('away')}
      </p>
    </div>
  );
}
