export const metadata = { title: 'Settings' };

import { Suspense } from 'react';
import { requireAdminPage } from '@/lib/server/admin';
import { SettingsForm, StoryEditor } from '@/components/admin/SettingsForm';
import type { SettingsInput } from '@/lib/admin/schemas';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-2">Loading settings…</div>}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const { supabase } = await requireAdminPage();
  const [{ data: s }, { data: story }] = await Promise.all([
    supabase.from('settings').select('*').eq('id', 1).single(),
    supabase.from('story_items').select('year, title, title_ar, text, text_ar').order('sort'),
  ]);
  if (!s) return <p className="p-8">Settings row missing — run supabase/seed.sql.</p>;
  const social = (s.social ?? {}) as Record<string, string>;

  const initial: SettingsInput = {
    consultantName: s.consultant_name,
    consultantNameAr: s.consultant_name_ar,
    title: s.title,
    titleAr: s.title_ar,
    portraitPath: s.portrait_path,
    avatarPath: s.avatar_path,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email ?? '',
    hours: s.hours,
    hoursAr: s.hours_ar,
    openDays: (s.open_days as number[]).map(String) as unknown as number[],
    openFrom: s.open_from,
    openTo: s.open_to,
    areas: (s.areas as string[]).join('\n'),
    areasAr: (s.areas_ar as string[]).join('\n'),
    instagram: social.instagram ?? '',
    facebook: social.facebook ?? '',
    linkedin: social.linkedin ?? '',
    tiktok: social.tiktok ?? '',
    storyIntro: s.story_intro,
    storyIntroAr: s.story_intro_ar,
    quote: s.quote,
    quoteAr: s.quote_ar,
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Settings</h1>
        <p className="mt-1 text-ink-2">Everything about you that the website shows. Changes go live when you save.</p>
      </div>
      <SettingsForm initial={initial} />
      <StoryEditor
        initial={(story ?? []).map((it) => ({ year: it.year, title: it.title, titleAr: it.title_ar ?? '', text: it.text, textAr: it.text_ar ?? '' }))}
      />
    </div>
  );
}
