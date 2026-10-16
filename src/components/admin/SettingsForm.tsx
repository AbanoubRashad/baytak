'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { Plus, Trash2, Upload } from 'lucide-react';
import { saveSettings, saveStory } from '@/actions/admin/settings';
import type { SettingsInput } from '@/lib/admin/schemas';
import { photoUrl } from '@/lib/photos';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { btn, field } from '@/components/ui/styles';
import { Area, Num, Section, Text } from './FormKit';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function uploadSquare(file: File, kind: 'portrait' | 'avatar') {
  const bitmap = await createImageBitmap(file);
  const max = kind === 'portrait' ? 1800 : 800;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not process image'))), 'image/jpeg', 0.86));
  const path = `settings/${kind}-${crypto.randomUUID()}.jpg`;
  const { error } = await getBrowserSupabase().storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({ defaultValues: initial });
  const e = (k: keyof SettingsInput) => errors[k]?.message as string | undefined;
  const portrait = useWatch({ control, name: 'portraitPath' });
  const avatar = useWatch({ control, name: 'avatarPath' });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const res = await saveSettings({ ...values, openDays: (values.openDays as unknown[]).map(Number) });
    if (!res.ok) {
      setMessage({ ok: false, text: res.error });
      Object.entries(res.fields ?? {}).forEach(([k, v]) => setError(k as keyof SettingsInput, { message: v }));
      return;
    }
    setMessage({ ok: true, text: 'Saved — the website is updated.' });
    router.refresh();
  });

  const photoField = (kind: 'portrait' | 'avatar', value: string) => (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink">{kind === 'portrait' ? 'Portrait (tall, ~1440×1800)' : 'Avatar (square, ~800×800)'}</p>
      <div className="flex items-center gap-3">
        <div className={`relative overflow-hidden bg-fill ${kind === 'portrait' ? 'h-24 w-20 rounded-xl' : 'size-20 rounded-full'}`}>
          {value && <Image src={photoUrl(value)} alt="" fill sizes="96px" className="object-cover" />}
        </div>
        <label className={`${btn.outline} cursor-pointer`}>
          <Upload aria-hidden className="size-4" />
          Replace
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              try {
                const path = await uploadSquare(f, kind);
                setValue(kind === 'portrait' ? 'portraitPath' : 'avatarPath', path, { shouldDirty: true });
                setMessage({ ok: true, text: 'Photo uploaded — press Save to use it.' });
              } catch (err) {
                setMessage({ ok: false, text: err instanceof Error ? err.message : 'Upload failed' });
              }
            }}
          />
        </label>
      </div>
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Section title="You">
        <Text id="consultantName" label="Name" reg={register('consultantName')} error={e('consultantName')} />
        <Text id="consultantNameAr" label="الاسم" dir="rtl" reg={register('consultantNameAr')} error={e('consultantNameAr')} />
        <div />
        <Text id="title" label="Title" reg={register('title')} error={e('title')} />
        <Text id="titleAr" label="اللقب" dir="rtl" reg={register('titleAr')} error={e('titleAr')} />
        <div />
        {photoField('portrait', portrait)}
        {photoField('avatar', avatar)}
      </Section>

      <Section title="How people reach you">
        <Text id="phone" label="Phone (international, e.g. 201012345678)" dir="ltr" reg={register('phone')} error={e('phone')} />
        <Text id="whatsapp" label="WhatsApp number" dir="ltr" reg={register('whatsapp')} error={e('whatsapp')} />
        <Text id="email" label="Email (optional)" type="email" dir="ltr" reg={register('email')} error={e('email')} />
        <Text id="instagram" label="Instagram URL" dir="ltr" reg={register('instagram')} error={e('instagram')} />
        <Text id="facebook" label="Facebook URL" dir="ltr" reg={register('facebook')} error={e('facebook')} />
        <Text id="linkedin" label="LinkedIn URL" dir="ltr" reg={register('linkedin')} error={e('linkedin')} />
        <Text id="tiktok" label="TikTok URL" dir="ltr" reg={register('tiktok')} error={e('tiktok')} />
      </Section>

      <Section title="Hours & areas">
        <Text id="hours" label="Hours (shown on the site)" reg={register('hours')} error={e('hours')} />
        <Text id="hoursAr" label="المواعيد" dir="rtl" reg={register('hoursAr')} error={e('hoursAr')} />
        <div />
        <fieldset className="sm:col-span-2 lg:col-span-3">
          <legend className="mb-1.5 text-sm font-semibold text-ink">Working days (for “available now”)</legend>
          <div className="flex flex-wrap gap-x-4">
            {DAYS.map((d, i) => (
              <label key={d} className="flex min-h-11 items-center gap-2">
                <input type="checkbox" value={i} className="size-5 accent-[#2B76A6]" {...register('openDays')} />
                {d}
              </label>
            ))}
          </div>
        </fieldset>
        <Num id="openFrom" label="From (hour, 0–23)" reg={register('openFrom')} error={e('openFrom')} />
        <Num id="openTo" label="To (hour, 1–24)" reg={register('openTo')} error={e('openTo')} />
        <div />
        <Area id="areas" label="Areas (one per line)" rows={4} reg={register('areas')} />
        <Area id="areasAr" label="المناطق" dir="rtl" rows={4} reg={register('areasAr')} />
      </Section>

      <Section title="My story & quote">
        <Area id="storyIntro" label="Story (English)" rows={5} className="sm:col-span-2 lg:col-span-3" reg={register('storyIntro')} />
        <Area id="storyIntroAr" label="القصة" dir="rtl" rows={5} className="sm:col-span-2 lg:col-span-3" reg={register('storyIntroAr')} />
        <Area id="quote" label="Quote over the Cairo photo" rows={2} className="sm:col-span-2 lg:col-span-3" reg={register('quote')} />
        <Area id="quoteAr" label="الاقتباس" dir="rtl" rows={2} className="sm:col-span-2 lg:col-span-3" reg={register('quoteAr')} />
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSubmitting} className={btn.primary}>
          {isSubmitting ? 'Saving…' : 'Save settings'}
        </button>
        {message && (
          <p role={message.ok ? 'status' : 'alert'} className={`text-sm font-medium ${message.ok ? 'text-online-ink' : 'text-heart'}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}

interface StoryRow {
  key: string;
  year: string;
  title: string;
  titleAr: string;
  text: string;
  textAr: string;
}

export function StoryEditor({ initial }: { initial: Omit<StoryRow, 'key'>[] }) {
  const [items, setItems] = useState<StoryRow[]>(() => initial.map((it, i) => ({ ...it, key: `s${i}` })));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (key: string, patch: Partial<StoryRow>) => setItems((all) => all.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  return (
    <section className="rounded-[20px] border border-line bg-card p-5 sm:p-6">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
        My story timeline
      </h2>
      <p className="mt-1 text-sm text-ink-2">Use “Today” as the year for the last step.</p>
      <ol className="mt-4 space-y-3">
        {items.map((it, i) => (
          <li key={it.key} className="grid gap-2 rounded-2xl bg-pale p-3 sm:grid-cols-[90px_1fr_1fr_auto]">
            <input aria-label={`Step ${i + 1} year`} value={it.year} onChange={(e) => set(it.key, { year: e.target.value })} className={`${field} min-h-11`} />
            <div className="space-y-2">
              <input aria-label={`Step ${i + 1} title`} placeholder="Title" value={it.title} onChange={(e) => set(it.key, { title: e.target.value })} className={`${field} min-h-11`} />
              <textarea aria-label={`Step ${i + 1} text`} placeholder="One or two sentences" rows={2} value={it.text} onChange={(e) => set(it.key, { text: e.target.value })} className={`${field} py-2`} />
            </div>
            <div className="space-y-2" dir="rtl">
              <input aria-label={`Step ${i + 1} title in Arabic`} placeholder="العنوان" value={it.titleAr} onChange={(e) => set(it.key, { titleAr: e.target.value })} className={`${field} min-h-11`} />
              <textarea aria-label={`Step ${i + 1} text in Arabic`} placeholder="النص" rows={2} value={it.textAr} onChange={(e) => set(it.key, { textAr: e.target.value })} className={`${field} py-2`} />
            </div>
            <button type="button" onClick={() => setItems((all) => all.filter((x) => x.key !== it.key))} className="inline-flex size-11 items-center justify-center rounded-btn text-heart hover:bg-card" aria-label={`Remove step ${i + 1}`}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setItems((all) => [...all, { key: `n${Date.now()}`, year: '', title: '', titleAr: '', text: '', textAr: '' }])}
          className={btn.outline}
        >
          <Plus aria-hidden className="size-4" />
          Add a step
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const res = await saveStory(items.map((it) => ({ year: it.year, title: it.title, titleAr: it.titleAr, text: it.text, textAr: it.textAr })));
            setSaving(false);
            setMessage(res.ok ? { ok: true, text: 'Timeline saved.' } : { ok: false, text: res.error });
          }}
          className={btn.primary}
        >
          {saving ? 'Saving…' : 'Save timeline'}
        </button>
        {message && (
          <p role={message.ok ? 'status' : 'alert'} className={`text-sm font-medium ${message.ok ? 'text-online-ink' : 'text-heart'}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
