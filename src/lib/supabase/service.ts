import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl } from './env';

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
export const hasServiceRole = Boolean(supabaseUrl && serviceKey);

/**
 * Service-role client. Bypasses RLS, so it is only used inside server actions that have already
 * validated input, checked the honeypot and passed the rate limit (lead capture, chat, bookings).
 */
export function createServiceClient() {
  if (!hasServiceRole) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
