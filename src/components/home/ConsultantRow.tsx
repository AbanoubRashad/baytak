'use client';

import { useTranslations } from 'next-intl';
import type { Consultant } from '@/components/layout/types';
import { Avatar } from '@/components/ui/Avatar';
import { openChat } from '@/lib/client/events';
import { useAvailable } from '@/lib/client/use-available';

/** Mobile-only "Romany's card" between the picks and the areas; opens the chat. */
export function ConsultantRow({ consultant }: { consultant: Consultant }) {
  const t = useTranslations('chat');
  const online = useAvailable(consultant);
  return (
    <button
      type="button"
      onClick={() => openChat()}
      className="flex w-full items-center gap-4 rounded-[20px] border border-line bg-card p-4 text-start shadow-soft"
    >
      <Avatar src={consultant.avatar} alt="" size={60} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{consultant.name}</span>
        <span className="block text-sm text-ink-2">{online ? t('online') : t('offline')}</span>
      </span>
      <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${online ? 'bg-online' : 'bg-ink-2'}`} />
      <span className="sr-only">{t('open', { name: consultant.name })}</span>
    </button>
  );
}
