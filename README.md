# Baytak — Romany's property website

A calm, bilingual (English / Arabic, full RTL) website for an independent property consultant in Egypt,
with one simple inbox for every chat, call-back and visit request.

- **Public site** — home (photo slideshow, search, homes, areas, "What can I afford?", story, compounds, call-back),
  `/units` (all filters, shareable URLs, pagination), unit pages (photo mosaic + lightbox, payment-plan calculator,
  visit booking with calendar file), compounds, saved homes, about/contact.
- **Talking to Romany** — chat widget on every page (stored, with live replies), WhatsApp links with context,
  call-back and contact forms, visit booking. Every one of these creates a **lead**.
- **Admin** at `/admin` ("Romany's inbox") — live leads and conversations, reply by WhatsApp / email / website chat,
  stages, visits board, homes & compounds editor with photo upload, settings and "My story".

Stack: Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS 4 · Supabase (Postgres, Auth,
Storage, Realtime, RLS on every table) · next-intl · React Hook Form + Zod · Vercel Analytics · Playwright.

---

## 1. Run it locally

```bash
git clone https://github.com/AbanoubRashad/baytak.git && cd baytak
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run dev                    # http://localhost:3000 (also downloads the illustrative photos once)
```

Without Supabase variables the site still runs: it shows the seed listings from `src/data/seed.ts`, and forms
show a "preview mode" notice instead of storing anything. The admin needs Supabase.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server (photos are fetched in `prebuild`) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run test:e2e` | Playwright smoke tests (filter → compound → booking, chat → lead) on desktop + mobile |
| `npm run seed:sql` | Regenerates `supabase/seed.sql` from `src/data/seed.ts` |

## 2. Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | e.g. `https://baytak.example` — used in WhatsApp messages, sitemap, Open Graph |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | the **anon / publishable** key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **secret** — server-only, used to store leads after validation. Never expose it. |
| `RATE_LIMIT_SALT` | recommended | any random string (visitor IPs are only stored hashed) |
| `RESEND_API_KEY`, `NOTIFY_EMAIL_TO`, `NOTIFY_EMAIL_FROM` | optional | email for each new lead / booking, and email replies from the inbox ([Resend](https://resend.com), free tier available) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | optional | Telegram message for each new lead / booking |

## 3. Supabase setup (once)

The project used during development is **`baytak`** (`phmfkypybvofzosfbbet`, Frankfurt, Free plan). To set up a new one:

1. Create a project at [supabase.com](https://supabase.com) (Free plan is fine to start; it pauses after a week without traffic).
2. **SQL editor** → run, in order:
   `supabase/migrations/20261015000000_init.sql`, `supabase/migrations/20261015000100_harden.sql`, then `supabase/seed.sql`.
   This creates the tables, Row Level Security, the `photos` storage bucket, Realtime, and the seed listings.
3. **Authentication → Users → Add user** with Romany's email and a password (tick "auto-confirm").
4. Make that account the admin (SQL editor):
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'romany@example.com';
   ```
5. **Authentication → URL configuration**: set *Site URL* to your domain and add
   `https://your-domain/api/auth/callback` to *Redirect URLs* (used by "Forgot your password?").
6. Copy the URL, anon key and service-role key into `.env.local` / Vercel.

**Security model:** visitors (anon) can only *read* published listings, settings and the story. Leads, messages and
bookings are written by server actions using the service-role key after Zod validation, a honeypot field and a
Postgres-backed rate limit — and are readable only by users listed in `public.admins`.

## 4. Deploy to Vercel

1. **Import** the GitHub repo in Vercel (framework: Next.js, no root directory change needed).
2. Add the environment variables above (Production + Preview).
3. Deploy. The `prebuild` step downloads the illustrative Unsplash photos into `public/photos/`.
4. In the Vercel project, enable **Analytics** (the custom events are `WhatsApp click`, `Call click`, `Booking`,
   `Chat started`).
5. Point your domain, then update `NEXT_PUBLIC_SITE_URL` and the Supabase *Site URL* to it.
6. Check [PageSpeed Insights](https://pagespeed.web.dev/) on the live URL for Home and a compound page.

## 5. Things Romany must do before launch

- **Settings → phone & WhatsApp**: the seed uses a placeholder number (`201000000000`).
- **Re-check every price, plan and availability** — the seed reflects listings seen in October 2026.
- **Developers** are left blank where not confirmed — fill them in from Admin → Compounds.
- **Photos are illustrative** (Unsplash). Replace them with developer-provided or his own photos from the admin
  (upload, drag to reorder, set the credit — e.g. "© SODIC").
- **My story**: the timeline text is a draft — confirm the facts in Admin → Settings.
- Replace `public/romany-portrait.jpg` / `public/romany-avatar.jpg` if he has newer photos (or upload in Settings).

## 6. Where things live

```
baytak/
  src/app/[locale]/(site)/…     public pages (EN at /, AR at /ar)
  src/app/[locale]/admin/…      Romany's inbox (English only, /admin)
  src/actions/                  server actions (leads, chat, bookings, admin/*)
  src/components/               UI (ChatWidget, FilterBar, PaymentCalculator, BookingPicker, CompoundCard, StoryTimeline, WhatsAppButton…)
  src/config/site.ts            brand name (placeholder "Baytak") and site-wide constants — rename here
  src/data/seed.ts              seed compounds & units (source for supabase/seed.sql)
  src/lib/                      data loaders, formatting, validation, WhatsApp helper, Supabase clients
  src/messages/{en,ar}.json     all copy
  src/app/globals.css           design tokens (light + optional dark) — defined once as CSS variables
  supabase/                     migrations + seed
  e2e/                          Playwright smoke tests
```

### Notes

- **Copy rule:** the site never uses the word "broker" — Romany is "your property consultant", writing in first person.
- **Caching:** listings and settings are cached (`use cache`) and refreshed instantly when edited in the admin
  (`updateTag`). Pages are prerendered; filters run in the browser and stay in the URL.
- **Performance:** listing cards are server-rendered; the chat, compare, lightbox, booking and call-back forms load
  on demand. Share images are generated as small JPEGs (~70 KB) so WhatsApp shows previews.
