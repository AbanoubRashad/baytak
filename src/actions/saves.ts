'use server';

import { z } from 'zod';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabase } from '@/lib/supabase/env';

const schema = z.object({ unitId: z.uuid(), delta: z.union([z.literal(1), z.literal(-1)]) });

/** Counts hearts for the admin's "most-saved home" stat. Fire-and-forget; never blocks the UI. */
export async function trackSave(unitId: string, delta: 1 | -1): Promise<void> {
  const parsed = schema.safeParse({ unitId, delta });
  if (!parsed.success || !hasSupabase) return;
  await createPublicClient().rpc('increment_save', { p_unit: parsed.data.unitId, p_delta: parsed.data.delta });
}
