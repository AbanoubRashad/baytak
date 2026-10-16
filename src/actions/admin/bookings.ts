'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/server/admin';

const patchSchema = z.object({
  status: z.enum(['requested', 'confirmed', 'cancelled', 'done']).optional(),
  startsAt: z.iso.datetime({ offset: true }).optional(),
});

/** Confirm, reschedule, cancel or complete a visit. */
export async function updateBooking(id: string, patch: z.input<typeof patchSchema>) {
  const bookingId = z.uuid().parse(id);
  const p = patchSchema.parse(patch);
  const { supabase } = await requireAdmin();
  const row: Record<string, string> = {};
  if (p.status) row.status = p.status;
  if (p.startsAt) row.starts_at = p.startsAt;
  const { error } = await supabase.from('bookings').update(row).eq('id', bookingId);
  return { ok: !error, error: error?.message };
}
