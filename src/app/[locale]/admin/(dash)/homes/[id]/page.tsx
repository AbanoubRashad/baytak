export const metadata = { title: 'Edit home' };

import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toUnit, UNIT_SELECT, type UnitRow } from '@/lib/data/mappers';
import type { UnitInput } from '@/lib/admin/schemas';
import { requireAdminPage } from '@/lib/server/admin';
import { UnitForm } from '@/components/admin/UnitForm';
import { PhotoManager } from '@/components/admin/PhotoManager';
import { btn } from '@/components/ui/styles';

export default function EditHomePage({ params }: PageProps<'/[locale]/admin/homes/[id]'>) {
  return (
    <Suspense fallback={<div className="p-8 text-ink-2">Loading…</div>}>
      <EditHome params={params} />
    </Suspense>
  );
}

async function EditHome({ params }: Pick<PageProps<'/[locale]/admin/homes/[id]'>, 'params'>) {
  const [{ supabase }, { id }] = await Promise.all([requireAdminPage(), params]);
  const isNew = id === 'new';
  const [{ data: compounds }, unitRes] = await Promise.all([
    supabase.from('compounds').select('id, name').neq('status', 'archived').order('name'),
    isNew ? Promise.resolve({ data: null }) : supabase.from('units').select(UNIT_SELECT).eq('id', id).maybeSingle(),
  ]);
  if (!isNew && !unitRes.data) notFound();
  const unit = unitRes.data ? toUnit(unitRes.data as UnitRow) : null;

  const initial: UnitInput = unit
    ? {
        id: unit.id,
        slug: unit.slug,
        compoundId: unit.compoundId,
        project: unit.project ?? '',
        saleType: unit.saleType,
        unitType: unit.unitType,
        beds: unit.beds,
        baths: unit.baths,
        sizeM2: unit.sizeM2,
        gardenM2: unit.gardenM2 ?? '',
        terraceM2: unit.terraceM2 ?? '',
        landM2: unit.landM2 ?? '',
        price: unit.price,
        priceMax: unit.priceMax ?? '',
        downPaymentAmount: unit.downPaymentAmount ?? '',
        downPaymentPct: unit.downPaymentPct ?? '',
        installmentAmount: unit.installmentAmount ?? '',
        installmentFrequency: unit.installmentFrequency ?? '',
        installmentYears: unit.installmentYears ?? '',
        delivery: unit.delivery,
        finishing: unit.finishing ?? '',
        floor: unit.floor ?? '',
        cashOnly: unit.cashOnly,
        consultantNote: unit.consultantNote ?? '',
        consultantNoteAr: unit.consultantNoteAr ?? '',
        featured: unit.featured,
        status: unit.status,
        listingStatus: unit.listingStatus,
        sort: unit.sort,
      }
    : {
        slug: '',
        compoundId: '',
        project: '',
        saleType: 'offplan',
        unitType: 'apartment',
        beds: 2,
        baths: 2,
        sizeM2: '',
        gardenM2: '',
        terraceM2: '',
        landM2: '',
        price: '',
        priceMax: '',
        downPaymentAmount: '',
        downPaymentPct: '',
        installmentAmount: '',
        installmentFrequency: '',
        installmentYears: '',
        delivery: 'ready',
        finishing: '',
        floor: '',
        cashOnly: false,
        consultantNote: '',
        consultantNoteAr: '',
        featured: false,
        status: 'available',
        listingStatus: 'draft',
        sort: 100,
      };

  return (
    <div className="p-4 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/homes" className={btn.icon} aria-label="Back to homes">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-3xl font-extrabold">{isNew ? 'Add a home' : 'Edit home'}</h1>
        </div>
        {unit && (
          <Link href={`/units/${unit.slug}`} className={btn.outline} target="_blank">
            <ExternalLink aria-hidden className="size-4" />
            View on website
          </Link>
        )}
      </div>
      {unit && (
        <section className="mt-6 rounded-[20px] border border-line bg-card p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-bold" style={{ fontFamily: 'var(--font-body-stack)', letterSpacing: 0 }}>
            Photos
          </h2>
          <PhotoManager kind="unit" parentId={unit.id} initial={unit.photos} />
        </section>
      )}
      <div className="mt-4">
        <UnitForm initial={initial} compounds={compounds ?? []} />
      </div>
      {isNew && <p className="mt-3 text-sm text-ink-2">Save the home first, then add photos.</p>}
    </div>
  );
}
