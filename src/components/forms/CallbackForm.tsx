'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { requestCallback } from '@/actions/leads';
import type { Consultant } from '@/components/layout/types';
import { Avatar } from '@/components/ui/Avatar';
import { btn, chip, field, label } from '@/components/ui/styles';
import { callbackSchema, type CallbackInput, type FormError } from '@/lib/validation';
import { FieldError, FormAlert, Honeypot } from './FormBits';

const TIMES = ['morning', 'afternoon', 'evening'] as const;
const TIME_KEY = { morning: 'timeMorning', afternoon: 'timeAfternoon', evening: 'timeEvening' } as const;

export function CallbackForm({ consultant }: { consultant: Consultant }) {
  const t = useTranslations('callback');
  const locale = useLocale() as 'en' | 'ar';
  const [done, setDone] = useState<{ name: string; time: (typeof TIMES)[number]; stored: boolean } | null>(null);
  const [error, setError] = useState<FormError | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<CallbackInput>({
    resolver: zodResolver(callbackSchema),
    defaultValues: { name: '', phone: '', bestTime: 'evening', website: '', locale },
  });
  const bestTime = useWatch({ control, name: 'bestTime' });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await requestCallback(values);
    if (res.ok) {
      setDone({ name: values.name.trim(), time: values.bestTime, stored: res.stored });
      reset();
    } else {
      setError(res.error === 'invalid' ? null : res.error);
      Object.entries(res.fields ?? {}).forEach(([k, v]) => setFieldError(k as keyof CallbackInput, { message: v }));
    }
  });

  if (done) {
    return (
      <div className="flex flex-col items-start gap-4" role="status">
        <Avatar src={consultant.avatar} alt="" size={64} online />
        <p className="font-display text-2xl font-bold text-ink">{t('doneTitle', { client: done.name })}</p>
        <p className="text-ink-2">{t('doneText', { time: t(TIME_KEY[done.time]) })}</p>
        <FormAlert notStored={!done.stored} />
        <button type="button" onClick={() => setDone(null)} className={btn.outline}>
          {t('doneAgain')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-5">
      <Honeypot registration={register('website')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cb-name" className={label}>
            {t('name')}
          </label>
          <input
            id="cb-name"
            autoComplete="name"
            placeholder={t('namePh')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'cb-name-err' : undefined}
            className={field}
            {...register('name')}
          />
          <FieldError id="cb-name-err" code={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="cb-phone" className={label}>
            {t('phone')}
          </label>
          <input
            id="cb-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder={t('phonePh')}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'cb-phone-err' : undefined}
            className={`${field} text-start rtl:text-end`}
            {...register('phone')}
          />
          <FieldError id="cb-phone-err" code={errors.phone?.message} />
        </div>
      </div>
      <fieldset>
        <legend className={label}>{t('bestTime')}</legend>
        <div className="flex flex-wrap gap-2">
          {TIMES.map((time) => (
            <button
              key={time}
              type="button"
              aria-pressed={bestTime === time}
              onClick={() => setValue('bestTime', time)}
              className={chip}
            >
              {t(time)}
            </button>
          ))}
        </div>
      </fieldset>
      <FormAlert error={error} />
      <button type="submit" disabled={isSubmitting} className={`${btn.primary} min-h-12 w-full`}>
        {isSubmitting ? t('sending') : t('submit')}
      </button>
    </form>
  );
}
