'use client';

import { useTranslations } from 'next-intl';
import { btn, container } from '@/components/ui/styles';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('error');
  return (
    <div className={`${container} flex min-h-[70dvh] flex-col items-start justify-center gap-5 py-32`}>
      <h1 className="text-4xl font-extrabold">{t('title')}</h1>
      <p className="max-w-xl text-lg text-ink-2">{t('body')}</p>
      <button type="button" onClick={reset} className={btn.primary}>{t('retry')}</button>
    </div>
  );
}
