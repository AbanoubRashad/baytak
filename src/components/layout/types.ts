import type { Settings } from '@/lib/types';

/** The localized slice of Settings that client chrome (header, chat, bottom bar) needs. */
export interface Consultant extends Pick<Settings, 'phone' | 'whatsapp' | 'available' | 'openDays' | 'openFrom' | 'openTo'> {
  name: string;
  title: string;
  hours: string;
  avatar: string;
  portrait: string;
}
