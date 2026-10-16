-- Baytak schema. Row Level Security is enabled on every table.
-- Public visitors (anon) can only READ published listings, the story and settings.
-- Leads, messages and bookings are written by server actions with the service-role key
-- (after validation, honeypot and rate limiting) and are readable only by the admin.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Romany's account only. Add his auth user id here after he signs up (see README).
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create policy "admins read themselves" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table public.compounds (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  name_ar text,
  developer text,
  location text not null,
  location_ar text,
  area text not null check (area in ('new-cairo', 'north-coast', 'new-capital', 'october', 'zayed')),
  mode text not null default 'dev' check (mode in ('dev', 'resale')),
  unit_types text[] not null default '{}',
  price_from bigint check (price_from >= 0),
  resale_price_from bigint check (resale_price_from >= 0),
  down_payment_min_pct numeric(5, 2),
  max_years numeric(4, 1),
  finishing text check (finishing in ('not-finished', 'semi-finished', 'finished', 'finished-ac')),
  master_plan_acres numeric(10, 2),
  description_en text not null default '',
  description_ar text not null default '',
  consultant_note text,
  consultant_note_ar text,
  amenities text[] not null default '{}',
  amenities_ar text[] not null default '{}',
  lat double precision,
  lng double precision,
  featured boolean not null default false,
  sort integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  source_checked_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger compounds_updated_at before update on public.compounds
  for each row execute function public.set_updated_at();
create index compounds_area_idx on public.compounds (area);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  compound_id uuid not null references public.compounds (id) on delete restrict,
  project text,
  sale_type text not null check (sale_type in ('offplan', 'ready')),
  unit_type text not null check (unit_type in ('apartment', 'studio', 'duplex', 'loft', 'penthouse', 'chalet', 'townhouse', 'twin-house', 'villa')),
  beds smallint not null check (beds >= 0),
  baths smallint not null check (baths >= 0),
  size_m2 numeric(8, 1) not null check (size_m2 > 0),
  garden_m2 numeric(8, 1),
  terrace_m2 numeric(8, 1),
  land_m2 numeric(8, 1),
  price bigint not null check (price > 0),
  price_max bigint check (price_max is null or price_max >= price),
  down_payment_amount bigint,
  down_payment_pct numeric(5, 2),
  installment_amount bigint,
  installment_frequency text check (installment_frequency in ('monthly', 'quarterly')),
  installment_years numeric(4, 1),
  delivery text not null default 'ready',
  finishing text check (finishing in ('not-finished', 'semi-finished', 'finished', 'finished-ac')),
  floor text,
  cash_only boolean not null default false,
  consultant_note text,
  consultant_note_ar text,
  featured boolean not null default false,
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  listing_status text not null default 'published' check (listing_status in ('draft', 'published', 'archived')),
  sort integer not null default 0,
  save_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger units_updated_at before update on public.units
  for each row execute function public.set_updated_at();
create index units_compound_idx on public.units (compound_id);

create table public.compound_photos (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.compounds (id) on delete cascade,
  path text not null,
  label text,
  sort integer not null default 0,
  credit text,
  created_at timestamptz not null default now()
);
create index compound_photos_parent_idx on public.compound_photos (parent_id, sort);

create table public.unit_photos (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.units (id) on delete cascade,
  path text not null,
  label text,
  sort integer not null default 0,
  credit text,
  created_at timestamptz not null default now()
);
create index unit_photos_parent_idx on public.unit_photos (parent_id, sort);

alter table public.compounds enable row level security;
alter table public.units enable row level security;
alter table public.compound_photos enable row level security;
alter table public.unit_photos enable row level security;

create policy "public reads published compounds" on public.compounds
  for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "admin manages compounds" on public.compounds
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads published units" on public.units
  for select to anon, authenticated
  using (
    (listing_status = 'published'
      and exists (select 1 from public.compounds c where c.id = compound_id and c.status = 'published'))
    or public.is_admin()
  );
create policy "admin manages units" on public.units
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads compound photos" on public.compound_photos
  for select to anon, authenticated
  using (exists (select 1 from public.compounds c where c.id = parent_id and (c.status = 'published' or public.is_admin())));
create policy "admin manages compound photos" on public.compound_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads unit photos" on public.unit_photos
  for select to anon, authenticated
  using (exists (select 1 from public.units u where u.id = parent_id and (u.listing_status = 'published' or public.is_admin())));
create policy "admin manages unit photos" on public.unit_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Visitors' hearts feed the "most-saved home" stat. Only this narrow counter is writable by anon.
create or replace function public.increment_save(p_unit uuid, p_delta integer)
returns void
language sql security definer set search_path = public
as $$
  update public.units
     set save_count = greatest(0, save_count + sign(p_delta)::integer)
   where id = p_unit;
$$;
revoke all on function public.increment_save(uuid, integer) from public;
grant execute on function public.increment_save(uuid, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Leads, messages, bookings — admin only
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  phone text,
  email text,
  source text not null check (source in ('chat', 'callback', 'booking', 'contact', 'whatsapp', 'compare', 'afford')),
  compound_id uuid references public.compounds (id) on delete set null,
  unit_id uuid references public.units (id) on delete set null,
  preferred_time text check (preferred_time in ('morning', 'afternoon', 'evening')),
  budget text,
  next_step text,
  status text not null default 'new' check (status in ('new', 'contacted', 'visit_booked', 'negotiating', 'reserved', 'closed')),
  notes text,
  locale text not null default 'en' check (locale in ('en', 'ar')),
  -- Lets the visitor's browser continue its own chat thread without an account.
  access_token uuid not null default gen_random_uuid(),
  first_reply_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
create index leads_created_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  sender text not null check (sender in ('client', 'consultant')),
  channel text not null default 'web' check (channel in ('web', 'whatsapp', 'email')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_lead_idx on public.messages (lead_id, created_at);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  compound_id uuid references public.compounds (id) on delete set null,
  unit_id uuid references public.units (id) on delete set null,
  starts_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'done')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create index bookings_starts_idx on public.bookings (starts_at);

alter table public.leads enable row level security;
alter table public.messages enable row level security;
alter table public.bookings enable row level security;

create policy "admin manages leads" on public.leads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages messages" on public.messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manages bookings" on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Keep lead timestamps current; Romany's first reply to a New lead moves it to Contacted.
create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.leads l
     set last_message_at = new.created_at,
         first_reply_at = case when new.sender = 'consultant' and l.first_reply_at is null then new.created_at else l.first_reply_at end,
         status = case when new.sender = 'consultant' and l.status = 'new' then 'contacted' else l.status end
   where l.id = new.lead_id;
  return new;
end $$;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.on_message_insert();

-- A new booking moves the lead to "Visit booked" unless it is already further along.
create or replace function public.on_booking_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.leads
     set status = 'visit_booked'
   where id = new.lead_id and status in ('new', 'contacted');
  return new;
end $$;
create trigger bookings_after_insert after insert on public.bookings
  for each row execute function public.on_booking_insert();

-- ---------------------------------------------------------------------------
-- Story & settings
-- ---------------------------------------------------------------------------
create table public.story_items (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  title_ar text,
  text text not null,
  text_ar text,
  sort integer not null default 0
);
alter table public.story_items enable row level security;
create policy "public reads story" on public.story_items for select to anon, authenticated using (true);
create policy "admin manages story" on public.story_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.settings (
  id smallint primary key default 1 check (id = 1),
  consultant_name text not null,
  consultant_name_ar text not null,
  title text not null,
  title_ar text not null,
  portrait_path text not null,
  avatar_path text not null,
  phone text not null,
  whatsapp text not null,
  email text,
  hours text not null,
  hours_ar text not null,
  open_days smallint[] not null default '{6,0,1,2,3,4}',
  open_from smallint not null default 11 check (open_from between 0 and 23),
  open_to smallint not null default 21 check (open_to between 1 and 24),
  available boolean not null default true,
  areas text[] not null default '{}',
  areas_ar text[] not null default '{}',
  social jsonb not null default '{}',
  story_intro text not null default '',
  story_intro_ar text not null default '',
  quote text not null default '',
  quote_ar text not null default '',
  updated_at timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
alter table public.settings enable row level security;
create policy "public reads settings" on public.settings for select to anon, authenticated using (true);
create policy "admin updates settings" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Rate limiting for public server actions (called with the service-role key only)
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);
alter table public.rate_limits enable row level security; -- no policies: service role only

create or replace function public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for listing photos; only the admin can write
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "admin uploads photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos' and public.is_admin());
create policy "admin updates photos" on storage.objects
  for update to authenticated using (bucket_id = 'photos' and public.is_admin());
create policy "admin deletes photos" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime: the admin inbox listens to these tables (RLS still applies)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.leads, public.messages, public.bookings;
