import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { site } from '@/config/site';
import { photoUrl } from './photos';

const download = async (url: string) => Buffer.from(await (await fetch(url)).arrayBuffer());

export const OG_SIZE = { width: 1200, height: 630 };

/** Photo pre-cropped to 1200×630 and inlined, so the card renders fast and stays small. */
export async function ogPhoto(path: string): Promise<string> {
  let source: Buffer;
  try {
    // Local during builds; on serverless the public folder lives on the CDN, so fall back to fetching it.
    source = path.startsWith('/') ? await readFile(join(process.cwd(), 'public', path)) : await download(photoUrl(path));
  } catch {
    source = await download(path.startsWith('/') ? `${site.url}${path}` : photoUrl(path));
  }
  const jpeg = await sharp(source).resize(OG_SIZE.width, OG_SIZE.height, { fit: 'cover' }).jpeg({ quality: 72 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

/**
 * Renders a share card as JPEG (~150 KB). PNG photos are >1 MB, which WhatsApp — the main way
 * homes get shared here — refuses to preview.
 */
const fonts = Promise.all([
  readFile(join(process.cwd(), 'src/assets/fonts/bricolage-800.ttf')),
  readFile(join(process.cwd(), 'src/assets/fonts/dmsans-500.ttf')),
]);

export async function ogJpeg(element: ReactElement): Promise<Response> {
  const [display, body] = await fonts;
  const png = Buffer.from(
    await new ImageResponse(element, {
      ...OG_SIZE,
      fonts: [
        { name: 'Bricolage', data: display, weight: 800, style: 'normal' },
        { name: 'DM Sans', data: body, weight: 500, style: 'normal' },
      ],
    }).arrayBuffer(),
  );
  const jpeg = await sharp(png).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } });
}

/** Shared share-card layout: full-bleed photo, dark scrim, title block and the brand. */
export function OgCard({ photo, eyebrow, title, subtitle, brand }: { photo: string; eyebrow: string; title: string; subtitle: string; brand: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'DM Sans' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', backgroundImage: 'linear-gradient(90deg, rgba(20,28,36,0.88) 0%, rgba(20,28,36,0.6) 55%, rgba(20,28,36,0.15) 100%)' }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 64, width: '100%', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2B76A6', fontSize: 30, fontFamily: 'Bricolage', fontWeight: 800 }}>
            B
          </div>
          <div style={{ fontSize: 34, fontFamily: 'Bricolage', fontWeight: 800 }}>{brand}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 820 }}>
          <div style={{ fontSize: 26, color: '#9FCDEC', textTransform: 'uppercase', letterSpacing: 3 }}>{eyebrow}</div>
          <div style={{ fontSize: 68, fontFamily: 'Bricolage', fontWeight: 800, lineHeight: 1.05, marginTop: 12, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ fontSize: 32, marginTop: 18, color: 'rgba(255,255,255,0.92)' }}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
