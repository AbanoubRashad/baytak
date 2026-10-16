'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { saveCompound, setListingStatus } from '@/actions/admin/listings';
import { compoundSchema, type CompoundInput } from '@/lib/admin/schemas';
import { btn } from '@/components/ui/styles';
import { AREA_OPTIONS, Area, Check, Choice, FINISHING_OPTIONS, Num, Section, Text, UNIT_TYPE_OPTIONS, slugify } from './FormKit';

/** Amenities are edited one per line; the form keeps them as text. */
type FormValues = Omit<CompoundInput, 'amenities' | 'amenitiesAr'> & { amenities: string; amenitiesAr: string };

export function CompoundForm({ initial }: { initial: CompoundInput }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      ...initial,
      amenities: ((initial.amenities as string[] | undefined) ?? []).join('\n'),
      amenitiesAr: ((initial.amenitiesAr as string[] | undefined) ?? []).join('\n'),
    },
  });
  const e = (k: keyof FormValues) => errors[k]?.message as string | undefined;

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const check = compoundSchema.safeParse(values);
    if (!check.success) {
      check.error.issues.forEach((i) => setError(String(i.path[0]) as keyof FormValues, { message: i.message }));
      setMessage({ ok: false, text: 'Please check the highlighted fields.' });
      return;
    }
    const res = await saveCompound(values as unknown as CompoundInput);
    if (!res.ok) {
      setMessage({ ok: false, text: res.error });
      Object.entries(res.fields ?? {}).forEach(([k, v]) => setError(k as keyof FormValues, { message: v }));
      return;
    }
    setMessage({ ok: true, text: 'Saved — the website is updated.' });
    if (!initial.id) router.replace(`/admin/compounds/${res.id}`);
    else router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Section title="The compound">
        <Text
          id="name"
          label="Name"
          reg={register('name', { onBlur: () => !getValues('slug') && setValue('slug', slugify(getValues('name'))) })}
          error={e('name')}
        />
        <Text id="nameAr" label="الاسم بالعربية (optional)" dir="rtl" reg={register('nameAr')} />
        <Text id="developer" label="Developer" hint="Leave blank if not confirmed" reg={register('developer')} />
        <Text id="location" label="Location" reg={register('location')} error={e('location')} />
        <Text id="locationAr" label="الموقع بالعربية" dir="rtl" reg={register('locationAr')} />
        <Choice id="area" label="Area" reg={register('area')} options={AREA_OPTIONS} />
        <Num id="lat" label="Latitude (map)" reg={register('lat')} />
        <Num id="lng" label="Longitude (map)" reg={register('lng')} />
        <Num id="masterPlanAcres" label="Master plan (acres)" reg={register('masterPlanAcres')} />
        <fieldset className="sm:col-span-2 lg:col-span-3">
          <legend className="mb-1.5 text-sm font-semibold text-ink">Home types</legend>
          <div className="flex flex-wrap gap-x-5">
            {UNIT_TYPE_OPTIONS.map(([value, text]) => (
              <label key={value} className="flex min-h-11 items-center gap-2">
                <input type="checkbox" value={value} className="size-5 accent-[#2B76A6]" {...register('unitTypes')} />
                {text}
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title="Prices & plans">
        <Num id="priceFrom" label="Starting price (EGP)" reg={register('priceFrom')} />
        <Num id="resalePriceFrom" label="Resale from (EGP)" reg={register('resalePriceFrom')} />
        <Num id="downPaymentMinPct" label="Minimum down payment %" reg={register('downPaymentMinPct')} />
        <Num id="maxYears" label="Up to (years)" reg={register('maxYears')} />
        <Choice id="finishing" label="Finishing" reg={register('finishing')} options={FINISHING_OPTIONS} />
      </Section>

      <Section title="Description & my note">
        <Area id="descriptionEn" label="Description (English)" className="sm:col-span-2 lg:col-span-3" reg={register('descriptionEn')} />
        <Area id="descriptionAr" label="الوصف بالعربية" dir="rtl" className="sm:col-span-2 lg:col-span-3" reg={register('descriptionAr')} />
        <Area id="consultantNote" label="My note (English, optional)" rows={2} className="sm:col-span-2 lg:col-span-3" reg={register('consultantNote')} />
        <Area id="consultantNoteAr" label="ملاحظتي بالعربية" dir="rtl" rows={2} className="sm:col-span-2 lg:col-span-3" reg={register('consultantNoteAr')} />
      </Section>

      <Section title="Amenities (one per line)">
        <Area id="amenities" label="English" rows={6} className="sm:col-span-1 lg:col-span-1" reg={register('amenities')} />
        <Area id="amenitiesAr" label="العربية (same order)" dir="rtl" rows={6} reg={register('amenitiesAr')} />
      </Section>

      <Section title="Listing">
        <Text id="slug" label="Web address" hint="/compounds/…" reg={register('slug')} error={e('slug')} />
        <Choice id="status" label="Visibility" reg={register('status')} options={[['published', 'Published'], ['draft', 'Draft (hidden)'], ['archived', 'Archived (hidden)']]} />
        <Num id="sort" label="Order (lower shows first)" reg={register('sort')} />
        <div className="flex items-end">
          <Check id="featured" label="Show in “Compounds worth a visit”" reg={register('featured')} />
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-admin-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button type="submit" disabled={isSubmitting} className={btn.primary}>
          {isSubmitting ? 'Saving…' : 'Save compound'}
        </button>
        {initial.id && (
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm('Archive this compound? It and its homes disappear from the website.')) return;
              await setListingStatus('compound', initial.id!, 'archived');
              router.push('/admin/compounds');
            }}
            className={btn.outline}
          >
            Archive
          </button>
        )}
        {message && (
          <p role={message.ok ? 'status' : 'alert'} className={`text-sm font-medium ${message.ok ? 'text-online-ink' : 'text-heart'}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
