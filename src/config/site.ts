/**
 * Brand and site-wide constants. The brand name is a placeholder — rename it here only.
 * Everything about Romany himself (name, phone, hours, photos…) lives in the `settings` table.
 */
export const site = {
  brand: 'Baytak',
  brandAr: 'بيتك',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  /** Shown in the footer and on listings: when prices were last checked against developer sources. */
  pricesCheckedLabel: { en: 'October 2026', ar: 'أكتوبر ٢٠٢٦' },
  /** Range of the max-price slider in EGP. The top value means "Any". */
  priceSlider: { min: 8_000_000, max: 80_000_000, step: 1_000_000 },
  /** Ranges of the "What can I afford?" calculator in EGP. */
  afford: {
    down: { min: 200_000, max: 6_000_000, step: 50_000, initial: 800_000 },
    monthly: { min: 20_000, max: 400_000, step: 5_000, initial: 90_000 },
    years: [5, 7, 8, 10] as const,
    initialYears: 8,
  },
} as const;

export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
