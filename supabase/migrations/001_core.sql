-- 001_core.sql
-- Extensions, helper functions and core site tables.

create extension if not exists pg_trgm with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Staff accounts (Supabase Auth users that may use the admin dashboard)
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Public site settings (single row, safe to expose publicly)
create table public.website_settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'Linguist Portfolio',
  tagline text,
  institution text,
  contact_email text,
  phone text,
  address text,
  logo_url text,
  favicon_url text,
  linkedin_url text,
  google_scholar_url text,
  orcid_url text,
  researchgate_url text,
  academia_url text,
  github_url text,
  zenodo_url text,
  twitter_url text,
  default_meta_title text,
  default_meta_description text,
  og_image_url text,
  noindex_site boolean not null default false,
  robots_extra text,
  show_email_publicly boolean not null default true,
  show_phone_publicly boolean not null default false,
  privacy_notice text,
  updated_at timestamptz not null default now()
);
insert into public.website_settings (id) values (1) on conflict do nothing;

-- Private email settings (staff only)
create table public.email_settings (
  id int primary key default 1 check (id = 1),
  notify_email text,
  from_email text,
  reply_to_email text,
  updated_at timestamptz not null default now()
);
insert into public.email_settings (id) values (1) on conflict do nothing;

create table public.media_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bucket text not null default 'media-library',
  path text not null,
  url text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text not null,
  table_name text,
  record_id text,
  summary text,
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);

-- Used by the server to rate limit public forms (service role only)
create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_events_lookup_idx on public.rate_limit_events (bucket, created_at desc);

-- Per-page SEO overrides
create table public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  title text,
  description text,
  og_image_url text,
  canonical_url text,
  noindex boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Profile of the linguist (the site uses the first row)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  academic_title text,
  specialization text,
  headline text,
  intro text,
  biography text,
  photo_url text,
  cv_url text,
  email text,
  phone text,
  location text,
  teaching_philosophy text,
  languages_spoken text[] not null default '{}',
  specializations text[] not null default '{}',
  awards text[] not null default '{}',
  achievements text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
