'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/config/site';
import { formatNumber } from '@/lib/format';
import type { Frequency, Unit } from '@/lib/types';
import { chip, segment } from '@/components/ui/styles';

const YEARS = [5, 7, 8, 10] as const;
const DOWN = { min: 5, max: 30, step: 1 };

type PlanUnit = Pick<
  Unit,
  'price' | 'downPaymentAmount' | 'downPaymentPct' | 'installmentAmount' | 'installmentFrequency' | 'installmentYears' | 'cashOnly'
>;

/** Simple instalment estimate: (price − down payment) spread evenly. No interest. */
export function instalment(price: number, downPct: number, years: number, freq: Frequency) {
  const remaining = price * (1 - downPct / 100);
  return Math.round(remaining / (years * (freq === 'quarterly' ? 4 : 12)));
}

/** Developer's official plan (when known) and a "Try your own plan" calculator. */
export function PaymentCalculator({ unit }: { unit: PlanUnit }) {
  const t = useTranslations('unit');
  const locale = useLocale() as Locale;
  const id = useId();
  const official = unit.downPaymentAmount != null && unit.installmentAmount != null;
  const [downPct, setDownPct] = useState(() => Math.min(DOWN.max, Math.max(DOWN.min, Math.round(unit.downPaymentPct ?? 10))));
  const [years, setYears] = useState<number>(() =>
    unit.installmentYears && (YEARS as readonly number[]).includes(unit.installmentYears) ? unit.installmentYears : 8,
  );
  const [freq, setFreq] = useState<Frequency>(unit.installmentFrequency ?? 'quarterly');

  const egp = (n: number) => `EGP ${formatNumber(n, locale)}`;
  const down = Math.round((unit.price * downPct) / 100);
  const each = instalment(unit.price, downPct, years, freq);
  const pct = `${((downPct - DOWN.min) / (DOWN.max - DOWN.min)) * 100}%`;

  return (
    <div>
      {official ? (
        <div className="rounded-2xl border border-sky-line bg-pale p-4">
          <p className="font-semibold text-primary-hover dark:text-primary">{t('officialPlan')}</p>
          <dl className="mt-2 space-y-1.5 text-[15px]">
            <Row label={unit.downPaymentPct != null ? t('downPayment', { pct: unit.downPaymentPct }) : t('downPaymentNoPct')} value={egp(unit.downPaymentAmount!)} />
            <Row label={unit.installmentFrequency === 'monthly' ? t('everyMonth') : t('every3')} value={egp(unit.installmentAmount!)} />
            {unit.installmentYears != null && <Row label={t('duration')} value={`${unit.installmentYears} ${locale === 'ar' ? 'سنوات' : 'years'}`} />}
          </dl>
        </div>
      ) : (
        <p className="rounded-2xl border border-sky-line bg-pale p-4 text-[15px] text-ink-2">{unit.cashOnly ? t('cashOnly') : t('planOnRequest')}</p>
      )}

      <h3 className="mt-6 font-semibold text-ink" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
        {t('tryOwn')}
      </h3>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <label htmlFor={`${id}-down`} className="text-[15px] text-ink-2">
          {t('down')}
        </label>
        <output htmlFor={`${id}-down`} className="font-semibold text-ink">
          {downPct}% · {egp(down)}
        </output>
      </div>
      <input
        id={`${id}-down`}
        type="range"
        min={DOWN.min}
        max={DOWN.max}
        step={DOWN.step}
        value={downPct}
        onChange={(e) => setDownPct(Number(e.target.value))}
        aria-valuetext={`${downPct}% · ${egp(down)}`}
        style={{ ['--pct' as string]: pct }}
        className="w-full"
      />
      <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t('duration')}>
        {YEARS.map((y) => (
          <button key={y} type="button" aria-pressed={years === y} onClick={() => setYears(y)} className={`${chip} px-3.5`}>
            {locale === 'ar' ? `${y} سنوات` : `${y} yrs`}
          </button>
        ))}
      </div>
      <div className={`${segment.wrap} mt-3`} role="group">
        {(['quarterly', 'monthly'] as const).map((f) => (
          <button key={f} type="button" aria-pressed={freq === f} onClick={() => setFreq(f)} className={segment.item}>
            {t(f)}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4" aria-live="polite">
        <span className="text-[15px] text-ink-2">{freq === 'quarterly' ? t('instalmentQ') : t('instalmentM')}</span>
        <span className="font-display text-[28px] font-extrabold leading-none text-primary">{egp(each)}</span>
      </div>
      <p className="mt-2 text-[13px] text-ink-2">{t('estimate')}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-2">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
