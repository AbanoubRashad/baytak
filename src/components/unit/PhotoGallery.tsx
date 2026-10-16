'use client';

import Image from 'next/image';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LayoutGrid } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { photoUrl } from '@/lib/photos';
import type { Photo } from '@/lib/types';

/** The full-screen viewer loads on first open. */
const Lightbox = dynamic(() => import('./Lightbox').then((m) => m.Lightbox), { ssr: false });

/** 1 large + 4 small photo mosaic; any photo opens the full-screen lightbox. */
export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const t = useTranslations('unit');
  const [index, setIndex] = useState<number | null>(null);
  const shown = photos.slice(0, 5);
  if (!photos.length) return null;

  const alt = (i: number) => photos[i]?.label || `${title} — ${t('photo', { n: i + 1, total: photos.length })}`;

  return (
    <>
      <div className="relative">
      <div className="grid h-[300px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-card sm:h-[420px] lg:h-[490px]">
        {shown.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`group relative overflow-hidden bg-fill ${i === 0 ? 'col-span-4 row-span-2 sm:col-span-2' : 'hidden sm:block'}`}
            aria-label={`${t('gallery')}: ${alt(i)}`}
          >
            <Image
              src={photoUrl(p.path)}
              alt=""
              fill
              priority={i === 0}
              sizes={i === 0 ? '(min-width: 640px) 50vw, 100vw' : '25vw'}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setIndex(0)}
        className="absolute bottom-3 end-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-card px-3.5 text-sm font-semibold text-ink shadow-soft"
      >
        <LayoutGrid aria-hidden className="size-4" />
        {t('allPhotos')} ({photos.length})
      </button>
      </div>
      {index != null && <Lightbox photos={photos} start={index} alt={alt} onClose={() => setIndex(null)} />}
    </>
  );
}

