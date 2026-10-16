import { z } from 'zod';

/** Empty inputs become null; numbers arrive as strings from inputs. */
const optNum = z.preprocess((v) => (v === '' || v == null || Number.isNaN(v) ? null : Number(v)), z.number().nonnegative().nullable());
const reqNum = z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number({ message: 'Required' }).nonnegative());
const optText = z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), z.string().trim().max(4000).nullable());
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes');
const lines = z.preprocess(
  (v) => (typeof v === 'string' ? v.split('\n').map((s) => s.trim()).filter(Boolean) : v),
  z.array(z.string().max(200)).max(40),
);

export const unitSchema = z.object({
  id: z.uuid().optional(),
  slug,
  compoundId: z.uuid({ message: 'Pick a compound' }),
  project: optText,
  saleType: z.enum(['offplan', 'ready']),
  unitType: z.enum(['apartment', 'studio', 'duplex', 'loft', 'penthouse', 'chalet', 'townhouse', 'twin-house', 'villa']),
  beds: reqNum,
  baths: reqNum,
  sizeM2: reqNum,
  gardenM2: optNum,
  terraceM2: optNum,
  landM2: optNum,
  price: reqNum,
  priceMax: optNum,
  downPaymentAmount: optNum,
  downPaymentPct: optNum,
  installmentAmount: optNum,
  installmentFrequency: z.preprocess((v) => (v === '' ? null : v), z.enum(['monthly', 'quarterly']).nullable()),
  installmentYears: optNum,
  delivery: z.string().trim().regex(/^(ready|near|\d{4}(-\d{2})?)$/, 'Use ready, near, 2029 or 2030-01'),
  finishing: z.preprocess((v) => (v === '' ? null : v), z.enum(['not-finished', 'semi-finished', 'finished', 'finished-ac']).nullable()),
  floor: optText,
  cashOnly: z.boolean(),
  consultantNote: optText,
  consultantNoteAr: optText,
  featured: z.boolean(),
  status: z.enum(['available', 'reserved', 'sold']),
  listingStatus: z.enum(['draft', 'published', 'archived']),
  sort: reqNum,
});
export type UnitInput = z.input<typeof unitSchema>;

export const compoundSchema = z.object({
  id: z.uuid().optional(),
  slug,
  name: z.string().trim().min(2).max(120),
  nameAr: optText,
  developer: optText,
  location: z.string().trim().min(2).max(160),
  locationAr: optText,
  area: z.enum(['new-cairo', 'north-coast', 'new-capital', 'october', 'zayed']),
  unitTypes: z.array(z.string()).max(9),
  priceFrom: optNum,
  resalePriceFrom: optNum,
  downPaymentMinPct: optNum,
  maxYears: optNum,
  finishing: z.preprocess((v) => (v === '' ? null : v), z.enum(['not-finished', 'semi-finished', 'finished', 'finished-ac']).nullable()),
  masterPlanAcres: optNum,
  descriptionEn: z.string().trim().max(4000),
  descriptionAr: z.string().trim().max(4000),
  consultantNote: optText,
  consultantNoteAr: optText,
  amenities: lines,
  amenitiesAr: lines,
  lat: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().min(-90).max(90).nullable()),
  lng: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().min(-180).max(180).nullable()),
  featured: z.boolean(),
  sort: reqNum,
  status: z.enum(['draft', 'published', 'archived']),
});
export type CompoundInput = z.input<typeof compoundSchema>;

export const photoPatchSchema = z.object({
  id: z.uuid(),
  label: optText,
  credit: optText,
});

/* ---------- Settings ---------- */
const intlPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => /^20\d{9,10}$/.test(v), 'Use the international format, e.g. 201012345678');
const urlOrEmpty = z.union([z.literal(''), z.url()]);
const lineList = z.string().transform((v) => v.split('\n').map((s) => s.trim()).filter(Boolean));

export const settingsSchema = z.object({
  consultantName: z.string().trim().min(2).max(60),
  consultantNameAr: z.string().trim().min(2).max(60),
  title: z.string().trim().min(2).max(120),
  titleAr: z.string().trim().min(2).max(120),
  portraitPath: z.string().trim().min(3),
  avatarPath: z.string().trim().min(3),
  phone: intlPhone,
  whatsapp: intlPhone,
  email: z.union([z.literal(''), z.email()]),
  hours: z.string().trim().min(3).max(120),
  hoursAr: z.string().trim().min(3).max(120),
  openDays: z.array(z.coerce.number().int().min(0).max(6)).min(1),
  openFrom: z.coerce.number().int().min(0).max(23),
  openTo: z.coerce.number().int().min(1).max(24),
  areas: lineList,
  areasAr: lineList,
  instagram: urlOrEmpty,
  facebook: urlOrEmpty,
  linkedin: urlOrEmpty,
  tiktok: urlOrEmpty,
  storyIntro: z.string().trim().max(2000),
  storyIntroAr: z.string().trim().max(2000),
  quote: z.string().trim().max(400),
  quoteAr: z.string().trim().max(400),
});
export type SettingsInput = z.input<typeof settingsSchema>;

