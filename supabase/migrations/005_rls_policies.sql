-- 005_rls_policies.sql
-- Row Level Security for every table, plus updated_at triggers.

do $$
declare
  t text;
begin
  -- updated_at triggers
  foreach t in array array[
    'website_settings', 'email_settings', 'seo_pages', 'profiles', 'education', 'experiences',
    'teaching_experience', 'courses', 'research_projects', 'publications', 'blog_posts',
    'newsletter_issues', 'languages', 'phonological_data', 'phonological_examples',
    'syntax_trees', 'syntactic_examples', 'morphological_examples', 'interlinear_glosses',
    'dictionary_entries', 'corpus_collections', 'corpus_documents', 'audio_recordings'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;

  -- Tables everyone can read, staff can write
  foreach t in array array[
    'profiles', 'education', 'experiences', 'research_interests', 'academic_affiliations',
    'teaching_experience', 'language_families', 'seo_pages', 'ipa_symbols',
    'blog_categories', 'blog_tags'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format(
      'create policy "staff write" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())',
      t
    );
  end loop;

  -- Tables with an is_published flag
  foreach t in array array[
    'courses', 'research_projects', 'publications', 'languages', 'phonological_data',
    'phonological_examples', 'syntax_trees', 'syntactic_examples', 'morphological_examples',
    'interlinear_glosses', 'dictionary_entries', 'corpus_collections'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read published" on public.%I for select to anon, authenticated using (is_published)', t);
    execute format(
      'create policy "staff write" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())',
      t
    );
  end loop;
end $$;

-- Child tables: visible whenever the parent row is visible to the caller.
-- (The sub-select is itself subject to the parent's RLS.)
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('research_collaborators', 'project_id', 'research_projects'),
      ('publication_authors', 'publication_id', 'publications'),
      ('language_dialects', 'language_id', 'languages'),
      ('dictionary_examples', 'entry_id', 'dictionary_entries'),
      ('audio_transcriptions', 'recording_id', 'audio_recordings'),
      ('blog_post_tags', 'post_id', 'blog_posts'),
      ('corpus_annotations', 'document_id', 'corpus_documents')
    ) as v(child, fk, parent)
  loop
    execute format('alter table public.%I enable row level security', r.child);
    execute format(
      'create policy "public read via parent" on public.%I for select to anon, authenticated using (exists (select 1 from public.%I p where p.id = %I))',
      r.child, r.parent, r.fk
    );
    execute format(
      'create policy "staff write" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())',
      r.child
    );
  end loop;
end $$;

-- Corpus documents: only documents flagged public inside a published collection
alter table public.corpus_documents enable row level security;
create policy "public read public documents" on public.corpus_documents
  for select to anon, authenticated
  using (is_public and exists (select 1 from public.corpus_collections c where c.id = collection_id));
create policy "staff write" on public.corpus_documents
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Blog: published posts, or scheduled posts whose time has arrived
alter table public.blog_posts enable row level security;
create policy "public read live posts" on public.blog_posts
  for select to anon, authenticated
  using (status in ('published', 'scheduled') and published_at is not null and published_at <= now());
create policy "staff write" on public.blog_posts
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Audio: only published recordings with documented consent
alter table public.audio_recordings enable row level security;
create policy "public read consented recordings" on public.audio_recordings
  for select to anon, authenticated
  using (is_published and consent_status = 'consent_given');
create policy "staff write" on public.audio_recordings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Testimonials: approved only
alter table public.testimonials enable row level security;
create policy "public read approved" on public.testimonials
  for select to anon, authenticated using (is_approved);
create policy "staff write" on public.testimonials
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Public settings: everyone reads, only admins write
alter table public.website_settings enable row level security;
create policy "public read" on public.website_settings
  for select to anon, authenticated using (true);
create policy "admin write" on public.website_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Private email settings: admins only
alter table public.email_settings enable row level security;
create policy "admin all" on public.email_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Staff-only tables. Public form submissions are written by the server with the
-- service role key (after validation, spam checks and rate limiting), so there are
-- deliberately no anonymous INSERT policies.
do $$
declare
  t text;
begin
  foreach t in array array[
    'media_files', 'contact_messages', 'collaboration_requests',
    'newsletter_subscribers', 'newsletter_issues'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "staff all" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())',
      t
    );
  end loop;
end $$;

-- Activity log: staff can read it but never edit or delete it. Entries are written by the
-- server with the service role key.
alter table public.activity_logs enable row level security;
create policy "staff read" on public.activity_logs
  for select to authenticated using (public.is_staff());

-- Rate limit events: RLS on, no policies (service role only)
alter table public.rate_limit_events enable row level security;

-- Staff accounts: a user may read their own row, admins may read all.
-- Writes happen only through the server (service role key).
alter table public.admin_users enable row level security;
create policy "read own or admin" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
