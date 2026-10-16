'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';
import { SETTINGS_TAG } from '@/lib/data/settings';
import { requireAdmin } from '@/lib/server/admin';
import { fieldErrors } from '@/lib/validation';
import { settingsSchema, type SettingsInput } from '@/lib/admin/schemas';

export async function saveSettings(input: SettingsInput) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error) };
  const s = parsed.data;
  if (s.openTo <= s.openFrom) return { ok: false as const, error: 'Closing time must be after opening time.', fields: { openTo: 'After opening' } };
  const { supabase } = await requireAdmin();
  const social = Object.fromEntries(
    (['instagram', 'facebook', 'linkedin', 'tiktok'] as const).filter((k) => s[k]).map((k) => [k, s[k]]),
  );
  const { error } = await supabase
    .from('settings')
    .update({
      consultant_name: s.consultantName,
      consultant_name_ar: s.consultantNameAr,
      title: s.title,
      title_ar: s.titleAr,
      portrait_path: s.portraitPath,
      avatar_path: s.avatarPath,
      phone: s.phone,
      whatsapp: s.whatsapp,
      email: s.email || null,
      hours: s.hours,
      hours_ar: s.hoursAr,
      open_days: s.openDays,
      open_from: s.openFrom,
      open_to: s.openTo,
      areas: s.areas,
      areas_ar: s.areasAr,
      social,
      story_intro: s.storyIntro,
      story_intro_ar: s.storyIntroAr,
      quote: s.quote,
      quote_ar: s.quoteAr,
    })
    .eq('id', 1);
  if (error) return { ok: false as const, error: error.message };
  updateTag(SETTINGS_TAG);
  return { ok: true as const };
}

const storySchema = z
  .array(
    z.object({
      year: z.string().trim().min(1).max(12),
      title: z.string().trim().min(1).max(120),
      titleAr: z.string().trim().max(120),
      text: z.string().trim().min(1).max(400),
      textAr: z.string().trim().max(400),
    }),
  )
  .max(12);

/** Replaces the whole My story timeline (it's short and edited as one list). */
export async function saveStory(items: z.input<typeof storySchema>) {
  const parsed = storySchema.safeParse(items);
  if (!parsed.success) return { ok: false as const, error: 'Each step needs a year, a title and a sentence.' };
  const { supabase } = await requireAdmin();
  const { error: delError } = await supabase.from('story_items').delete().not('id', 'is', null);
  if (delError) return { ok: false as const, error: delError.message };
  const { error } = await supabase.from('story_items').insert(
    parsed.data.map((it, sort) => ({ year: it.year, title: it.title, title_ar: it.titleAr || null, text: it.text, text_ar: it.textAr || null, sort })),
  );
  if (error) return { ok: false as const, error: error.message };
  updateTag(SETTINGS_TAG);
  return { ok: true as const };
}
