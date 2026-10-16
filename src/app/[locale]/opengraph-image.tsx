import { site } from '@/config/site';
import { getSettings } from '@/lib/data/settings';
import { OG_SIZE, OgCard, ogJpeg, ogPhoto } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/jpeg';
export const alt = 'Find your home with your property consultant in Cairo';

/** Default share card for the site. */
export default async function Image() {
  const [photo, settings] = await Promise.all([ogPhoto('/photos/hero-villa-pool.jpg'), getSettings()]);
  return ogJpeg(
      <OgCard
        photo={photo}
        brand={site.brand}
        eyebrow={`${settings.consultantName} · ${settings.title}`}
        title="Somewhere, a door is waiting to hear your family say “we’re home.”"
        subtitle="New Cairo · New Capital · 6th of October · North Coast"
      />
  );
}
