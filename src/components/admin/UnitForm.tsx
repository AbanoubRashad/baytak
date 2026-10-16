'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveUnit, setListingStatus } from '@/actions/admin/listings';
import { unitSchema, type UnitInput } from '@/lib/admin/schemas';
import { btn } from '@/components/ui/styles';
import { Area, Check, Choice, FINISHING_OPTIONS, Num, Section, Text, UNIT_TYPE_OPTIONS, slugify } from './FormKit';

export function UnitForm({ initial, compounds }: { initial: UnitInput; compounds: { id: string; name: string }[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UnitInput>({ resolver: zodResolver(unitSchema), defaultValues: initial });
  const e = (k: keyof UnitInput) => errors[k]?.message as string | undefined;

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const res = await saveUnit(values);
    if (!res.ok) {
      setMessage({ ok: false, text: res.error });
      Object.entries(res.fields ?? {}).forEach(([k, v]) => setError(k as keyof UnitInput, { message: v }));
      return;
    }
    setMessage({ ok: true, text: 'Saved — the website is updated.' });
    if (!initial.id) router.replace(`/admin/homes/${res.id}`);
    else router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Section title="The home">
        <Choice id="compoundId" label="Compound" reg={register('compoundId')} error={e('compoundId')} options={[['', 'Pick a compound…'], ...compounds.map((c) => [c.id, c.name] as [string, string])]} />
        <Text id="project" label="Project / building (optional)" hint="e.g. Central Residence" reg={register('project')} error={e('project')} />
        <Choice id="unitType" label="Type" reg={register('unitType')} options={UNIT_TYPE_OPTIONS} />
        <Choice id="saleType" label="Sale" reg={register('saleType')} options={[['offplan', 'Off-plan (developer)'], ['ready', 'Ready to move']]} />
        <Num id="beds" label="Bedrooms" reg={register('beds')} error={e('beds')} />
        <Num id="baths" label="Bathrooms" reg={register('baths')} error={e('baths')} />
        <Num id="sizeM2" label="Built-up (m²)" reg={register('sizeM2')} error={e('sizeM2')} />
        <Num id="gardenM2" label="Garden (m²)" reg={register('gardenM2')} />
        <Num id="terraceM2" label="Terrace (m²)" reg={register('terraceM2')} />
        <Num id="landM2" label="Land (m²)" reg={register('landM2')} />
        <Text id="delivery" label="Delivery" hint="ready, near, 2029 or 2030-01" reg={register('delivery')} error={e('delivery')} />
        <Choice id="finishing" label="Finishing" reg={register('finishing')} options={FINISHING_OPTIONS} />
        <Text id="floor" label="Floor (optional)" reg={register('floor')} />
      </Section>

      <Section title="Price & payment plan">
        <Num id="price" label="Price (EGP)" reg={register('price')} error={e('price')} />
        <Num id="priceMax" label="Up to (EGP, by floor)" reg={register('priceMax')} />
        <Num id="downPaymentPct" label="Down payment %" reg={register('downPaymentPct')} />
        <Num id="downPaymentAmount" label="Down payment (EGP)" reg={register('downPaymentAmount')} />
        <Num id="installmentAmount" label="Instalment (EGP)" reg={register('installmentAmount')} />
        <Choice id="installmentFrequency" label="Every" reg={register('installmentFrequency')} options={[['', '—'], ['quarterly', '3 months'], ['monthly', 'Month']]} />
        <Num id="installmentYears" label="Years" reg={register('installmentYears')} />
        <div className="flex items-end">
          <Check id="cashOnly" label="Cash only" reg={register('cashOnly')} />
        </div>
      </Section>

      <Section title="Why I like this one">
        <Area id="consultantNote" label="English" className="sm:col-span-2 lg:col-span-3" reg={register('consultantNote')} />
        <Area id="consultantNoteAr" label="العربية" dir="rtl" className="sm:col-span-2 lg:col-span-3" reg={register('consultantNoteAr')} />
      </Section>

      <Section title="Listing">
        <Text
          id="slug"
          label="Web address"
          hint="/units/…"
          reg={register('slug', {
            onBlur: () => {
              if (!getValues('slug')) setValue('slug', slugify(`${getValues('project') ?? ''} ${getValues('beds')} bed ${getValues('unitType')}`));
            },
          })}
          error={e('slug')}
        />
        <Choice id="status" label="Availability" reg={register('status')} options={[['available', 'Available'], ['reserved', 'Reserved'], ['sold', 'Sold (hidden)']]} />
        <Choice id="listingStatus" label="Visibility" reg={register('listingStatus')} options={[['published', 'Published'], ['draft', 'Draft (hidden)'], ['archived', 'Archived (hidden)']]} />
        <Num id="sort" label="Order (lower shows first)" reg={register('sort')} />
        <div className="flex items-end">
          <Check id="featured" label="Featured on the home page" reg={register('featured')} />
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-admin-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button type="submit" disabled={isSubmitting} className={btn.primary}>
          {isSubmitting ? 'Saving…' : 'Save home'}
        </button>
        {initial.id && (
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm('Archive this home? It disappears from the website but stays in your records.')) return;
              await setListingStatus('unit', initial.id!, 'archived');
              router.push('/admin/homes');
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
