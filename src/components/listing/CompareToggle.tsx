'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { compareStore, toggleCompare } from '@/lib/client/compare';
import { btn } from '@/components/ui/styles';

export function CompareToggle({ unitId, className = '' }: { unitId: string; className?: string }) {
  const t = useTranslations('card');
  const active = compareStore.useValue().includes(unitId);
  const [full, setFull] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-pressed={active}
        onClick={() => setFull(!toggleCompare(unitId))}
        className={`${btn.outline} px-4 aria-pressed:border-primary aria-pressed:bg-pale aria-pressed:text-primary-hover dark:aria-pressed:text-primary ${className}`}
      >
        {active ? t('comparing') : t('compare')}
      </button>
      <span role="status" className="sr-only">
        {full ? t('compareFull') : ''}
      </span>
    </>
  );
}
