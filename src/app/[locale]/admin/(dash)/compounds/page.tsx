export const metadata = { title: 'Compounds' };

import Image from 'next/image';
import { Suspense } from 'react';
import { Plus, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { requireAdminPage } from '@/lib/server/admin';
import { formatCompact } from '@/lib/format';
import { photoUrl } from '@/lib/photos';
import { btn } from '@/components/ui/styles';

const AREA: Record<string, string> = {
  'new-cairo': 'New Cairo',
  'north-coast': 'North Coast',
  'new-capital': 'New Capital',
  october: '6th of October',
  zayed: 'Sheikh Zayed',
};

export default function CompoundsAdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-2">Loading compounds…</div>}>
      <Compounds />
    </Suspense>
  );
}

async function Compounds() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from('compounds')
    .select('id, name, developer, area, price_from, status, featured, compound_photos(path, sort), units(count)')
    .order('sort');
  type Row = {
    id: string;
    name: string;
    developer: string | null;
    area: string;
    price_from: number | null;
    status: string;
    featured: boolean;
    compound_photos: { path: string; sort: number }[];
    units: { count: number }[];
  };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Compounds</h1>
          <p className="mt-1 text-ink-2">{rows.length} compounds · starred ones appear in “Compounds worth a visit”.</p>
        </div>
        <Link href="/admin/compounds/new" className={btn.primary}>
          <Plus aria-hidden className="size-4" />
          Add a compound
        </Link>
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((c) => {
          const cover = [...c.compound_photos].sort((a, b) => a.sort - b.sort)[0];
          return (
            <li key={c.id}>
              <Link href={`/admin/compounds/${c.id}`} className="flex gap-3 rounded-[20px] border border-line bg-card p-3 hover:border-ink-2">
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-fill">
                  {cover && <Image src={photoUrl(cover.path)} alt="" fill sizes="96px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-semibold text-ink">
                    {c.name}
                    {c.featured && <Star aria-label="Featured" className="size-4 shrink-0 fill-sand text-warm" />}
                  </p>
                  <p className="truncate text-sm text-ink-2">{[c.developer, AREA[c.area]].filter(Boolean).join(' · ')}</p>
                  <p className="mt-1 text-sm text-ink-2">
                    {c.price_from ? `From EGP ${formatCompact(Number(c.price_from), 'en')} · ` : ''}
                    {c.units?.[0]?.count ?? 0} homes
                    {c.status !== 'published' && <span className="ms-1.5 rounded-md bg-sand px-1.5 py-0.5 text-xs font-semibold capitalize text-on-sand">{c.status}</span>}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
