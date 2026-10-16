'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { requestBooking } from '@/actions/bookings';
import type { Consultant } from '@/components/layout/types';
import { FieldError, FormAlert, Honeypot } from '@/components/forms/FormBits';
import { Avatar } from '@/components/ui/Avatar';
import { btn, chip, field, label } from '@/components/ui/styles';
import { cairoIso, nextVisitDays, visitSlots } from '@/lib/cairo-time';
import { buildIcs, downloadIcs } from '@/lib/ics';
import { track } from '@/lib/client/track';
import { useNow } from '@/lib/client/use-available';
import { bookingSchema, type BookingInput, type FormError } from '@/lib/validation';

interface Props {
  unitId: string;
  title: string;
  location: string;
  consultant: Consultant;
}

/** Next 7 open days → time slots → name & phone → confirmation with "Add to calendar". */
export function BookingPicker({ unitId, title, location, consultant }: Props) {
  const t = useTranslations('booking');
  const locale = useLocale() as 'en' | 'ar';
  const now = useNow();
  const days = now ? nextVisitDays(now, consultant.openDays) : [];
  const slots = visitSlots(consultant.openFrom, consultant.openTo);
  const [day, setDay] = useState<string | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [error, setError] = useState<FormError | null>(null);
  const [done, setDone] = useState<{ startsAt: string; stored: boolean } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { unitId, startsAt: '', name: '', phone: '', note: '', website: '', locale },
  });

  const intlLocale = locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
  const weekdayFmt = new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone: 'UTC' });
  const dayMonthFmt = new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const timeFmt = (h: number) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2026, 0, 1, h)),
    );
  const whenFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Africa/Cairo',
  });

  function choose(nextDay: string | null, nextHour: number | null) {
    setDay(nextDay);
    setHour(nextHour);
    const d = days.find((x) => x.key === nextDay);
    setValue('startsAt', d && nextHour != null ? cairoIso(d.year, d.month, d.day, nextHour) : '', { shouldValidate: Boolean(errors.startsAt) });
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await requestBooking(values);
    if (res.ok) {
      track('Booking', { unit: unitId });
      setDone({ startsAt: values.startsAt, stored: res.stored });
    } else {
      setError(res.error === 'invalid' ? null : res.error);
      Object.entries(res.fields ?? {}).forEach(([k, v]) => setFieldError(k as keyof BookingInput, { message: v }));
    }
  });

  if (done) {
    const start = new Date(done.startsAt);
    return (
      <div role="status" className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar src={consultant.avatar} alt="" size={52} online />
          <p className="font-display text-xl font-bold text-ink">{t('doneTitle', { when: whenFmt.format(start) })}</p>
        </div>
        <p className="text-ink-2">{t('doneText')}</p>
        <FormAlert notStored={!done.stored} />
        <button
          type="button"
          className={`${btn.primary} w-full`}
          onClick={() =>
            downloadIcs(
              'baytak-visit.ics',
              buildIcs({
                uid: `${unitId}-${start.getTime()}@baytak`,
                start,
                minutes: 60,
                title: t('icsTitle', { name: consultant.name, title }),
                description: t('icsDesc', { name: consultant.name, phone: consultant.whatsapp }),
                location,
              }),
            )
          }
        >
          <CalendarPlus aria-hidden className="size-[18px]" />
          {t('calendar')}
        </button>
        <button type="button" onClick={() => setDone(null)} className={`${btn.outline} w-full`}>
          {t('another')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-5">
      <Honeypot registration={register('website')} />
      <input type="hidden" {...register('startsAt')} />
      <div className="flex items-center gap-3">
        <Avatar src={consultant.avatar} alt="" size={44} />
        <p className="text-[15px] text-ink-2">{t('intro')}</p>
      </div>

      <fieldset>
        <legend className={label}>{t('day')}</legend>
        {days.length === 0 ? (
          <div className="h-[68px] animate-pulse rounded-xl bg-fill" />
        ) : (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-pressed={day === d.key}
                onClick={() => choose(d.key, hour)}
                className={`${chip} h-auto min-w-[72px] shrink-0 flex-col py-2 leading-tight`}
              >
                <span className="text-xs opacity-80">{d.offset === 1 ? t('tomorrow') : weekdayFmt.format(d.date)}</span>
                <span className="font-semibold">{dayMonthFmt.format(d.date)}</span>
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className={label}>{t('time')}</legend>
        <div className="flex flex-wrap gap-2">
          {slots.map((h) => (
            <button key={h} type="button" aria-pressed={hour === h} onClick={() => choose(day, h)} className={`${chip} px-3.5`}>
              {timeFmt(h)}
            </button>
          ))}
        </div>
        <FieldError id="bk-when-err" code={errors.startsAt ? 'dayRequired' : undefined} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <label htmlFor="bk-name" className={label}>
            {t('name')}
          </label>
          <input id="bk-name" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'bk-name-err' : undefined} className={field} {...register('name')} />
          <FieldError id="bk-name-err" code={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="bk-phone" className={label}>
            {t('phone')}
          </label>
          <input
            id="bk-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="01x xxxx xxxx"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'bk-phone-err' : undefined}
            className={`${field} rtl:text-end`}
            {...register('phone')}
          />
          <FieldError id="bk-phone-err" code={errors.phone?.message} />
        </div>
      </div>
      <div>
        <label htmlFor="bk-note" className={label}>
          {t('note')}
        </label>
        <textarea id="bk-note" rows={2} placeholder={t('notePh')} className={`${field} py-3`} {...register('note')} />
      </div>
      <FormAlert error={error} />
      <button type="submit" disabled={isSubmitting} className={`${btn.primary} min-h-12 w-full`}>
        {isSubmitting ? t('sending') : t('submit')}
      </button>
    </form>
  );
}
