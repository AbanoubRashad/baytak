import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from '@/config/site';

/** English lives at `/…`, Arabic at `/ar/…`. */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});
