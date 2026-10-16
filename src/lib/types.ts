/** Domain types — they mirror the Supabase schema in supabase/migrations. */

export type AreaKey = 'new-cairo' | 'north-coast' | 'new-capital' | 'october' | 'zayed';
export type SaleType = 'offplan' | 'ready';
export type ListingStatus = 'draft' | 'published' | 'archived';
export type UnitStatus = 'available' | 'reserved' | 'sold';
export type Frequency = 'monthly' | 'quarterly';
export type Finishing = 'not-finished' | 'semi-finished' | 'finished' | 'finished-ac';
export type UnitType =
  | 'apartment'
  | 'studio'
  | 'duplex'
  | 'loft'
  | 'penthouse'
  | 'chalet'
  | 'townhouse'
  | 'twin-house'
  | 'villa';

export interface Photo {
  id: string;
  path: string;
  label: string | null;
  credit: string | null;
  sort: number;
}

export interface Compound {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  developer: string | null;
  location: string;
  locationAr: string | null;
  area: AreaKey;
  mode: 'dev' | 'resale';
  unitTypes: UnitType[];
  priceFrom: number | null;
  resalePriceFrom: number | null;
  downPaymentMinPct: number | null;
  maxYears: number | null;
  finishing: Finishing | null;
  masterPlanAcres: number | null;
  descriptionEn: string;
  descriptionAr: string;
  consultantNote: string | null;
  consultantNoteAr: string | null;
  amenities: string[];
  amenitiesAr: string[];
  lat: number | null;
  lng: number | null;
  featured: boolean;
  sort: number;
  status: ListingStatus;
  sourceCheckedAt: string | null;
  photos: Photo[];
}

export interface Unit {
  id: string;
  slug: string;
  compoundId: string;
  /** Named phase or building inside the compound, e.g. "Central Residence". */
  project: string | null;
  saleType: SaleType;
  unitType: UnitType;
  beds: number;
  baths: number;
  sizeM2: number;
  gardenM2: number | null;
  terraceM2: number | null;
  landM2: number | null;
  price: number;
  priceMax: number | null;
  downPaymentAmount: number | null;
  downPaymentPct: number | null;
  installmentAmount: number | null;
  installmentFrequency: Frequency | null;
  installmentYears: number | null;
  /** ISO month ("2030-01"), year ("2029"), or a keyword: "near" / "ready". */
  delivery: string;
  finishing: Finishing | null;
  floor: string | null;
  cashOnly: boolean;
  consultantNote: string | null;
  consultantNoteAr: string | null;
  featured: boolean;
  status: UnitStatus;
  listingStatus: ListingStatus;
  sort: number;
  photos: Photo[];
}

/** A unit joined with the compound fields every card and page needs. */
export interface UnitWithCompound extends Unit {
  compound: Pick<
    Compound,
    'id' | 'slug' | 'name' | 'nameAr' | 'developer' | 'location' | 'locationAr' | 'area' | 'amenities' | 'amenitiesAr' | 'lat' | 'lng' | 'photos'
  >;
}

export interface StoryItem {
  id: string;
  year: string;
  title: string;
  titleAr: string | null;
  text: string;
  textAr: string | null;
  sort: number;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
}

export interface Settings {
  consultantName: string;
  consultantNameAr: string;
  title: string;
  titleAr: string;
  portraitPath: string;
  avatarPath: string;
  /** International format without "+", e.g. 201001234567. */
  phone: string;
  whatsapp: string;
  email: string | null;
  hours: string;
  hoursAr: string;
  /** Opening hours used to decide "available now": days 0 (Sun) – 6 (Sat), 24h clock, Cairo time. */
  openDays: number[];
  openFrom: number;
  openTo: number;
  /** Manual switch in the admin sidebar. */
  available: boolean;
  areas: string[];
  areasAr: string[];
  social: SocialLinks;
  storyIntro: string;
  storyIntroAr: string;
  quote: string;
  quoteAr: string;
}

export type LeadSource = 'chat' | 'callback' | 'booking' | 'contact' | 'whatsapp' | 'compare' | 'afford';
export type LeadStatus = 'new' | 'contacted' | 'visit_booked' | 'negotiating' | 'reserved' | 'closed';
export type BestTime = 'morning' | 'afternoon' | 'evening';
