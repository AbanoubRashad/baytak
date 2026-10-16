import { z } from 'zod';

/**
 * Shared Zod schemas — used by React Hook Form on the client and re-checked in server actions.
 * Error messages are translation keys in the "forms" namespace.
 */

/** Accepts "010 1234 5678", "+20 10 1234 5678", "0020101234567"… and returns "01012345678". */
export function normalizeEgyptMobile(raw: string): string {
  // Arabic-Indic digits (typed on Arabic keyboards) become Latin digits first.
  let d = raw
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[^\d]/g, '');
  if (d.startsWith('0020')) d = d.slice(4);
  else if (d.startsWith('20') && d.length === 12) d = d.slice(2);
  if (d.length === 10 && d.startsWith('1')) d = `0${d}`;
  return d;
}

export const EGYPT_MOBILE = /^01[0125]\d{8}$/;

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizeEgyptMobile)
  .refine((v) => EGYPT_MOBILE.test(v), 'phoneInvalid');

export const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((v) => (v ? normalizeEgyptMobile(v) : ''))
  .refine((v) => v === '' || EGYPT_MOBILE.test(v), 'phoneInvalid');

export const nameSchema = z.string().trim().min(2, 'nameShort').max(80, 'nameShort');
export const localeSchema = z.enum(['en', 'ar']);
export const bestTimeSchema = z.enum(['morning', 'afternoon', 'evening']);
/** Hidden field bots tend to fill. */
export const honeypotSchema = z.string().max(0).optional().or(z.literal(''));

export const callbackSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  bestTime: bestTimeSchema,
  website: honeypotSchema,
  locale: localeSchema,
});
export type CallbackInput = z.input<typeof callbackSchema>;

export const contactSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: z.union([z.literal(''), z.email('emailInvalid')]).optional(),
  message: z.string().trim().min(5, 'messageShort').max(2000, 'messageShort'),
  website: honeypotSchema,
  locale: localeSchema,
});
export type ContactInput = z.input<typeof contactSchema>;

export const bookingSchema = z.object({
  unitId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
  name: nameSchema,
  phone: phoneSchema,
  note: z.string().trim().max(500).optional(),
  website: honeypotSchema,
  locale: localeSchema,
});
export type BookingInput = z.input<typeof bookingSchema>;

export const chatStartSchema = z.object({
  name: z.string().trim().max(80).optional(),
  phone: optionalPhoneSchema.optional(),
  message: z.string().trim().min(1, 'messageShort').max(2000, 'messageShort'),
  unitId: z.uuid().optional(),
  compoundId: z.uuid().optional(),
  source: z.enum(['chat', 'compare', 'afford']).default('chat'),
  website: honeypotSchema,
  locale: localeSchema,
});
export type ChatStartInput = z.input<typeof chatStartSchema>;

export const chatMessageSchema = z.object({
  leadId: z.uuid(),
  token: z.uuid(),
  message: z.string().trim().min(1).max(2000),
});

export const affordSchema = z.object({
  leadId: z.uuid().nullable(),
  down: z.number().int().min(0).max(100_000_000),
  monthly: z.number().int().min(0).max(10_000_000),
  years: z.number().int().min(1).max(15),
  budget: z.number().int().min(0).max(2_000_000_000),
  locale: localeSchema,
});

export type FormError = 'invalid' | 'rate' | 'failed';
export type ActionResult<T = object> =
  | ({ ok: true; stored: boolean } & T)
  | { ok: false; error: FormError; fields?: Record<string, string> };

/** Flattens Zod issues into { field: translationKey }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    out[key] ??= issue.message;
  }
  return out;
}
