'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';
import { LISTINGS_TAG } from '@/lib/data/listings';
import { compoundSchema, photoPatchSchema, unitSchema, type CompoundInput, type UnitInput } from '@/lib/admin/schemas';
import { requireAdmin } from '@/lib/server/admin';
import { fieldErrors } from '@/lib/validation';

type SaveResult = { ok: true; id: string } | { ok: false; error: string; fields?: Record<string, string> };

export async function saveUnit(input: UnitInput): Promise<SaveResult> {
  const parsed = unitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error) };
  const u = parsed.data;
  const { supabase } = await requireAdmin();
  const row = {
    slug: u.slug,
    compound_id: u.compoundId,
    project: u.project,
    sale_type: u.saleType,
    unit_type: u.unitType,
    beds: u.beds,
    baths: u.baths,
    size_m2: u.sizeM2,
    garden_m2: u.gardenM2,
    terrace_m2: u.terraceM2,
    land_m2: u.landM2,
    price: u.price,
    price_max: u.priceMax,
    down_payment_amount: u.downPaymentAmount,
    down_payment_pct: u.downPaymentPct,
    installment_amount: u.installmentAmount,
    installment_frequency: u.installmentFrequency,
    installment_years: u.installmentYears,
    delivery: u.delivery,
    finishing: u.finishing,
    floor: u.floor,
    cash_only: u.cashOnly,
    consultant_note: u.consultantNote,
    consultant_note_ar: u.consultantNoteAr,
    featured: u.featured,
    status: u.status,
    listing_status: u.listingStatus,
    sort: u.sort,
  };
  const query = u.id ? supabase.from('units').update(row).eq('id', u.id).select('id').single() : supabase.from('units').insert(row).select('id').single();
  const { data, error } = await query;
  if (error) {
    const dup = error.code === '23505';
    return { ok: false, error: dup ? 'That web address (slug) is already used.' : error.message, fields: dup ? { slug: 'Already used' } : undefined };
  }
  updateTag(LISTINGS_TAG);
  return { ok: true, id: data.id };
}

export async function saveCompound(input: CompoundInput): Promise<SaveResult> {
  const parsed = compoundSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error) };
  const c = parsed.data;
  const { supabase } = await requireAdmin();
  const row = {
    slug: c.slug,
    name: c.name,
    name_ar: c.nameAr,
    developer: c.developer,
    location: c.location,
    location_ar: c.locationAr,
    area: c.area,
    unit_types: c.unitTypes,
    price_from: c.priceFrom,
    resale_price_from: c.resalePriceFrom,
    down_payment_min_pct: c.downPaymentMinPct,
    max_years: c.maxYears,
    finishing: c.finishing,
    master_plan_acres: c.masterPlanAcres,
    description_en: c.descriptionEn,
    description_ar: c.descriptionAr,
    consultant_note: c.consultantNote,
    consultant_note_ar: c.consultantNoteAr,
    amenities: c.amenities,
    amenities_ar: c.amenitiesAr,
    lat: c.lat,
    lng: c.lng,
    featured: c.featured,
    sort: c.sort,
    status: c.status,
    source_checked_at: new Date().toISOString().slice(0, 10),
  };
  const query = c.id ? supabase.from('compounds').update(row).eq('id', c.id).select('id').single() : supabase.from('compounds').insert(row).select('id').single();
  const { data, error } = await query;
  if (error) {
    const dup = error.code === '23505';
    return { ok: false, error: dup ? 'That web address (slug) is already used.' : error.message, fields: dup ? { slug: 'Already used' } : undefined };
  }
  updateTag(LISTINGS_TAG);
  return { ok: true, id: data.id };
}

/** Archive hides a listing from the website without deleting its history (leads keep their link). */
export async function setListingStatus(kind: 'unit' | 'compound', id: string, status: 'draft' | 'published' | 'archived') {
  const parsedId = z.uuid().parse(id);
  const { supabase } = await requireAdmin();
  const { error } =
    kind === 'unit'
      ? await supabase.from('units').update({ listing_status: status }).eq('id', parsedId)
      : await supabase.from('compounds').update({ status }).eq('id', parsedId);
  if (!error) updateTag(LISTINGS_TAG);
  return { ok: !error };
}

/* ---------- Photos (files are uploaded straight to Storage by the browser; rows are managed here) ---------- */

const table = (kind: 'unit' | 'compound') => (kind === 'unit' ? 'unit_photos' : 'compound_photos');

export async function addPhoto(kind: 'unit' | 'compound', parentId: string, path: string, credit: string | null) {
  const pid = z.uuid().parse(parentId);
  const p = z.string().min(3).max(300).parse(path);
  const { supabase } = await requireAdmin();
  const { count } = await supabase.from(table(kind)).select('id', { count: 'exact', head: true }).eq('parent_id', pid);
  const { data, error } = await supabase
    .from(table(kind))
    .insert({ parent_id: pid, path: p, credit: credit || 'Romany', sort: count ?? 0 })
    .select('id, path, label, credit, sort')
    .single();
  if (error) return { ok: false as const, error: error.message };
  updateTag(LISTINGS_TAG);
  return { ok: true as const, photo: data };
}

export async function reorderPhotos(kind: 'unit' | 'compound', ids: string[]) {
  const list = z.array(z.uuid()).max(60).parse(ids);
  const { supabase } = await requireAdmin();
  await Promise.all(list.map((id, sort) => supabase.from(table(kind)).update({ sort }).eq('id', id)));
  updateTag(LISTINGS_TAG);
  return { ok: true };
}

export async function updatePhoto(kind: 'unit' | 'compound', patch: z.input<typeof photoPatchSchema>) {
  const p = photoPatchSchema.parse(patch);
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from(table(kind)).update({ label: p.label, credit: p.credit }).eq('id', p.id);
  if (!error) updateTag(LISTINGS_TAG);
  return { ok: !error };
}

export async function deletePhoto(kind: 'unit' | 'compound', id: string) {
  const pid = z.uuid().parse(id);
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from(table(kind)).delete().eq('id', pid).select('path').single();
  // Uploaded files live in Storage; the illustrative seed photos ("/photos/…") are part of the site.
  if (data?.path && !data.path.startsWith('/')) await supabase.storage.from('photos').remove([data.path]);
  updateTag(LISTINGS_TAG);
  return { ok: true };
}
