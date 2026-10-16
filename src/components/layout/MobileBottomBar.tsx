'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CallButton, WhatsAppButton } from '@/components/WhatsAppButton';
import { btn } from '@/components/ui/styles';
import { savedStore } from '@/lib/client/saved';
import type { Consultant } from './types';

/** Phones only: WhatsApp (primary), Call and Saved, always one tap away. */
export function MobileBottomBar({ consultant }: { consultant: Consultant }) {
  const t = useTranslations('bottomBar');
  const saved = savedStore.useValue();
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-xl gap-2">
        <WhatsAppButton number={consultant.whatsapp} className={`${btn.primary} min-h-12 flex-1`} from="bottom-bar">
          {t('whatsapp', { name: consultant.name })}
        </WhatsAppButton>
        <CallButton phone={consultant.phone} className={`${btn.icon} size-12`} from="bottom-bar" label={t('call', { name: consultant.name })} />
        <Link href="/saved" className={`${btn.icon} relative size-12`} aria-label={t('saved', { count: saved.length })}>
          <Heart className={`size-5 ${saved.length ? 'fill-heart text-heart' : ''}`} />
          {saved.length > 0 && (
            <span aria-hidden className="absolute -end-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-heart px-1 text-[11px] font-bold text-white">
              {saved.length}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
