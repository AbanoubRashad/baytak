import 'server-only';
import { locale as rootLocale } from 'next/root-params';
import { defaultLocale, isLocale, type Locale } from '@/config/site';

/** The current [locale] root param, validated. */
export async function currentLocale(): Promise<Locale> {
  const value = await rootLocale();
  return isLocale(value) ? value : defaultLocale;
}
