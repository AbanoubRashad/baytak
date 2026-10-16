import { getRequestConfig } from 'next-intl/server';
import { locale as rootLocale } from 'next/root-params';
import { defaultLocale, isLocale } from '@/config/site';

export default getRequestConfig(async ({ locale: explicit }) => {
  // An explicit locale (e.g. getTranslations({locale})) wins; otherwise read the [locale] root param,
  // which keeps pages statically renderable under Cache Components.
  const candidate = explicit ?? (await rootLocale());
  const locale = isLocale(candidate) ? candidate : defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Africa/Cairo',
  };
});
