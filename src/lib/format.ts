import type { Locale } from '@/config/site';

/** Numbers always use Latin digits — clearer for prices, and what Egyptian buyers see on contracts. */
const numberLocale = (locale: Locale) => (locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US');

export function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(numberLocale(locale), { maximumFractionDigits: 0 }).format(n);
}

/** "9.5M" / "475K" — for compact labels like "From EGP 9.7M". */
export function formatCompact(n: number, locale: Locale) {
  if (locale === 'ar') {
    if (n >= 1_000_000) return `${trim(n / 1_000_000)} مليون`;
    if (n >= 1_000) return `${trim(n / 1_000)} ألف`;
    return formatNumber(n, locale);
  }
  if (n >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (n >= 1_000) return `${trim(n / 1_000)}K`;
  return formatNumber(n, locale);
}

function trim(n: number) {
  return (Math.round(n * 10) / 10).toString();
}

/** Picks the Arabic value when available, else English. */
export function pick<T>(locale: Locale, en: T, ar: T | null | undefined): T {
  return locale === 'ar' && ar != null && ar !== '' ? ar : en;
}

/** `tel:` link from an international number without "+". */
export const telHref = (phone: string) => `tel:+${phone.replace(/\D/g, '')}`;

/** Initials for avatar fallbacks: "Mariam Adel" → "MA". */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
