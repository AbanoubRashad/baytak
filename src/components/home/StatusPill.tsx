'use client';

import { useTranslations } from 'next-intl';
import type { Consultant } from '@/components/layout/types';
import { useAvailable } from '@/lib/client/use-available';

/** "Romany is available today · replies within the hour", with a live green dot. */
export function StatusPill({ consultant }: { consultant: Consultant }) {
  const t = useTranslations('hero');
  const online = useAvailable(consultant);
  return (
    <p className="inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
      <span aria-hidden className={`size-2.5 rounded-full ${online ? 'bg-[#5CC98A]' : 'bg-white/60'}`} />
      {online ? t('status', { name: consultant.name }) : t('statusAway', { name: consultant.name })}
    </p>
  );
}
