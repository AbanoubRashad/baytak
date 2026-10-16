'use server';

import { after } from 'next/server';
import { allowRequest } from '@/lib/server/guard';
import { notify } from '@/lib/server/notify';
import { createServiceClient, hasServiceRole } from '@/lib/supabase/service';
import { bookingSchema, fieldErrors, type ActionResult, type BookingInput } from '@/lib/validation';

const DAY = 24 * 60 * 60 * 1000;

/** "Book a visit" on a unit page: creates a lead (source booking) and a requested booking. */
export async function requestBooking(input: BookingInput): Promise<ActionResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid', fields: fieldErrors(parsed.error) };
  const { unitId, startsAt, name, phone, note, website, locale } = parsed.data;
  if (website) return { ok: true, stored: false };

  const when = new Date(startsAt).getTime();
  const now = Date.now();
  if (Number.isNaN(when) || when < now || when > now + 8 * DAY) {
    return { ok: false, error: 'invalid', fields: { startsAt: 'dayRequired' } };
  }
  if (!(await allowRequest('booking', 5, 600))) return { ok: false, error: 'rate' };
  if (!hasServiceRole) return { ok: true, stored: false };

  const db = createServiceClient();
  const { data: unit } = await db.from('units').select('id, slug, compound_id, compounds(name)').eq('id', unitId).maybeSingle();
  if (!unit) return { ok: false, error: 'invalid' };

  const { data: lead, error } = await db
    .from('leads')
    .insert({ name, phone, source: 'booking', unit_id: unit.id, compound_id: unit.compound_id, locale, next_step: 'Confirm visit' })
    .select('id')
    .single();
  if (error) {
    console.error('[booking:lead]', error.message);
    return { ok: false, error: 'failed' };
  }
  const { error: bookingError } = await db
    .from('bookings')
    .insert({ lead_id: lead.id, unit_id: unit.id, compound_id: unit.compound_id, starts_at: startsAt, note: note || null });
  if (bookingError) {
    console.error('[booking]', bookingError.message);
    return { ok: false, error: 'failed' };
  }
  if (note) await db.from('messages').insert({ lead_id: lead.id, sender: 'client', body: note });

  const compoundName = (unit.compounds as unknown as { name: string } | null)?.name ?? '';
  const cairo = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'full', timeStyle: 'short' }).format(new Date(startsAt));
  after(() =>
    notify({
      subject: `Visit request: ${name} — ${cairo}`,
      lines: [
        ['Name', name],
        ['Mobile', phone],
        ['When', cairo],
        ['Home', `${compoundName} (${unit.slug})`],
        ['Note', note],
      ],
      adminPath: `/admin/visits`,
    }),
  );
  return { ok: true, stored: true };
}
