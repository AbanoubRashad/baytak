import type { BestTime, LeadSource, LeadStatus } from '@/lib/types';

export interface InboxMessage {
  id: string;
  leadId: string;
  sender: 'client' | 'consultant';
  channel: 'web' | 'whatsapp' | 'email';
  body: string;
  createdAt: string;
}

export interface InboxLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: LeadSource;
  status: LeadStatus;
  preferredTime: BestTime | null;
  budget: string | null;
  nextStep: string | null;
  notes: string | null;
  locale: 'en' | 'ar';
  createdAt: string;
  lastMessageAt: string | null;
  unitId: string | null;
  compoundId: string | null;
  messages: InboxMessage[];
}

export interface InboxUnit {
  id: string;
  slug: string;
  title: string;
  price: number;
  photo: string | null;
  compoundId: string;
  compoundName: string;
  area: string;
  beds: number;
}

export interface InboxCompound {
  id: string;
  name: string;
  photo: string | null;
  priceFrom: number | null;
}

export interface UpcomingVisit {
  id: string;
  leadId: string;
  leadName: string;
  startsAt: string;
  status: 'requested' | 'confirmed' | 'cancelled' | 'done';
  place: string;
}

export interface InboxStats {
  newThisWeek: number;
  newLastWeek: number;
  visitsBooked: number;
  visitsThisWeekend: number;
  avgFirstReplyMinutes: number | null;
  mostSaved: { title: string; saves: number } | null;
}

export const STAGES: { key: LeadStatus; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'visit_booked', label: 'Visit booked' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'reserved', label: 'Reserved' },
];

export const SOURCE_LABEL: Record<LeadSource, string> = {
  chat: 'Chat',
  callback: 'Call-back',
  booking: 'Visit booking',
  contact: 'Contact form',
  whatsapp: 'WhatsApp',
  compare: 'Compare',
  afford: 'Afford tool',
};
