-- 002_academic.sql
-- Education, experience, research, publications, teaching.

create table public.education (
  id uuid primary key default gen_random_uuid(),
  degree text not null,
  field text,
  institution text not null,
  start_year int,
  end_year int,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  organization text not null,
  location text,
  kind text not null default 'academic' check (kind in ('academic', 'professional')),
  start_date date,
  end_date date,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.research_interests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.academic_affiliations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  kind text not null default 'affiliation' check (kind in ('affiliation', 'membership')),
  url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.teaching_experience (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'appointment', 'workshop', 'conference', 'seminar',
    'supervision', 'certificate', 'professional_development'
  )),
  title text not null,
  organization text,
  location text,
  start_date date,
  end_date date,
  description text,
  url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text,
  title text not null,
  description text,
  level text,
  institution text,
  term text,
  resources_url text,
  resource_file_url text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text,
  author_affiliation text,
  content text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.research_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  abstract text,
  objectives text,
  research_questions text,
  methodology text,
  findings text,
  category text,
  status text not null default 'ongoing' check (status in ('planned', 'ongoing', 'completed')),
  start_date date,
  end_date date,
  institution text,
  milestones text[] not null default '{}',
  cover_image_url text,
  attachments jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index research_projects_status_idx on public.research_projects (status);

create table public.research_collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects (id) on delete cascade,
  name text not null,
  affiliation text,
  role text,
  url text,
  sort_order int not null default 0
);
create index research_collaborators_project_idx on public.research_collaborators (project_id);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  publication_type text not null check (publication_type in (
    'journal_article', 'conference_paper', 'book', 'book_chapter',
    'dissertation', 'thesis', 'working_paper', 'research_report'
  )),
  abstract text,
  publication_date date,
  venue text,
  volume text,
  issue text,
  pages text,
  doi text,
  url text,
  pdf_url text,
  category text,
  keywords text[] not null default '{}',
  citation_override text,
  project_id uuid references public.research_projects (id) on delete set null,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index publications_date_idx on public.publications (publication_date desc);
create index publications_type_idx on public.publications (publication_type);
create index publications_project_idx on public.publications (project_id);

create table public.publication_authors (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications (id) on delete cascade,
  given_names text,
  family_name text not null,
  sort_order int not null default 0
);
create index publication_authors_pub_idx on public.publication_authors (publication_id);
