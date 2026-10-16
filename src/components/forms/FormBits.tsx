'use client';

import { useTranslations } from 'next-intl';
import type { UseFormRegisterReturn } from 'react-hook-form';
import type { FormError } from '@/lib/validation';

/** Inline field error; `code` is a key in the "forms" namespace. */
export function FieldError({ id, code }: { id: string; code?: string }) {
  const t = useTranslations('forms');
  if (!code) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-heart">
      {t.has(code) ? t(code) : t('failed')}
    </p>
  );
}

/** Form-level error / preview notice. */
export function FormAlert({ error, notStored }: { error?: FormError | null; notStored?: boolean }) {
  const t = useTranslations('forms');
  if (error === 'rate') return <p role="alert" className="rounded-xl bg-sand px-4 py-3 text-sm text-on-sand">{t('tooMany')}</p>;
  if (error === 'failed') return <p role="alert" className="rounded-xl bg-sand px-4 py-3 text-sm text-on-sand">{t('failed')}</p>;
  if (notStored) return <p role="status" className="rounded-xl bg-pale px-4 py-3 text-sm text-ink-2">{t('notStored')}</p>;
  return null;
}

/** Hidden from people and assistive tech; bots that fill it are silently ignored. */
export function Honeypot({ registration }: { registration: UseFormRegisterReturn }) {
  const t = useTranslations('forms');
  return (
    // Clipped in place (an off-screen offset would overflow the page in RTL).
    <div aria-hidden className="pointer-events-none absolute start-0 top-0 h-px w-px overflow-hidden opacity-0 [clip-path:inset(50%)]">
      <label>
        {t('honeypot')}
        <input type="text" tabIndex={-1} autoComplete="off" {...registration} />
      </label>
    </div>
  );
}
