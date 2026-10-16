'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { sendContact } from '@/actions/leads';
import { btn, field, label } from '@/components/ui/styles';
import { contactSchema, type ContactInput, type FormError } from '@/lib/validation';
import { FieldError, FormAlert, Honeypot } from './FormBits';

export function ContactForm() {
  const t = useTranslations('about');
  const locale = useLocale() as 'en' | 'ar';
  const [done, setDone] = useState<{ stored: boolean } | null>(null);
  const [error, setError] = useState<FormError | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', phone: '', email: '', message: '', website: '', locale },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await sendContact(values);
    if (res.ok) {
      setDone({ stored: res.stored });
      reset();
    } else {
      setError(res.error === 'invalid' ? null : res.error);
      Object.entries(res.fields ?? {}).forEach(([k, v]) => setFieldError(k as keyof ContactInput, { message: v }));
    }
  });

  if (done) {
    return (
      <div role="status" className="space-y-3">
        <p className="font-display text-2xl font-bold text-ink">{t('doneTitle')}</p>
        <p className="text-ink-2">{t('doneText')}</p>
        <FormAlert notStored={!done.stored} />
        <button type="button" onClick={() => setDone(null)} className={btn.outline}>
          {t('sendAnother')}
        </button>
      </div>
    );
  }

  const input = (name: 'name' | 'phone' | 'email', props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`ct-${name}`} className={label}>
        {t(name)}
      </label>
      <input
        id={`ct-${name}`}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `ct-${name}-err` : undefined}
        className={field}
        {...props}
        {...register(name)}
      />
      <FieldError id={`ct-${name}-err`} code={errors[name]?.message} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-4">
      <Honeypot registration={register('website')} />
      <div className="grid gap-4 sm:grid-cols-2">
        {input('name', { autoComplete: 'name' })}
        {input('phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', dir: 'ltr', placeholder: '01x xxxx xxxx', className: `${field} rtl:text-end` })}
      </div>
      {input('email', { type: 'email', autoComplete: 'email', dir: 'ltr', className: `${field} rtl:text-end` })}
      <div>
        <label htmlFor="ct-message" className={label}>
          {t('message')}
        </label>
        <textarea
          id="ct-message"
          rows={5}
          placeholder={t('messagePh')}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'ct-message-err' : undefined}
          className={`${field} py-3`}
          {...register('message')}
        />
        <FieldError id="ct-message-err" code={errors.message?.message} />
      </div>
      <FormAlert error={error} />
      <button type="submit" disabled={isSubmitting} className={`${btn.primary} min-h-12 w-full sm:w-auto sm:px-8`}>
        {isSubmitting ? t('sending') : t('submit')}
      </button>
    </form>
  );
}
