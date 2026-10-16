'use client';

import Image from 'next/image';
import { useId, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { site, type Locale } from '@/config/site';
import { recordAffordUse } from '@/actions/leads';
import { openChat } from '@/lib/client/events';
import { scrollToId } from '@/lib/client/scroll';
import { formatCompact, formatNumber } from '@/lib/format';
import { photoUrl } from '@/lib/photos';
import { btn, chip, container, eyebrow } from '@/components/ui/styles';
import { useHomeFilters } from './HomeExplorer';

const { down: DOWN, monthly: MONTHLY, years: YEARS, initialYears } = site.afford;
const pctOf = (v: number, r: { min: number; max: number }) => `${((v - r.min) / (r.max - r.min)) * 100}%`;

/** Budget estimate: down payment + monthly × 12 × years. No interest — labelled as an estimate. */
export function affordBudget(down: number, monthly: number, years: number) {
  return down + monthly * 12 * years;
}

export function AffordCalculator() {
  const { units, filters, update, consultantName } = useHomeFilters();
  const t = useTranslations('afford');
  const locale = useLocale() as Locale;
  const id = useId();
  const [down, setDown] = useState<number>(DOWN.initial);
  const [monthly, setMonthly] = useState<number>(MONTHLY.initial);
  const [years, setYears] = useState<number>(initialYears);
  const leadId = useRef<string | null>(null);

  const budget = affordBudget(down, monthly, years);
  const fitting = useMemo(
    () =>
      units
        .filter((u) => u.status !== 'sold' && u.price <= budget && (filters.sale === 'all' || u.saleType === filters.sale))
        .sort((a, b) => b.price - a.price),
    [units, budget, filters.sale],
  );

  async function record() {
    const res = await recordAffordUse({ leadId: leadId.current, down, monthly, years, budget, locale });
    if (res.ok && res.leadId) leadId.current = res.leadId;
  }

  function showThese() {
    void record();
    update({ max: Math.round(budget / 100_000) * 100_000 });
    scrollToId('homes');
  }

  function sendToRomany() {
    void record();
    openChat({
      source: 'afford',
      message: t('chatMessage', {
        name: consultantName,
        down: formatNumber(down, locale),
        monthly: formatNumber(monthly, locale),
        years,
        total: formatCompact(budget, locale),
      }),
    });
  }

  return (
    <section id="afford" aria-labelledby="afford-title" className={`${container} scroll-mt-24 pt-24`}>
      <div className="grid grid-cols-1 gap-8 rounded-[32px] bg-sky p-6 sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <p className={eyebrow}>{t('eyebrow')}</p>
          <h2 id="afford-title" className="mt-3 max-w-lg text-4xl font-extrabold sm:text-[44px]">
            {t('title')}
          </h2>

          <div className="mt-8 space-y-6">
            <Slider
              id={`${id}-down`}
              label={t('down')}
              value={down}
              range={DOWN}
              onChange={setDown}
              display={`EGP ${formatNumber(down, locale)}`}
            />
            <Slider
              id={`${id}-monthly`}
              label={t('monthly')}
              value={monthly}
              range={MONTHLY}
              onChange={setMonthly}
              display={`EGP ${formatNumber(monthly, locale)}`}
            />
            <fieldset>
              <legend className="mb-2 font-semibold text-ink">{t('over')}</legend>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((y) => (
                  <button key={y} type="button" aria-pressed={years === y} onClick={() => setYears(y)} className={chip}>
                    {t('years', { n: y })}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="flex flex-col rounded-card bg-card p-6 shadow-soft sm:p-7" aria-live="polite">
          <p className="text-ink-2">{t('resultLead')}</p>
          <p className="mt-2 font-display text-5xl font-extrabold text-primary">EGP {formatCompact(budget, locale)}</p>
          <p className="mt-4 text-ink">{t('fits', { count: fitting.length })}</p>
          {fitting.length > 0 && (
            <ul className="mt-4 flex gap-2.5">
              {fitting.slice(0, 4).map((u) => (
                <li key={u.id} className="relative h-[64px] w-[88px] overflow-hidden rounded-xl bg-fill">
                  {u.photos[0] && <Image src={photoUrl(u.photos[0].path)} alt="" fill sizes="88px" className="object-cover" />}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 text-sm text-ink-2">{t('note', { name: consultantName })}</p>
          <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
            <button type="button" onClick={showThese} className={btn.primary} disabled={fitting.length === 0}>
              {t('showThese')}
            </button>
            <button type="button" onClick={sendToRomany} className={btn.soft}>
              {t('send', { name: consultantName })}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  id,
  label,
  value,
  range,
  onChange,
  display,
}: {
  id: string;
  label: string;
  value: number;
  range: { min: number; max: number; step: number };
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-semibold text-ink">
          {label}
        </label>
        <output htmlFor={id} className="font-display text-xl font-bold text-ink">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        style={{ ['--pct' as string]: pctOf(value, range) }}
        className="w-full"
      />
    </div>
  );
}
