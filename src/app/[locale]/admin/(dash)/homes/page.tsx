export const metadata = { title: 'Homes' };

import Image from 'next/image';
import { Suspense } from 'react';
import { Plus, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { requireAdminPage } from '@/lib/server/admin';
import { formatNumber } from '@/lib/format';
import { photoUrl } from '@/lib/photos';
import { btn } from '@/components/ui/styles';

export default function HomesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-2">Loading homes…</div>}>
      <Homes />
    </Suspense>
  );
}

async function Homes() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from('units')
    .select('id, slug, project, unit_type, beds, price, status, listing_status, featured, save_count, sort, compounds(name), unit_photos(path, sort)')
    .order('sort');
  type Row = {
    id: string;
    slug: string;
    project: string | null;
    unit_type: string;
    beds: number;
    price: number;
    status: string;
    listing_status: string;
    featured: boolean;
    save_count: number;
    compounds: { name: string } | null;
    unit_photos: { path: string; sort: number }[];
  };
  const rows = (data ?? []) as unknown as Row[];
  const pill = (s: string) =>
    s === 'published' || s === 'available' ? 'bg-[#DDF0E3] text-[#1F6B3D]' : s === 'reserved' || s === 'draft' ? 'bg-sand text-on-sand' : 'bg-fill text-ink-2';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Homes</h1>
          <p className="mt-1 text-ink-2">{rows.length} homes · edits appear on the website straight away.</p>
        </div>
        <Link href="/admin/homes/new" className={btn.primary}>
          <Plus aria-hidden className="size-4" />
          Add a home
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-[20px] border border-line bg-card">
        <table className="w-full min-w-[760px] text-start text-[15px]">
          <thead>
            <tr className="border-b border-line text-sm text-ink-2">
              <th className="p-3 text-start font-medium">Home</th>
              <th className="p-3 text-start font-medium">Price</th>
              <th className="p-3 text-start font-medium">Availability</th>
              <th className="p-3 text-start font-medium">Visibility</th>
              <th className="p-3 text-start font-medium">Saves</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cover = [...r.unit_photos].sort((a, b) => a.sort - b.sort)[0];
              return (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-fill">
                        {cover && <Image src={photoUrl(cover.path)} alt="" fill sizes="64px" className="object-cover" />}
                      </div>
                      <div>
                        <p className="flex items-center gap-1.5 font-semibold text-ink">
                          {r.project ? `${r.project} – ` : ''}
                          {r.compounds?.name}
                          {r.featured && <Star aria-label="Featured" className="size-4 fill-sand text-warm" />}
                        </p>
                        <p className="text-sm capitalize text-ink-2">
                          {r.unit_type.replace('-', ' ')} · {r.beds} bed
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-semibold">EGP {formatNumber(Number(r.price), 'en')}</td>
                  <td className="p-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${pill(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${pill(r.listing_status)}`}>{r.listing_status}</span>
                  </td>
                  <td className="p-3 tabular-nums">{r.save_count}</td>
                  <td className="p-3 text-end">
                    <Link href={`/admin/homes/${r.id}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
