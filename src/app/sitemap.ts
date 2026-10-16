import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { getCompounds, getUnits } from '@/lib/data/listings';

/** Every public page in English (/) and Arabic (/ar), with hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [units, compounds] = await Promise.all([getUnits(), getCompounds()]);
  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${site.url}${path}`,
    changeFrequency: 'weekly',
    priority,
    alternates: { languages: { en: `${site.url}${path}`, ar: `${site.url}/ar${path === '/' ? '' : path}` } },
  });
  return [
    entry('/', 1),
    entry('/units', 0.9),
    entry('/compounds', 0.8),
    entry('/about', 0.6),
    ...units.filter((u) => u.status !== 'sold').map((u) => entry(`/units/${u.slug}`, 0.8)),
    ...compounds.map((c) => entry(`/compounds/${c.slug}`, 0.7)),
  ];
}
