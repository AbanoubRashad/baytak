import type { Locale } from '@/config/site';
import { site } from '@/config/site';
import type { AreaKey, SaleType, UnitType, UnitWithCompound } from './types';

export const AREAS: AreaKey[] = ['new-cairo', 'north-coast', 'new-capital', 'october', 'zayed'];
export const BED_OPTIONS = ['any', '1', '2', '3', '4'] as const; // "4" means 4+
export type BedOption = (typeof BED_OPTIONS)[number];

export const pricePerM2 = (u: { price: number; sizeM2: number }) => Math.round(u.price / u.sizeM2);

/** "Jan 2030", "2029", "Near delivery", "Ready to move". */
export function deliveryLabel(delivery: string, locale: Locale, t: (key: 'near' | 'ready') => string): string {
  if (delivery === 'near' || delivery === 'ready') return t(delivery);
  const m = /^(\d{4})-(\d{2})$/.exec(delivery);
  if (m) {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)),
    );
  }
  return delivery;
}

/** Year used for "delivery" filtering and sorting (ready/near = now). */
export function deliveryYear(delivery: string): number {
  const y = /^(\d{4})/.exec(delivery);
  return y ? Number(y[1]) : 0;
}

/* ------------------------------------------------------------------ */
/* Filters — shared by the home search panel and the /units page, synced to the URL. */
/* ------------------------------------------------------------------ */

export type Sort = 'featured' | 'price-asc' | 'price-desc' | 'size-desc';

export interface Filters {
  sale: SaleType | 'all';
  area: AreaKey | 'all';
  beds: BedOption;
  /** Max price in EGP; null = Any. */
  max: number | null;
  type: UnitType | 'all';
  developer: string;
  compound: string;
  /** Latest acceptable delivery year; 0 = any. */
  delivery: number;
  finishing: string;
  minSize: number | null;
  maxSize: number | null;
  sort: Sort;
  page: number;
}

export const defaultFilters: Filters = {
  sale: 'all',
  area: 'all',
  beds: 'any',
  max: null,
  type: 'all',
  developer: '',
  compound: '',
  delivery: 0,
  finishing: '',
  minSize: null,
  maxSize: null,
  sort: 'featured',
  page: 1,
};

const intOrNull = (v: string | null) => {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

export function parseFilters(params: URLSearchParams, base: Partial<Filters> = {}): Filters {
  const f: Filters = { ...defaultFilters, ...base };
  const sale = params.get('sale');
  if (sale === 'offplan' || sale === 'ready') f.sale = sale;
  const area = params.get('area');
  if (area && (AREAS as string[]).includes(area)) f.area = area as AreaKey;
  const beds = params.get('beds');
  if (beds && (BED_OPTIONS as readonly string[]).includes(beds)) f.beds = beds as BedOption;
  const max = intOrNull(params.get('max'));
  if (max && max < site.priceSlider.max) f.max = max;
  const type = params.get('type');
  if (type) f.type = type as UnitType;
  f.developer = params.get('developer') ?? f.developer;
  f.compound = params.get('compound') ?? f.compound;
  f.delivery = intOrNull(params.get('delivery')) ?? f.delivery;
  f.finishing = params.get('finishing') ?? f.finishing;
  f.minSize = intOrNull(params.get('minSize'));
  f.maxSize = intOrNull(params.get('maxSize'));
  const sort = params.get('sort');
  if (sort === 'price-asc' || sort === 'price-desc' || sort === 'size-desc') f.sort = sort;
  f.page = intOrNull(params.get('page')) ?? 1;
  return f;
}

/** Only non-default values go in the URL, so links stay short and shareable. */
export function filtersToQuery(f: Filters, base: Partial<Filters> = {}): string {
  const d = { ...defaultFilters, ...base };
  const q = new URLSearchParams();
  if (f.sale !== d.sale) q.set('sale', f.sale);
  if (f.area !== d.area) q.set('area', f.area);
  if (f.beds !== d.beds) q.set('beds', f.beds);
  if (f.max != null) q.set('max', String(f.max));
  if (f.type !== d.type) q.set('type', f.type);
  if (f.developer) q.set('developer', f.developer);
  if (f.compound) q.set('compound', f.compound);
  if (f.delivery) q.set('delivery', String(f.delivery));
  if (f.finishing) q.set('finishing', f.finishing);
  if (f.minSize != null) q.set('minSize', String(f.minSize));
  if (f.maxSize != null) q.set('maxSize', String(f.maxSize));
  if (f.sort !== d.sort) q.set('sort', f.sort);
  if (f.page > 1) q.set('page', String(f.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function matches(u: UnitWithCompound, f: Filters): boolean {
  if (u.status === 'sold') return false;
  if (f.sale !== 'all' && u.saleType !== f.sale) return false;
  if (f.area !== 'all' && u.compound.area !== f.area) return false;
  if (f.beds !== 'any') {
    const b = Number(f.beds);
    if (b >= 4 ? u.beds < 4 : u.beds !== b) return false;
  }
  if (f.max != null && u.price > f.max) return false;
  if (f.type !== 'all' && u.unitType !== f.type) return false;
  if (f.developer && u.compound.developer !== f.developer) return false;
  if (f.compound && u.compound.slug !== f.compound) return false;
  if (f.delivery && deliveryYear(u.delivery) > f.delivery) return false;
  if (f.finishing && u.finishing !== f.finishing) return false;
  if (f.minSize != null && u.sizeM2 < f.minSize) return false;
  if (f.maxSize != null && u.sizeM2 > f.maxSize) return false;
  return true;
}

export function sortUnits(units: UnitWithCompound[], sort: Sort): UnitWithCompound[] {
  const list = [...units];
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    case 'size-desc':
      return list.sort((a, b) => b.sizeM2 - a.sizeM2);
    default:
      return list.sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort - b.sort);
  }
}

export function applyFilters(units: UnitWithCompound[], f: Filters) {
  return sortUnits(units.filter((u) => matches(u, f)), f.sort);
}

/** Short tag shown on the photo: "5% down · 10 yrs", "Over 3.3 yrs", "Cash", "Instalments". */
export function planTag(
  u: Pick<UnitWithCompound, 'downPaymentPct' | 'installmentYears' | 'cashOnly' | 'saleType'>,
  t: (key: 'planDownYears' | 'planOver' | 'planCash' | 'planInstalments' | 'planReady', v?: Record<string, string | number>) => string,
): string {
  if (u.cashOnly) return t('planCash');
  if (u.downPaymentPct != null && u.installmentYears != null) return t('planDownYears', { pct: u.downPaymentPct, years: u.installmentYears });
  if (u.installmentYears != null) return t('planOver', { years: u.installmentYears });
  return u.saleType === 'ready' ? t('planReady') : t('planInstalments');
}

/** Rough area counts for the "N here" tags. */
export function countByArea(units: UnitWithCompound[]): Record<AreaKey, { offplan: number; ready: number }> {
  const out = Object.fromEntries(AREAS.map((a) => [a, { offplan: 0, ready: 0 }])) as Record<AreaKey, { offplan: number; ready: number }>;
  for (const u of units) if (u.status !== 'sold') out[u.compound.area][u.saleType] += 1;
  return out;
}
