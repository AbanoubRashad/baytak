import { site, type Locale } from '@/config/site';
import { pick } from './format';
import { photoUrl } from './photos';
import type { Compound, Settings, UnitWithCompound } from './types';

const abs = (path: string) => (path.startsWith('http') ? path : `${site.url}${path}`);

/** The consultant as a RealEstateAgent (home and about pages). */
export function agentJsonLd(settings: Settings, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: pick(locale, settings.consultantName, settings.consultantNameAr),
    description: pick(locale, settings.title, settings.titleAr),
    image: abs(settings.portraitPath),
    url: `${site.url}${locale === 'ar' ? '/ar' : ''}`,
    telephone: `+${settings.phone}`,
    email: settings.email ?? undefined,
    areaServed: (locale === 'ar' ? settings.areasAr : settings.areas).map((name) => ({ '@type': 'Place', name })),
    address: { '@type': 'PostalAddress', addressLocality: 'Cairo', addressCountry: 'EG' },
    openingHours: 'Sa-Th 11:00-21:00',
    sameAs: Object.values(settings.social).filter(Boolean),
  };
}

export function unitJsonLd(unit: UnitWithCompound, title: string, url: string, locale: Locale, settings: Settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    url,
    description: pick(locale, unit.consultantNote ?? '', unit.consultantNoteAr) || undefined,
    image: unit.photos.map((p) => abs(photoUrl(p.path))),
    datePosted: '2026-10-01',
    offers: {
      '@type': 'Offer',
      price: unit.price,
      priceCurrency: 'EGP',
      availability: unit.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      seller: { '@type': 'RealEstateAgent', name: settings.consultantName, telephone: `+${settings.phone}` },
    },
    about: {
      '@type': 'Accommodation',
      numberOfBedrooms: unit.beds,
      numberOfBathroomsTotal: unit.baths,
      floorSize: { '@type': 'QuantitativeValue', value: unit.sizeM2, unitCode: 'MTK' },
      address: { '@type': 'PostalAddress', addressLocality: unit.compound.location, addressCountry: 'EG' },
      geo: unit.compound.lat != null ? { '@type': 'GeoCoordinates', latitude: unit.compound.lat, longitude: unit.compound.lng } : undefined,
    },
  };
}

export function compoundJsonLd(c: Compound, url: string, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: pick(locale, c.name, c.nameAr),
    url,
    description: pick(locale, c.descriptionEn, c.descriptionAr),
    image: c.photos.map((p) => abs(photoUrl(p.path))),
    address: { '@type': 'PostalAddress', addressLocality: c.location, addressCountry: 'EG' },
    geo: c.lat != null ? { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng } : undefined,
    amenityFeature: c.amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
  };
}

/** Canonical + hreflang for a path: English at /path, Arabic at /ar/path. */
export function localeAlternates(path: string, locale: Locale) {
  const ar = path === '/' ? '/ar' : `/ar${path}`;
  return { canonical: locale === 'ar' ? ar : path, languages: { en: path, ar, 'x-default': path } };
}
