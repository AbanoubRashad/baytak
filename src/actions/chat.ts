'use server';

import { after } from 'next/server';
import { z } from 'zod';
import { allowRequest } from '@/lib/server/guard';
import { notify } from '@/lib/server/notify';
import { createServiceClient, hasServiceRole } from '@/lib/supabase/service';
import { chatMessageSchema, chatStartSchema, fieldErrors, type ActionResult, type ChatStartInput } from '@/lib/validation';

export interface ChatMessage {
  id: string;
  sender: 'client' | 'consultant';
  body: string;
  createdAt: string;
}

/** First message: creates the lead (source chat / compare / afford) and returns the thread credentials. */
export async function startChat(input: ChatStartInput): Promise<ActionResult<{ leadId?: string; token?: string }>> {
  const parsed = chatStartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid', fields: fieldErrors(parsed.error) };
  const { name, phone, message, unitId, compoundId, source, website, locale } = parsed.data;
  if (website) return { ok: true, stored: false };
  if (!(await allowRequest('chat-start', 5, 600))) return { ok: false, error: 'rate' };
  if (!hasServiceRole) return { ok: true, stored: false };

  const db = createServiceClient();
  let compound = compoundId ?? null;
  if (unitId && !compound) {
    const { data: unit } = await db.from('units').select('compound_id').eq('id', unitId).maybeSingle();
    compound = unit?.compound_id ?? null;
  }

  const { data: lead, error } = await db
    .from('leads')
    .insert({
      name: name ?? '',
      phone: phone || null,
      source,
      unit_id: unitId ?? null,
      compound_id: compound,
      locale,
    })
    .select('id, access_token')
    .single();
  if (error) {
    console.error('[chat:start]', error.message);
    return { ok: false, error: 'failed' };
  }
  const { error: msgError } = await db.from('messages').insert({ lead_id: lead.id, sender: 'client', body: message });
  if (msgError) console.error('[chat:start:message]', msgError.message);

  after(() =>
    notify({
      subject: `New chat${name ? ` from ${name}` : ''}`,
      lines: [
        ['Name', name],
        ['Mobile', phone],
        ['Source', source],
        ['Message', message],
      ],
      adminPath: `/admin?lead=${lead.id}`,
    }),
  );
  return { ok: true, stored: true, leadId: lead.id, token: lead.access_token };
}

async function verify(leadId: string, token: string) {
  const { data } = await createServiceClient().from('leads').select('id').eq('id', leadId).eq('access_token', token).maybeSingle();
  return Boolean(data);
}

/** Follow-up messages in an existing thread. */
export async function sendChatMessage(input: z.input<typeof chatMessageSchema>): Promise<ActionResult> {
  const parsed = chatMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  if (!(await allowRequest('chat-message', 30, 600))) return { ok: false, error: 'rate' };
  if (!hasServiceRole) return { ok: true, stored: false };
  const { leadId, token, message } = parsed.data;
  if (!(await verify(leadId, token))) return { ok: false, error: 'invalid' };

  const { error } = await createServiceClient().from('messages').insert({ lead_id: leadId, sender: 'client', body: message });
  if (error) return { ok: false, error: 'failed' };
  return { ok: true, stored: true };
}

/** Polled by the open chat panel so Romany's replies appear without a page reload. */
export async function getChatMessages(input: { leadId: string; token: string }): Promise<ChatMessage[]> {
  const parsed = z.object({ leadId: z.uuid(), token: z.uuid() }).safeParse(input);
  if (!parsed.success || !hasServiceRole) return [];
  const { leadId, token } = parsed.data;
  if (!(await verify(leadId, token))) return [];
  const { data } = await createServiceClient()
    .from('messages')
    .select('id, sender, body, created_at')
    .eq('lead_id', leadId)
    .order('created_at')
    .limit(200);
  return (data ?? []).map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.created_at }));
}

/** Visitor added their mobile after the first message (e.g. Romany was away). */
export async function updateChatContact(input: { leadId: string; token: string; name?: string; phone?: string }): Promise<ActionResult> {
  const parsed = z
    .object({ leadId: z.uuid(), token: z.uuid(), name: chatStartSchema.shape.name, phone: chatStartSchema.shape.phone })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid', fields: fieldErrors(parsed.error) };
  if (!hasServiceRole) return { ok: true, stored: false };
  const { leadId, token, name, phone } = parsed.data;
  if (!(await verify(leadId, token))) return { ok: false, error: 'invalid' };
  const patch: Record<string, string> = {};
  if (name) patch.name = name;
  if (phone) patch.phone = phone;
  if (Object.keys(patch).length) await createServiceClient().from('leads').update(patch).eq('id', leadId);
  return { ok: true, stored: true };
}
