import type { Locale } from '@/config/site';
import { formatNumber, pick } from './format';
import { deliveryLabel } from './listing';
import type { UnitWithCompound } from './types';

/** Loose translator signature shared by next-intl's server and client `t`. */
export type T = (key: string, values?: Record<string, string | number | Date>) => string;

export const compoundName = (c: { name: string; nameAr: string | null }, locale: Locale) => pick(locale, c.name, c.nameAr);
export const compoundLocation = (c: { location: string; locationAr: string | null }, locale: Locale) => pick(locale, c.location, c.locationAr);

/** "2-bedroom apartment with terrace in Central Residence". `t` must be the root translator. */
export function unitTitle(u: UnitWithCompound, t: T, locale: Locale): string {
  const type = t(`unitTypes.${u.unitType}`);
  const place = u.project ?? compoundName(u.compound, locale);
  const values = { beds: u.beds, type: locale === 'ar' ? type : type.toLowerCase(), compound: place };
  if (u.gardenM2) return t('unit.titleGarden', values);
  if (u.terraceM2) return t('unit.titleTerrace', values);
  return t('unit.title', values);
}

/** Short card title: the compound name, e.g. "Central Residence – Hyde Park Central". */
export function unitHeadline(u: UnitWithCompound, locale: Locale) {
  const compound = compoundName(u.compound, locale);
  return u.project ? `${u.project} – ${compound}` : compound;
}

export function unitDelivery(u: UnitWithCompound, t: T, locale: Locale) {
  return deliveryLabel(u.delivery, locale, (k) => t(`listing.${k}`));
}

export const egp = (n: number, t: T, locale: Locale) => t('common.egp', { amount: formatNumber(n, locale) });
