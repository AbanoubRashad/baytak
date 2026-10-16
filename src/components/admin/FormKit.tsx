'use client';

import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { field, label as labelCls } from '@/components/ui/styles';

interface Base {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

function Wrap({ id, label, error, hint, className = '', children }: Base & { children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-2">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm font-medium text-heart">
          {error}
        </p>
      )}
    </div>
  );
}

export function Text({ reg, dir, ...p }: Base & { reg: UseFormRegisterReturn; dir?: 'rtl' | 'ltr'; type?: string; inputMode?: 'numeric' | 'decimal' }) {
  return (
    <Wrap {...p}>
      <input id={p.id} dir={dir} type={p.type ?? 'text'} inputMode={p.inputMode} aria-invalid={Boolean(p.error)} aria-describedby={p.error ? `${p.id}-err` : undefined} className={field} {...reg} />
    </Wrap>
  );
}

export function Num(props: Base & { reg: UseFormRegisterReturn }) {
  return <Text {...props} type="number" inputMode="decimal" />;
}

export function Area({ reg, dir, rows = 4, ...p }: Base & { reg: UseFormRegisterReturn; dir?: 'rtl' | 'ltr'; rows?: number }) {
  return (
    <Wrap {...p}>
      <textarea id={p.id} dir={dir} rows={rows} aria-invalid={Boolean(p.error)} className={`${field} py-3`} {...reg} />
    </Wrap>
  );
}

export function Choice({ reg, options, ...p }: Base & { reg: UseFormRegisterReturn; options: [string, string][] }) {
  return (
    <Wrap {...p}>
      <select id={p.id} aria-invalid={Boolean(p.error)} className={field} {...reg}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function Check({ id, label, reg }: { id: string; label: string; reg: UseFormRegisterReturn }) {
  return (
    <label htmlFor={id} className="flex min-h-11 items-center gap-3 font-medium text-ink">
      <input id={id} type="checkbox" className="size-5 accent-[#2B76A6]" {...reg} />
      {label}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[20px] border border-line bg-card p-5 sm:p-6">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
        {title}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export const FINISHING_OPTIONS: [string, string][] = [
  ['', '—'],
  ['not-finished', 'Not finished'],
  ['semi-finished', 'Semi-finished'],
  ['finished', 'Fully finished'],
  ['finished-ac', 'Finished with AC'],
];

export const UNIT_TYPE_OPTIONS: [string, string][] = [
  ['apartment', 'Apartment'],
  ['studio', 'Studio'],
  ['duplex', 'Duplex'],
  ['loft', 'Loft'],
  ['penthouse', 'Penthouse'],
  ['chalet', 'Chalet'],
  ['townhouse', 'Townhouse'],
  ['twin-house', 'Twin house'],
  ['villa', 'Villa'],
];

export const AREA_OPTIONS: [string, string][] = [
  ['new-cairo', 'New Cairo'],
  ['north-coast', 'North Coast'],
  ['new-capital', 'New Capital'],
  ['october', '6th of October'],
  ['zayed', 'Sheikh Zayed'],
];

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
