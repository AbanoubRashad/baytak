import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { InboxCompound, InboxLead, InboxMessage, InboxStats, InboxUnit, UpcomingVisit } from './types';

/* All reads here run with Romany's session, so Row Level Security applies. */

interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: InboxLead['source'];
  status: InboxLead['status'];
  preferred_time: InboxLead['preferredTime'];
  budget: string | null;
  next_step: string | null;
  notes: string | null;
  locale: 'en' | 'ar';
  created_at: string;
  last_message_at: string | null;
  unit_id: string | null;
  compound_id: string | null;
  messages?: MessageRow[];
}

interface MessageRow {
  id: string;
  lead_id: string;
  sender: InboxMessage['sender'];
  channel: InboxMessage['channel'];
  body: string;
  created_at: string;
}

export const LEAD_SELECT =
  'id, name, phone, email, source, status, preferred_time, budget, next_step, notes, locale, created_at, last_message_at, unit_id, compound_id, messages(id, lead_id, sender, channel, body, created_at)';

export function toMessage(m: MessageRow): InboxMessage {
  return { id: m.id, leadId: m.lead_id, sender: m.sender, channel: m.channel, body: m.body, createdAt: m.created_at };
}

export function toLead(r: LeadRow): InboxLead {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    source: r.source,
    status: r.status,
    preferredTime: r.preferred_time,
    budget: r.budget,
    nextStep: r.next_step,
    notes: r.notes,
    locale: r.locale,
    createdAt: r.created_at,
    lastMessageAt: r.last_message_at,
    unitId: r.unit_id,
    compoundId: r.compound_id,
    messages: [...(r.messages ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)).map(toMessage),
  };
}

export async function getInboxLeads(db: SupabaseClient): Promise<InboxLead[]> {
  const { data, error } = await db
    .from('leads')
    .select(LEAD_SELECT)
    .neq('status', 'closed')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as LeadRow[]).map(toLead);
}

/** Lightweight unit/compound catalogue so the inbox can show what a lead asked about. */
export async function getInboxCatalogue(db: SupabaseClient): Promise<{ units: InboxUnit[]; compounds: InboxCompound[] }> {
  const [{ data: units }, { data: compounds }] = await Promise.all([
    db.from('units').select('id, slug, unit_type, beds, project, price, compound_id, unit_photos(path, sort), compounds(name, area)').neq('listing_status', 'archived'),
    db.from('compounds').select('id, name, price_from, compound_photos(path, sort)').neq('status', 'archived'),
  ]);
  type U = {
    id: string;
    slug: string;
    unit_type: string;
    beds: number;
    project: string | null;
    price: number;
    compound_id: string;
    unit_photos: { path: string; sort: number }[];
    compounds: { name: string; area: string } | null;
  };
  type C = { id: string; name: string; price_from: number | null; compound_photos: { path: string; sort: number }[] };
  const first = (photos: { path: string; sort: number }[]) => [...photos].sort((a, b) => a.sort - b.sort)[0]?.path ?? null;
  const type = (t: string) => t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ');
  return {
    units: ((units ?? []) as unknown as U[]).map((u) => ({
      id: u.id,
      slug: u.slug,
      title: `${type(u.unit_type)} · ${u.project ? `${u.project} – ` : ''}${u.compounds?.name ?? ''}`,
      price: Number(u.price),
      photo: first(u.unit_photos),
      compoundId: u.compound_id,
      compoundName: u.compounds?.name ?? '',
      area: u.compounds?.area ?? '',
      beds: u.beds,
    })),
    compounds: ((compounds ?? []) as unknown as C[]).map((c) => ({
      id: c.id,
      name: c.name,
      photo: first(c.compound_photos),
      priceFrom: c.price_from == null ? null : Number(c.price_from),
    })),
  };
}

export async function getUpcomingVisits(db: SupabaseClient, limit = 6): Promise<UpcomingVisit[]> {
  const { data } = await db
    .from('bookings')
    .select('id, lead_id, starts_at, status, leads(name), units(project, unit_type), compounds(name)')
    .gte('starts_at', new Date(Date.now() - 2 * 3600_000).toISOString())
    .in('status', ['requested', 'confirmed'])
    .order('starts_at')
    .limit(limit);
  type B = {
    id: string;
    lead_id: string;
    starts_at: string;
    status: UpcomingVisit['status'];
    leads: { name: string } | null;
    units: { project: string | null; unit_type: string } | null;
    compounds: { name: string } | null;
  };
  return ((data ?? []) as unknown as B[]).map((b) => ({
    id: b.id,
    leadId: b.lead_id,
    leadName: b.leads?.name || 'Visitor',
    startsAt: b.starts_at,
    status: b.status,
    place: [b.units?.project, b.compounds?.name].filter(Boolean).join(' · ') || 'Visit',
  }));
}

export async function getInboxStats(db: SupabaseClient): Promise<InboxStats> {
  const now = Date.now();
  const week = 7 * 24 * 3600_000;
  const iso = (ms: number) => new Date(ms).toISOString();

  // Upcoming Friday–Saturday (Cairo weekend) window.
  const today = new Date(now);
  const daysToFri = (5 - today.getUTCDay() + 7) % 7;
  const friStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysToFri) - 3 * 3600_000;
  const weekendEnd = friStart + 2 * 24 * 3600_000;

  const [thisWeek, lastWeek, visits, weekend, replies, saved] = await Promise.all([
    db.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', iso(now - week)).neq('name', ''),
    db.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', iso(now - 2 * week)).lt('created_at', iso(now - week)).neq('name', ''),
    db.from('bookings').select('id', { count: 'exact', head: true }).gte('starts_at', iso(now)).in('status', ['requested', 'confirmed']),
    db.from('bookings').select('id', { count: 'exact', head: true }).gte('starts_at', iso(friStart)).lt('starts_at', iso(weekendEnd)).in('status', ['requested', 'confirmed']),
    db.from('leads').select('created_at, first_reply_at').not('first_reply_at', 'is', null).gte('created_at', iso(now - 30 * 24 * 3600_000)).limit(500),
    db.from('units').select('slug, project, unit_type, save_count, compounds(name)').order('save_count', { ascending: false }).limit(1),
  ]);

  const gaps = (replies.data ?? []).map((r) => (Date.parse(r.first_reply_at as string) - Date.parse(r.created_at as string)) / 60_000);
  const top = (saved.data?.[0] ?? null) as unknown as { project: string | null; unit_type: string; save_count: number; compounds: { name: string } | null } | null;

  return {
    newThisWeek: thisWeek.count ?? 0,
    newLastWeek: lastWeek.count ?? 0,
    visitsBooked: visits.count ?? 0,
    visitsThisWeekend: weekend.count ?? 0,
    avgFirstReplyMinutes: gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null,
    mostSaved: top && top.save_count > 0 ? { title: top.project ?? top.compounds?.name ?? top.unit_type, saves: top.save_count } : null,
  };
}
