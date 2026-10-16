'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { photoUrl } from '@/lib/photos';
import type { Photo } from '@/lib/types';

/** Full-screen gallery: arrows, thumbnails, swipe, keyboard (←/→, Esc) and photo credits. */
export function Lightbox({ photos, start, alt, onClose }: { photos: Photo[]; start: number; alt: (i: number) => string; onClose: () => void }) {
  const t = useTranslations('unit');
  const [i, setI] = useState(start);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const go = (next: number) => setI((next + photos.length) % photos.length);

  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') setI((v) => (v + (rtl ? -1 : 1) + photos.length) % photos.length);
      if (e.key === 'ArrowLeft') setI((v) => (v + (rtl ? 1 : -1) + photos.length) % photos.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [photos.length]);

  const photo = photos[i];
  const ctrl = 'inline-flex size-12 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/25';

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label={t('gallery')}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-[#11171d] p-0 text-white backdrop:bg-black/80"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-white/85" aria-live="polite">
            {t('photo', { n: i + 1, total: photos.length })}
          </p>
          <button type="button" onClick={onClose} className={ctrl} aria-label={t('closeGallery')} autoFocus>
            <X className="size-5" />
          </button>
        </div>
        <div
          className="relative flex-1"
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX;
            touchX.current = null;
            if (start == null || end == null || Math.abs(end - start) < 40) return;
            const rtl = document.documentElement.dir === 'rtl';
            go(i + ((end < start) !== rtl ? 1 : -1));
          }}
        >
          {photo && <Image src={photoUrl(photo.path)} alt={alt(i)} fill sizes="100vw" className="object-contain" />}
          <button type="button" onClick={() => go(i - 1)} className={`${ctrl} absolute start-3 top-1/2 -translate-y-1/2`} aria-label={t('prevPhoto')}>
            <ChevronLeft className="size-6 rtl:rotate-180" />
          </button>
          <button type="button" onClick={() => go(i + 1)} className={`${ctrl} absolute end-3 top-1/2 -translate-y-1/2`} aria-label={t('nextPhoto')}>
            <ChevronRight className="size-6 rtl:rotate-180" />
          </button>
        </div>
        <div className="px-4 pb-4 pt-3">
          <p className="mb-3 text-center text-[13px] text-white/75">
            {photo?.credit ? `${t('credit', { credit: photo.credit })} · ` : ''}
            {t('photosNote')}
          </p>
          <ul className="no-scrollbar flex justify-center gap-2 overflow-x-auto" aria-label={t('thumbs')}>
            {photos.map((p, n) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setI(n)}
                  aria-current={n === i}
                  aria-label={t('photo', { n: n + 1, total: photos.length })}
                  className={`relative block h-14 w-20 overflow-hidden rounded-lg ring-2 transition ${n === i ? 'ring-white' : 'opacity-60 ring-transparent hover:opacity-100'}`}
                >
                  <Image src={photoUrl(p.path)} alt="" fill sizes="80px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
