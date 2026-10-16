import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { createServiceClient, hasServiceRole } from '@/lib/supabase/service';

/** A stable, non-reversible key for the visitor's IP (we never store raw IPs). */
async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const salt = process.env.RATE_LIMIT_SALT ?? 'baytak';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/**
 * Rate limit for public server actions, backed by Postgres (works across serverless instances).
 * Returns true when the request may proceed. Without Supabase it always allows (local preview).
 */
export async function allowRequest(action: string, max: number, windowSeconds: number): Promise<boolean> {
  if (!hasServiceRole) return true;
  const key = `${action}:${await clientKey()}`;
  const { data, error } = await createServiceClient().rpc('hit_rate_limit', {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error('[rate-limit]', error.message);
    return true; // fail open: never lose a genuine lead because the limiter hiccuped
  }
  return data === true;
}
