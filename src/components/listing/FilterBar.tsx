'use client';

import { useId, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { site, type Locale } from '@/config/site';
import { formatCompact } from '@/lib/format';
import { AREAS, BED_OPTIONS, type Filters } from '@/lib/listing';
import type { Finishing, UnitType } from '@/lib/types';
import { btn, chip, field, label as labelCls, segment } from '@/components/ui/styles';

export interface FilterOptions {
  types: UnitType[];
  developers: string[];
  compounds: { slug: string; name: string }[];
  deliveryYears: number[];
  finishings: Finishing[];
}

interface FilterBarProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  resultCount: number;
  /** "home" = the floating search card; "full" = every filter, for /units. */
  variant: 'home' | 'full';
  options?: FilterOptions;
  onShow?: () => void;
  onReset?: () => void;
  meta?: string;
}

export function FilterBar({ filters, onChange, resultCount, variant, options, onShow, onReset, meta }: FilterBarProps) {
  const t = useTranslations('search');
  const tAreas = useTranslations('areas');
  const tTypes = useTranslations('unitTypes');
  const tFinishing = useTranslations('finishing');
  const locale = useLocale() as Locale;
  const id = useId();
  const [more, setMore] = useState(false);
  const { min, max, step } = site.priceSlider;
  const priceValue = filters.max ?? max;
  const pct = `${((Math.min(priceValue, max) - min) / (max - min)) * 100}%`;

  const saleOptions =
    variant === 'home'
      ? ([
          ['offplan', t('offplan')],
          ['ready', t('ready')],
        ] as const)
      : ([
          ['all', t('all')],
          ['offplan', t('offplan')],
          ['ready', t('readyShort')],
        ] as const);

  return (
    <div
      role="search"
      aria-label={t('label')}
      className="rounded-panel border border-line bg-card p-5 shadow-float sm:p-6 lg:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={segment.wrap} role="tablist" aria-label={t('label')}>
          {saleOptions.map(([value, text]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filters.sale === value}
              onClick={() => onChange({ sale: value })}
              className={segment.item}
            >
              {text}
            </button>
          ))}
        </div>
        {meta && <p className="text-sm text-ink-2">{meta}</p>}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,1fr)] lg:items-end">
        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">{t('area')}</legend>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            <button type="button" aria-pressed={filters.area === 'all'} onClick={() => onChange({ area: 'all' })} className={`${chip} shrink-0`}>
              {t('allAreas')}
            </button>
            {AREAS.map((a) => (
              <button key={a} type="button" aria-pressed={filters.area === a} onClick={() => onChange({ area: a })} className={`${chip} shrink-0`}>
                {tAreas(a)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">{t('bedrooms')}</legend>
          <div className="flex gap-2">
            {BED_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={filters.beds === b}
                onClick={() => onChange({ beds: b })}
                className={`${chip} min-w-11 px-3`}
              >
                {b === 'any' ? t('any') : b === '4' ? '4+' : b}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${id}-price`} className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">
              {t('maxPrice')}
            </label>
            <output htmlFor={`${id}-price`} className="font-display text-lg font-bold text-ink">
              {filters.max == null ? t('any') : `EGP ${formatCompact(filters.max, locale)}`}
            </output>
          </div>
          <input
            id={`${id}-price`}
            type="range"
            min={min}
            max={max}
            step={step}
            value={Math.min(priceValue, max)}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange({ max: v >= max ? null : v });
            }}
            aria-valuetext={filters.max == null ? t('any') : `EGP ${formatCompact(filters.max, locale)}`}
            style={{ ['--pct' as string]: pct }}
            className="w-full"
          />
        </div>
      </div>

      {variant === 'full' && options && (
        <>
          <button
            type="button"
            onClick={() => setMore((m) => !m)}
            aria-expanded={more}
            aria-controls={`${id}-more`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-primary-hover dark:text-primary lg:hidden"
          >
            <SlidersHorizontal className="size-4" />
            {more ? t('fewerFilters') : t('moreFilters')}
          </button>
          <div id={`${id}-more`} className={`${more ? 'grid' : 'hidden'} mt-4 gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid lg:grid-cols-4 xl:grid-cols-7`}>
            <Select id={`${id}-type`} label={t('type')} value={filters.type} onChange={(v) => onChange({ type: v as Filters['type'] })}>
              <option value="all">{t('anyType')}</option>
              {options.types.map((ty) => (
                <option key={ty} value={ty}>
                  {tTypes(ty)}
                </option>
              ))}
            </Select>
            <Select id={`${id}-dev`} label={t('developer')} value={filters.developer} onChange={(v) => onChange({ developer: v })}>
              <option value="">{t('anyDeveloper')}</option>
              {options.developers.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Select id={`${id}-compound`} label={t('compound')} value={filters.compound} onChange={(v) => onChange({ compound: v })}>
              <option value="">{t('anyCompound')}</option>
              {options.compounds.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              id={`${id}-delivery`}
              label={t('delivery')}
              value={String(filters.delivery || '')}
              onChange={(v) => onChange({ delivery: Number(v) || 0 })}
            >
              <option value="">{t('anyDelivery')}</option>
              {options.deliveryYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Select id={`${id}-finishing`} label={t('finishing')} value={filters.finishing} onChange={(v) => onChange({ finishing: v })}>
              <option value="">{t('anyFinishing')}</option>
              {options.finishings.map((f) => (
                <option key={f} value={f}>
                  {tFinishing(f)}
                </option>
              ))}
            </Select>
            <NumberField id={`${id}-min`} label={t('minSize')} value={filters.minSize} onChange={(v) => onChange({ minSize: v })} />
            <NumberField id={`${id}-max`} label={t('maxSize')} value={filters.maxSize} onChange={(v) => onChange({ maxSize: v })} />
          </div>
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {onShow && (
          <button type="button" onClick={onShow} className={`${btn.primary} min-h-12 w-full sm:w-auto sm:min-w-[280px]`}>
            <Search className="size-[18px]" />
            {t('show', { count: resultCount })}
          </button>
        )}
        {onReset && (
          <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center px-2 text-[15px] font-semibold text-ink-2 underline-offset-4 hover:underline">
            {t('reset')}
          </button>
        )}
      </div>
    </div>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${field} pe-8`}>
        {children}
      </select>
    </div>
  );
}

function NumberField({ id, label, value, onChange }: { id: string; label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={10}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Math.max(0, Number(e.target.value)) : null)}
        className={field}
      />
    </div>
  );
}
