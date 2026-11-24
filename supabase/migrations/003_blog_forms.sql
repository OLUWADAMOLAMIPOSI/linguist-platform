-- 003_blog_forms.sql
-- Blog, contact, collaboration and newsletter.

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  featured_image_url text,
  author_name text,
  category_id uuid references public.blog_categories (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  published_at timestamptz,
  reading_minutes int not null default 1,
  seo_title text,
  seo_description text,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_published_idx on public.blog_posts (status, published_at desc);
create index blog_posts_category_idx on public.blog_posts (category_id);

create table public.blog_post_tags (
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  tag_id uuid not null references public.blog_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);
create index blog_post_tags_tag_idx on public.blog_post_tags (tag_id);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  category text not null default 'general' check (category in (
    'general', 'research', 'teaching', 'media', 'other'
  )),
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  admin_notes text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);

create table public.collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  affiliation text,
  request_type text not null check (request_type in (
    'collaboration_proposal', 'joint_publication', 'fieldwork',
    'academic_invitation', 'speaking_request', 'supervision_enquiry'
  )),
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  admin_notes text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index collaboration_requests_status_idx on public.collaboration_requests (status, created_at desc);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirm_token uuid not null default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index newsletter_subscribers_email_idx on public.newsletter_subscribers (lower(email));
create unique index newsletter_subscribers_confirm_idx on public.newsletter_subscribers (confirm_token);
create unique index newsletter_subscribers_unsub_idx on public.newsletter_subscribers (unsubscribe_token);

create table public.newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sent')),
  sent_at timestamptz,
  recipients_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
