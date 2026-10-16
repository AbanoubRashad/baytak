'use client';

import { useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import type { Consultant } from '@/components/layout/types';
import { Avatar } from '@/components/ui/Avatar';
import { btn, segment } from '@/components/ui/styles';
import { CallButton, WhatsAppButton } from '@/components/WhatsAppButton';
import { useAvailable } from '@/lib/client/use-available';
import type { Unit } from '@/lib/types';
import dynamic from 'next/dynamic';
import { PaymentCalculator } from './PaymentCalculator';

/** The booking form (react-hook-form + zod) loads only when the visitor opens the visit tab. */
const BookingPicker = dynamic(() => import('./BookingPicker').then((m) => m.BookingPicker), {
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-fill" />,
});

function subscribeHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

interface Props {
  unit: Unit;
  title: string;
  location: string;
  consultant: Consultant;
  whatsappMessage: string;
}

/** Sticky side card: consultant, Payment plan / Book a visit tabs, WhatsApp and Call. */
export function PriceCard({ unit, title, location, consultant, whatsappMessage }: Props) {
  const t = useTranslations('unit');
  const online = useAvailable(consultant);
  // "#book" in the URL (e.g. a shared "book a visit" link) opens the visit tab until the visitor picks one.
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => '');
  const [chosen, setTab] = useState<'plan' | 'visit' | null>(null);
  const tab = chosen ?? (hash === '#book' ? 'visit' : 'plan');

  return (
    <div id="book" className="scroll-mt-24 space-y-3 lg:sticky lg:top-24">
      <div className="rounded-card border border-line bg-card p-5 shadow-float sm:p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
          <Avatar src={consultant.avatar} alt="" size={48} online={online} />
          <div>
            <p className="text-[13px] text-ink-2">{t('consultant')}</p>
            <p className="font-semibold text-ink">{consultant.name}</p>
          </div>
        </div>
        <div className={`${segment.wrap} grid w-full grid-cols-2`} role="tablist" aria-label={title}>
          <button
            type="button"
            role="tab"
            id="tab-plan"
            aria-selected={tab === 'plan'}
            aria-controls="panel-plan"
            onClick={() => setTab('plan')}
            className={segment.item}
          >
            {t('paymentTab')}
          </button>
          <button
            type="button"
            role="tab"
            id="tab-visit"
            aria-selected={tab === 'visit'}
            aria-controls="panel-visit"
            onClick={() => setTab('visit')}
            className={segment.item}
          >
            {t('visitTab')}
          </button>
        </div>
        <div className="mt-5">
          <div role="tabpanel" id="panel-plan" aria-labelledby="tab-plan" hidden={tab !== 'plan'}>
            <PaymentCalculator unit={unit} />
            <button type="button" onClick={() => setTab('visit')} className={`${btn.primary} mt-5 min-h-12 w-full`}>
              {t('bookVisit')}
            </button>
          </div>
          <div role="tabpanel" id="panel-visit" aria-labelledby="tab-visit" hidden={tab !== 'visit'}>
            {tab === 'visit' && <BookingPicker unitId={unit.id} title={title} location={location} consultant={consultant} />}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <WhatsAppButton number={consultant.whatsapp} message={whatsappMessage} className={`${btn.sand} min-h-12 flex-1`} from="unit">
          {t('askWhatsapp')}
        </WhatsAppButton>
        <CallButton phone={consultant.phone} className={`${btn.icon} size-12`} from="unit" label={t('call')} />
      </div>
    </div>
  );
}
