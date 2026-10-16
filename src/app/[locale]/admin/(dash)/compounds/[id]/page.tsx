export const metadata = { title: 'Edit compound' };

import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { COMPOUND_SELECT, toCompound, type CompoundRow } from '@/lib/data/mappers';
import type { CompoundInput } from '@/lib/admin/schemas';
import { requireAdminPage } from '@/lib/server/admin';
import { CompoundForm } from '@/components/admin/CompoundForm';
import { PhotoManager } from '@/components/admin/PhotoManager';
import { btn } from '@/components/ui/styles';

export default function EditCompoundPage({ params }: PageProps<'/[locale]/admin/compounds/[id]'>) {
  return (
    <Suspense fallback={<div className="p-8 text-ink-2">Loading…</div>}>
      <EditCompound params={params} />
    </Suspense>
  );
}

async function EditCompound({ params }: Pick<PageProps<'/[locale]/admin/compounds/[id]'>, 'params'>) {
  const [{ supabase }, { id }] = await Promise.all([requireAdminPage(), params]);
  const isNew = id === 'new';
  const res = isNew ? { data: null } : await supabase.from('compounds').select(COMPOUND_SELECT).eq('id', id).maybeSingle();
  if (!isNew && !res.data) notFound();
  const c = res.data ? toCompound(res.data as CompoundRow) : null;

  const initial: CompoundInput = c
    ? {
        id: c.id,
        slug: c.slug,
        name: c.name,
        nameAr: c.nameAr ?? '',
        developer: c.developer ?? '',
        location: c.location,
        locationAr: c.locationAr ?? '',
        area: c.area,
        unitTypes: c.unitTypes,
        priceFrom: c.priceFrom ?? '',
        resalePriceFrom: c.resalePriceFrom ?? '',
        downPaymentMinPct: c.downPaymentMinPct ?? '',
        maxYears: c.maxYears ?? '',
        finishing: c.finishing ?? '',
        masterPlanAcres: c.masterPlanAcres ?? '',
        descriptionEn: c.descriptionEn,
        descriptionAr: c.descriptionAr,
        consultantNote: c.consultantNote ?? '',
        consultantNoteAr: c.consultantNoteAr ?? '',
        amenities: c.amenities,
        amenitiesAr: c.amenitiesAr,
        lat: c.lat ?? '',
        lng: c.lng ?? '',
        featured: c.featured,
        sort: c.sort,
        status: c.status,
      }
    : {
        slug: '',
        name: '',
        nameAr: '',
        developer: '',
        location: '',
        locationAr: '',
        area: 'new-cairo',
        unitTypes: [],
        priceFrom: '',
        resalePriceFrom: '',
        downPaymentMinPct: '',
        maxYears: '',
        finishing: '',
        masterPlanAcres: '',
        descriptionEn: '',
        descriptionAr: '',
        consultantNote: '',
        consultantNoteAr: '',
        amenities: [],
        amenitiesAr: [],
        lat: '',
        lng: '',
        featured: false,
        sort: 100,
        status: 'draft',
      };

  return (
    <div className="p-4 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/compounds" className={btn.icon} aria-label="Back to compounds">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-3xl font-extrabold">{isNew ? 'Add a compound' : c!.name}</h1>
        </div>
        {c && (
          <Link href={`/compounds/${c.slug}`} className={btn.outline} target="_blank">
            <ExternalLink aria-hidden className="size-4" />
            View on website
          </Link>
        )}
      </div>
      {c && (
        <section className="mt-6 rounded-[20px] border border-line bg-card p-5 sm:p-6">
          <h2 className="mb-1 text-xl font-bold" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
            Photos
          </h2>
          <p className="mb-4 text-sm text-ink-2">Label a photo “Master plan” to show it in the compound’s master plan section.</p>
          <PhotoManager kind="compound" parentId={c.id} initial={c.photos} />
        </section>
      )}
      <div className="mt-4">
        <CompoundForm initial={initial} />
      </div>
    </div>
  );
}
