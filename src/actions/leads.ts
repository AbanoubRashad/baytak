'use server';

import { after } from 'next/server';
import { allowRequest } from '@/lib/server/guard';
import { notify } from '@/lib/server/notify';
import { createServiceClient, hasServiceRole } from '@/lib/supabase/service';
import {
  affordSchema,
  callbackSchema,
  contactSchema,
  fieldErrors,
  type ActionResult,
  type CallbackInput,
  type ContactInput,
} from '@/lib/validation';

const BEST_TIME_EN = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' } as const;

/** "Request a call back" form. */
export async function requestCallback(input: CallbackInput): Promise<ActionResult> {
  const parsed = callbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid', fields: fieldErrors(parsed.error) };
  const { name, phone, bestTime, website, locale } = parsed.data;
  if (website) return { ok: true, stored: false }; // honeypot: pretend success
  if (!(await allowRequest('callback', 5, 600))) return { ok: false, error: 'rate' };
  if (!hasServiceRole) return { ok: true, stored: false };

  const { data, error } = await createServiceClient()
    .from('leads')
    .insert({ name, phone, source: 'callback', preferred_time: bestTime, locale, next_step: 'Call back' })
    .select('id')
    .single();
  if (error) {
    console.error('[callback]', error.message);
    return { ok: false, error: 'failed' };
  }

  after(() =>
    notify({
      subject: `Call-back request from ${name}`,
      lines: [
        ['Name', name],
        ['Mobile', phone],
        ['Best time', BEST_TIME_EN[bestTime]],
      ],
      adminPath: `/admin?lead=${data.id}`,
    }),
  );
  return { ok: true, stored: true };
}

/** About / Contact form. */
export async function sendContact(input: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid', fields: fieldErrors(parsed.error) };
  const { name, phone, email, message, website, locale } = parsed.data;
  if (website) return { ok: true, stored: false };
  if (!(await allowRequest('contact', 5, 600))) return { ok: false, error: 'rate' };
  if (!hasServiceRole) return { ok: true, stored: false };

  const db = createServiceClient();
  const { data, error } = await db
    .from('leads')
    .insert({ name, phone, email: email || null, source: 'contact', locale })
    .select('id')
    .single();
  if (error) {
    console.error('[contact]', error.message);
    return { ok: false, error: 'failed' };
  }
  await db.from('messages').insert({ lead_id: data.id, sender: 'client', body: message });

  after(() =>
    notify({
      subject: `New message from ${name}`,
      lines: [
        ['Name', name],
        ['Mobile', phone],
        ['Email', email],
        ['Message', message],
      ],
      adminPath: `/admin?lead=${data.id}`,
    }),
  );
  return { ok: true, stored: true };
}

/**
 * "What can I afford?" — each use records (or updates) an anonymous lead with source "afford",
 * so Romany sees what budgets visitors are exploring. Repeat uses in one visit update the same lead.
 */
export async function recordAffordUse(input: {
  leadId: string | null;
  down: number;
  monthly: number;
  years: number;
  budget: number;
  locale: string;
}): Promise<ActionResult<{ leadId?: string }>> {
  const parsed = affordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  if (!(await allowRequest('afford', 20, 600))) return { ok: false, error: 'rate' };
  if (!hasServiceRole) return { ok: true, stored: false };

  const { leadId, down, monthly, years, budget, locale } = parsed.data;
  const budgetText = `EGP ${Math.round(down / 1000)}K down · ${Math.round(monthly / 1000)}K / month · ${years} yrs (≈ EGP ${(budget / 1_000_000).toFixed(1)}M)`;
  const db = createServiceClient();

  if (leadId) {
    const { error } = await db.from('leads').update({ budget: budgetText }).eq('id', leadId).eq('source', 'afford').eq('name', '');
    if (!error) return { ok: true, stored: true, leadId };
  }
  const { data, error } = await db.from('leads').insert({ source: 'afford', budget: budgetText, locale }).select('id').single();
  if (error) {
    console.error('[afford]', error.message);
    return { ok: false, error: 'failed' };
  }
  return { ok: true, stored: true, leadId: data.id };
}
