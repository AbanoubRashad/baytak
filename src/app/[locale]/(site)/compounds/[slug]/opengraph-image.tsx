import { site } from '@/config/site';
import { getCompoundBySlug, getCompounds } from '@/lib/data/listings';
import { formatCompact } from '@/lib/format';
import { OG_SIZE, OgCard, ogJpeg, ogPhoto } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/jpeg';
export const alt = 'Compound overview';

export async function generateStaticParams() {
  return (await getCompounds()).map((c) => ({ slug: c.slug }));
}

/** Share card for each compound: its photo, name, location and starting price. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCompoundBySlug(slug);
  const photo = await ogPhoto(c?.photos[0]?.path ?? '/photos/hero-villa-pool.jpg');
  return ogJpeg(
      <OgCard
        photo={photo}
        brand={site.brand}
        eyebrow={[c?.developer, 'Compound'].filter(Boolean).join(' · ')}
        title={c?.name ?? site.brand}
        subtitle={[c?.location, c?.priceFrom ? `From EGP ${formatCompact(c.priceFrom, 'en')}` : null].filter(Boolean).join(' · ')}
      />
  );
}
