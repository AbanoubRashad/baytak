'use client';

import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Trash2, Upload } from 'lucide-react';
import { addPhoto, deletePhoto, reorderPhotos, updatePhoto } from '@/actions/admin/listings';
import { photoUrl } from '@/lib/photos';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import type { Photo } from '@/lib/types';
import { btn, field } from '@/components/ui/styles';

const MAX_SIDE = 1800;

/** Downscales a photo in the browser (keeps uploads small and fast on Egyptian mobile data). */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', 0.84));
}

export function PhotoManager({ kind, parentId, initial }: { kind: 'unit' | 'compound'; parentId: string; initial: Photo[] }) {
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const dragId = useRef<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  function commitOrder(next: Photo[]) {
    setPhotos(next);
    start(async () => {
      await reorderPhotos(kind, next.map((p) => p.id));
    });
  }

  function move(id: string, by: number) {
    const i = photos.findIndex((p) => p.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    commitOrder(next);
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const supabase = getBrowserSupabase();
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      setBusy(`Uploading ${file.name}…`);
      try {
        const blob = await resize(file);
        const path = `${kind}s/${parentId}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
        if (upErr) throw upErr;
        const res = await addPhoto(kind, parentId, path, 'Romany');
        if (!res.ok) throw new Error(res.error);
        setPhotos((all) => [...all, res.photo]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      }
    }
    setBusy(null);
    if (input.current) input.current.value = '';
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => input.current?.click()} className={btn.primary} disabled={Boolean(busy)}>
          <Upload aria-hidden className="size-4" />
          Upload photos
        </button>
        <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void upload(e.target.files)} aria-label="Upload photos" />
        <p className="text-sm text-ink-2" role="status">
          {busy ?? 'Drag to reorder — the first photo is the cover. Photos are resized automatically.'}
        </p>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-heart">{error}</p>}

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map((p, i) => (
          <li
            key={p.id}
            draggable
            onDragStart={() => (dragId.current = p.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              const from = photos.findIndex((x) => x.id === dragId.current);
              if (from < 0 || from === i) return;
              const next = [...photos];
              const [m] = next.splice(from, 1);
              next.splice(i, 0, m);
              commitOrder(next);
            }}
            className="rounded-2xl border border-line bg-card p-2"
          >
            <div className="relative h-36 overflow-hidden rounded-xl bg-fill">
              <Image src={photoUrl(p.path)} alt={p.label ?? ''} fill sizes="300px" className="object-cover" />
              {i === 0 && <span className="absolute start-2 top-2 rounded-full bg-card px-2 py-0.5 text-xs font-semibold">Cover</span>}
              <span aria-hidden className="absolute end-2 top-2 cursor-grab rounded-lg bg-card/90 p-1">
                <GripVertical className="size-4" />
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                aria-label="Label (e.g. Master plan, Living room)"
                placeholder="Label"
                defaultValue={p.label ?? ''}
                onBlur={(e) => start(async () => void (await updatePhoto(kind, { id: p.id, label: e.target.value, credit: p.credit ?? '' })))}
                className={`${field} min-h-10 text-sm`}
              />
              <input
                aria-label="Credit (e.g. © SODIC, Romany, Unsplash)"
                placeholder="Credit"
                defaultValue={p.credit ?? ''}
                onBlur={(e) => start(async () => void (await updatePhoto(kind, { id: p.id, label: p.label ?? '', credit: e.target.value })))}
                className={`${field} min-h-10 text-sm`}
              />
            </div>
            <div className="mt-2 flex gap-1">
              <button type="button" onClick={() => move(p.id, -1)} disabled={i === 0} className={`${btn.icon} size-10`} aria-label="Move earlier">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" onClick={() => move(p.id, 1)} disabled={i === photos.length - 1} className={`${btn.icon} size-10`} aria-label="Move later">
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm('Delete this photo?')) return;
                  setPhotos((all) => all.filter((x) => x.id !== p.id));
                  start(async () => void (await deletePhoto(kind, p.id)));
                }}
                className="ms-auto inline-flex size-10 items-center justify-center rounded-btn text-heart hover:bg-fill"
                aria-label="Delete photo"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
