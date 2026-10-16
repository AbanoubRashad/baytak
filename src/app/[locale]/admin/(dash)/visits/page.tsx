export const metadata = { title: 'Visits' };

import { Suspense } from 'react';
import { requireAdminPage } from '@/lib/server/admin';
import { VisitsBoard, type AdminBooking } from '@/components/admin/VisitsBoard';

export default function VisitsPage({ searchParams }: PageProps<'/[locale]/admin/visits'>) {
  return (
    <Suspense fallback={<div className="p-8 text-ink-2">Loading visits…</div>}>
      <Visits searchParams={searchParams} />
    </Suspense>
  );
}

const DAY = 24 * 3600_000;

async function Visits({ searchParams }: Pick<PageProps<'/[locale]/admin/visits'>, 'searchParams'>) {
  const [{ supabase }, params] = await Promise.all([requireAdminPage(), searchParams]);
  const week = Number(typeof params.week === 'string' ? params.week : 0) || 0;
  // Week starts on Saturday (Romany's working week), Cairo time.
  const now = new Date();
  const cairoToday = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(now) + 'T00:00:00Z');
  const sinceSat = (cairoToday.getUTCDay() + 1) % 7;
  const start = new Date(cairoToday.getTime() - sinceSat * DAY + week * 7 * DAY - 3 * 3600_000);
  const end = new Date(start.getTime() + 7 * DAY);

  const { data } = await supabase
    .from('bookings')
    .select('id, starts_at, status, note, lead_id, leads(name, phone), units(slug, project, unit_type), compounds(name)')
    .gte('starts_at', start.toISOString())
    .lt('starts_at', end.toISOString())
    .order('starts_at');

  type Row = {
    id: string;
    starts_at: string;
    status: AdminBooking['status'];
    note: string | null;
    lead_id: string;
    leads: { name: string; phone: string | null } | null;
    units: { slug: string; project: string | null; unit_type: string } | null;
    compounds: { name: string } | null;
  };
  const bookings: AdminBooking[] = ((data ?? []) as unknown as Row[]).map((b) => ({
    id: b.id,
    startsAt: b.starts_at,
    status: b.status,
    note: b.note,
    leadId: b.lead_id,
    name: b.leads?.name || 'Visitor',
    phone: b.leads?.phone ?? null,
    place: [b.units?.project ?? b.units?.unit_type, b.compounds?.name].filter(Boolean).join(' · '),
    unitSlug: b.units?.slug ?? null,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Visits</h1>
      <p className="mt-1 text-ink-2">Confirm, reschedule or cancel. Times are Cairo time.</p>
      <VisitsBoard bookings={bookings} weekStart={start.toISOString()} week={week} />
    </div>
  );
}
