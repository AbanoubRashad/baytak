import { photoUrl } from '@/lib/photos';
import type { Compound, Photo, Settings, StoryItem, Unit } from '@/lib/types';

/** Row shapes as returned by Supabase (snake_case). Numeric columns can arrive as strings. */
type Num = number | string | null;

export interface PhotoRow {
  id: string;
  path: string;
  label: string | null;
  credit: string | null;
  sort: number;
}

export interface CompoundRow {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  developer: string | null;
  location: string;
  location_ar: string | null;
  area: Compound['area'];
  mode: Compound['mode'];
  unit_types: Compound['unitTypes'];
  price_from: Num;
  resale_price_from: Num;
  down_payment_min_pct: Num;
  max_years: Num;
  finishing: Compound['finishing'];
  master_plan_acres: Num;
  description_en: string;
  description_ar: string;
  consultant_note: string | null;
  consultant_note_ar: string | null;
  amenities: string[];
  amenities_ar: string[];
  lat: Num;
  lng: Num;
  featured: boolean;
  sort: number;
  status: Compound['status'];
  source_checked_at: string | null;
  compound_photos?: PhotoRow[];
}

export interface UnitRow {
  id: string;
  slug: string;
  compound_id: string;
  project: string | null;
  sale_type: Unit['saleType'];
  unit_type: Unit['unitType'];
  beds: number;
  baths: number;
  size_m2: Num;
  garden_m2: Num;
  terrace_m2: Num;
  land_m2: Num;
  price: Num;
  price_max: Num;
  down_payment_amount: Num;
  down_payment_pct: Num;
  installment_amount: Num;
  installment_frequency: Unit['installmentFrequency'];
  installment_years: Num;
  delivery: string;
  finishing: Unit['finishing'];
  floor: string | null;
  cash_only: boolean;
  consultant_note: string | null;
  consultant_note_ar: string | null;
  featured: boolean;
  status: Unit['status'];
  listing_status: Unit['listingStatus'];
  sort: number;
  unit_photos?: PhotoRow[];
}

export interface SettingsRow {
  consultant_name: string;
  consultant_name_ar: string;
  title: string;
  title_ar: string;
  portrait_path: string;
  avatar_path: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  hours: string;
  hours_ar: string;
  open_days: number[];
  open_from: number;
  open_to: number;
  available: boolean;
  areas: string[];
  areas_ar: string[];
  social: Settings['social'];
  story_intro: string;
  story_intro_ar: string;
  quote: string;
  quote_ar: string;
}

export interface StoryRow {
  id: string;
  year: string;
  title: string;
  title_ar: string | null;
  text: string;
  text_ar: string | null;
  sort: number;
}

const num = (v: Num): number | null => (v == null || v === '' ? null : Number(v));

const photos = (rows: PhotoRow[] | undefined): Photo[] =>
  [...(rows ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map((p) => ({ id: p.id, path: p.path, label: p.label, credit: p.credit, sort: p.sort }));

export function toCompound(r: CompoundRow): Compound {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    nameAr: r.name_ar,
    developer: r.developer,
    location: r.location,
    locationAr: r.location_ar,
    area: r.area,
    mode: r.mode,
    unitTypes: r.unit_types ?? [],
    priceFrom: num(r.price_from),
    resalePriceFrom: num(r.resale_price_from),
    downPaymentMinPct: num(r.down_payment_min_pct),
    maxYears: num(r.max_years),
    finishing: r.finishing,
    masterPlanAcres: num(r.master_plan_acres),
    descriptionEn: r.description_en,
    descriptionAr: r.description_ar,
    consultantNote: r.consultant_note,
    consultantNoteAr: r.consultant_note_ar,
    amenities: r.amenities ?? [],
    amenitiesAr: r.amenities_ar ?? [],
    lat: num(r.lat),
    lng: num(r.lng),
    featured: r.featured,
    sort: r.sort,
    status: r.status,
    sourceCheckedAt: r.source_checked_at,
    photos: photos(r.compound_photos),
  };
}

export function toUnit(r: UnitRow): Unit {
  return {
    id: r.id,
    slug: r.slug,
    compoundId: r.compound_id,
    project: r.project,
    saleType: r.sale_type,
    unitType: r.unit_type,
    beds: r.beds,
    baths: r.baths,
    sizeM2: num(r.size_m2) ?? 0,
    gardenM2: num(r.garden_m2),
    terraceM2: num(r.terrace_m2),
    landM2: num(r.land_m2),
    price: num(r.price) ?? 0,
    priceMax: num(r.price_max),
    downPaymentAmount: num(r.down_payment_amount),
    downPaymentPct: num(r.down_payment_pct),
    installmentAmount: num(r.installment_amount),
    installmentFrequency: r.installment_frequency,
    installmentYears: num(r.installment_years),
    delivery: r.delivery,
    finishing: r.finishing,
    floor: r.floor,
    cashOnly: r.cash_only,
    consultantNote: r.consultant_note,
    consultantNoteAr: r.consultant_note_ar,
    featured: r.featured,
    status: r.status,
    listingStatus: r.listing_status,
    sort: r.sort,
    photos: photos(r.unit_photos),
  };
}

export function toSettings(r: SettingsRow): Settings {
  return {
    consultantName: r.consultant_name,
    consultantNameAr: r.consultant_name_ar,
    title: r.title,
    titleAr: r.title_ar,
    portraitPath: photoUrl(r.portrait_path),
    avatarPath: photoUrl(r.avatar_path),
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email,
    hours: r.hours,
    hoursAr: r.hours_ar,
    openDays: r.open_days,
    openFrom: r.open_from,
    openTo: r.open_to,
    available: r.available,
    areas: r.areas,
    areasAr: r.areas_ar,
    social: r.social ?? {},
    storyIntro: r.story_intro,
    storyIntroAr: r.story_intro_ar,
    quote: r.quote,
    quoteAr: r.quote_ar,
  };
}

export function toStory(r: StoryRow): StoryItem {
  return { id: r.id, year: r.year, title: r.title, titleAr: r.title_ar, text: r.text, textAr: r.text_ar, sort: r.sort };
}

/** Columns selected for public listings (keeps payloads small and explicit). */
export const COMPOUND_SELECT = '*, compound_photos(id, path, label, credit, sort)';
export const UNIT_SELECT = '*, unit_photos(id, path, label, credit, sort)';
