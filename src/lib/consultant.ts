import type { Consultant } from '@/components/layout/types';
import type { Locale } from '@/config/site';
import { pick } from './format';
import type { Settings } from './types';

export function toConsultant(s: Settings, locale: Locale): Consultant {
  return {
    name: pick(locale, s.consultantName, s.consultantNameAr),
    title: pick(locale, s.title, s.titleAr),
    hours: pick(locale, s.hours, s.hoursAr),
    avatar: s.avatarPath,
    portrait: s.portraitPath,
    phone: s.phone,
    whatsapp: s.whatsapp,
    available: s.available,
    openDays: s.openDays,
    openFrom: s.openFrom,
    openTo: s.openTo,
  };
}
