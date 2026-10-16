'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';
import { SETTINGS_TAG } from '@/lib/data/settings';
import { requireAdmin } from '@/lib/server/admin';
import { emailLead } from '@/lib/server/notify';
import { toMessage, LEAD_SELECT, toLead } from '@/lib/admin/data';
import type { InboxLead, InboxMessage } from '@/lib/admin/types';
import { site } from '@/config/site';

const replySchema = z.object({
  leadId: z.uuid(),
  body: z.string().trim().min(1).max(4000),
  channel: z.enum(['web', 'whatsapp', 'email']),
});

/**
 * Romany's reply. It is always stored (and appears in the visitor's chat window);
 * "email" also sends it through Resend, "whatsapp" is opened on his phone by the client.
 * A reply to a New lead moves it to Contacted (database trigger).
 */
export async function replyToLead(input: z.input<typeof replySchema>): Promise<{ ok: true; message: InboxMessage; emailed: boolean } | { ok: false; error: string }> {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Write a message first.' };
  const { supabase } = await requireAdmin();
  const { leadId, body, channel } = parsed.data;

  let emailed = false;
  if (channel === 'email') {
    const { data: lead } = await supabase.from('leads').select('email, name').eq('id', leadId).single();
    if (!lead?.email) return { ok: false, error: 'This lead has no email address.' };
    emailed = await emailLead(lead.email, `A message from ${site.brand}`, body, process.env.NOTIFY_EMAIL_TO);
    if (!emailed) return { ok: false, error: 'The email could not be sent. Is RESEND_API_KEY set?' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ lead_id: leadId, sender: 'consultant', channel, body })
    .select('id, lead_id, sender, channel, body, created_at')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: toMessage(data), emailed };
}

const statusSchema = z.enum(['new', 'contacted', 'visit_booked', 'negotiating', 'reserved', 'closed']);

export async function setLeadStatus(leadId: string, status: z.infer<typeof statusSchema>) {
  const id = z.uuid().parse(leadId);
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('leads').update({ status: statusSchema.parse(status) }).eq('id', id);
  return { ok: !error };
}

const leadPatch = z.object({
  name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.union([z.literal(''), z.email()]).optional(),
  budget: z.string().trim().max(200).optional(),
  nextStep: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export async function updateLead(leadId: string, patch: z.input<typeof leadPatch>) {
  const id = z.uuid().parse(leadId);
  const p = leadPatch.parse(patch);
  const { supabase } = await requireAdmin();
  const row: Record<string, string | null> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.phone !== undefined) row.phone = p.phone || null;
  if (p.email !== undefined) row.email = p.email || null;
  if (p.budget !== undefined) row.budget = p.budget || null;
  if (p.nextStep !== undefined) row.next_step = p.nextStep || null;
  if (p.notes !== undefined) row.notes = p.notes || null;
  const { error } = await supabase.from('leads').update(row).eq('id', id);
  return { ok: !error };
}

/** Used by the Realtime listener to fetch a lead it was just told about. */
export async function getLead(leadId: string): Promise<InboxLead | null> {
  const id = z.uuid().parse(leadId);
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('leads').select(LEAD_SELECT).eq('id', id).maybeSingle();
  return data ? toLead(data as Parameters<typeof toLead>[0]) : null;
}

/** The availability switch in the sidebar ("I'm available today" ↔ "replies on WhatsApp"). */
export async function setAvailable(available: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('settings').update({ available: Boolean(available) }).eq('id', 1);
  if (!error) updateTag(SETTINGS_TAG);
  return { ok: !error };
}
