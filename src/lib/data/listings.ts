import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { seedCompounds, seedUnits } from '@/data/seed';
import { createPublicClient } from '@/lib/supabase/public';
import { hasSupabase } from '@/lib/supabase/env';
import type { Compound, Unit, UnitWithCompound } from '@/lib/types';
import { COMPOUND_SELECT, UNIT_SELECT, toCompound, toUnit, type CompoundRow, type UnitRow } from './mappers';

/** Revalidated with updateTag(LISTINGS_TAG) whenever Romany edits a home or compound. */
export const LISTINGS_TAG = 'listings';

/** All published compounds, in Romany's chosen order. */
export async function getCompounds(): Promise<Compound[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(LISTINGS_TAG);
  if (!hasSupabase) return seedCompounds.filter((c) => c.status === 'published');

  const { data, error } = await createPublicClient()
    .from('compounds')
    .select(COMPOUND_SELECT)
    .eq('status', 'published')
    .order('sort');
  if (error) throw new Error(`Loading compounds failed: ${error.message}`);
  return (data as CompoundRow[]).map(toCompound);
}

async function getRawUnits(): Promise<Unit[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(LISTINGS_TAG);
  if (!hasSupabase) return seedUnits.filter((u) => u.listingStatus === 'published');

  const { data, error } = await createPublicClient()
    .from('units')
    .select(UNIT_SELECT)
    .eq('listing_status', 'published')
    .order('sort');
  if (error) throw new Error(`Loading units failed: ${error.message}`);
  return (data as UnitRow[]).map(toUnit);
}

/** All published units joined with their compound (dataset is small — a few dozen homes). */
export async function getUnits(): Promise<UnitWithCompound[]> {
  const [units, compounds] = await Promise.all([getRawUnits(), getCompounds()]);
  const byId = new Map(compounds.map((c) => [c.id, c]));
  return units.flatMap((u) => {
    const c = byId.get(u.compoundId);
    if (!c) return [];
    const compound = {
      id: c.id,
      slug: c.slug,
      name: c.name,
      nameAr: c.nameAr,
      developer: c.developer,
      location: c.location,
      locationAr: c.locationAr,
      area: c.area,
      amenities: c.amenities,
      amenitiesAr: c.amenitiesAr,
      lat: c.lat,
      lng: c.lng,
      photos: c.photos,
    };
    return [{ ...u, compound }];
  });
}

export async function getUnitBySlug(slug: string): Promise<UnitWithCompound | undefined> {
  return (await getUnits()).find((u) => u.slug === slug);
}

export async function getCompoundBySlug(slug: string): Promise<Compound | undefined> {
  return (await getCompounds()).find((c) => c.slug === slug);
}
