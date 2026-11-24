-- 004_linguistics.sql
-- Language documentation, phonology, syntax, morphology, dictionary, corpus, audio.

create table public.language_families (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.languages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  alternative_names text[] not null default '{}',
  iso_code text,
  glottocode text,
  family_id uuid references public.language_families (id) on delete set null,
  classification text,
  region text,
  country text,
  latitude numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  speakers_count bigint check (speakers_count is null or speakers_count >= 0),
  speakers_note text,
  vitality text not null default 'unknown' check (vitality in (
    'safe', 'vulnerable', 'definitely_endangered', 'severely_endangered',
    'critically_endangered', 'extinct', 'unknown'
  )),
  vitality_source text,
  description text,
  grammar_overview text,
  orthography_notes text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index languages_family_idx on public.languages (family_id);

alter table public.research_projects
  add column language_id uuid references public.languages (id) on delete set null;
create index research_projects_language_idx on public.research_projects (language_id);

create table public.language_dialects (
  id uuid primary key default gen_random_uuid(),
  language_id uuid not null references public.languages (id) on delete cascade,
  name text not null,
  region text,
  description text,
  sort_order int not null default 0
);
create index language_dialects_language_idx on public.language_dialects (language_id);

-- Reference table for the interactive IPA chart
create table public.ipa_symbols (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  category text not null check (category in ('consonant', 'vowel', 'other_consonant')),
  place text,
  manner text,
  voicing text check (voicing is null or voicing in ('voiced', 'voiceless')),
  height text,
  backness text,
  rounded boolean,
  description text,
  audio_url text,
  sort_order int not null default 0
);

create table public.phonological_data (
  id uuid primary key default gen_random_uuid(),
  language_id uuid not null references public.languages (id) on delete cascade,
  category text not null check (category in (
    'consonant_inventory', 'vowel_inventory', 'tone_system',
    'syllable_structure', 'phonological_rule', 'phonological_process'
  )),
  title text not null,
  content text,
  symbols text[] not null default '{}',
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index phonological_data_language_idx on public.phonological_data (language_id);

create table public.phonological_examples (
  id uuid primary key default gen_random_uuid(),
  language_id uuid references public.languages (id) on delete cascade,
  ipa_symbol_id uuid references public.ipa_symbols (id) on delete set null,
  example_type text not null default 'word' check (example_type in ('word', 'minimal_pair', 'rule', 'tone')),
  minimal_pair_group text,
  orthographic text,
  phonemic text,
  phonetic text,
  translation text,
  notes text,
  audio_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index phonological_examples_language_idx on public.phonological_examples (language_id);
create index phonological_examples_symbol_idx on public.phonological_examples (ipa_symbol_id);

create table public.syntax_trees (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tree_data jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.syntactic_examples (
  id uuid primary key default gen_random_uuid(),
  language_id uuid references public.languages (id) on delete cascade,
  sentence text not null,
  translation text,
  phrase_structure text,
  constituency_analysis text,
  grammatical_relations text,
  word_order text,
  clause_structure text,
  transformation_notes text,
  syntax_tree_id uuid references public.syntax_trees (id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index syntactic_examples_language_idx on public.syntactic_examples (language_id);

create table public.morphological_examples (
  id uuid primary key default gen_random_uuid(),
  language_id uuid references public.languages (id) on delete cascade,
  word text not null,
  segmentation text,
  root text,
  affixes text,
  process_type text not null default 'inflection' check (process_type in (
    'inflection', 'derivation', 'compounding', 'reduplication', 'other'
  )),
  translation text,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index morphological_examples_language_idx on public.morphological_examples (language_id);

create table public.interlinear_glosses (
  id uuid primary key default gen_random_uuid(),
  language_id uuid references public.languages (id) on delete cascade,
  source_text text not null,
  segmentation text not null,
  gloss text not null,
  free_translation text not null,
  notes text,
  reference text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index interlinear_glosses_language_idx on public.interlinear_glosses (language_id);

create table public.dictionary_entries (
  id uuid primary key default gen_random_uuid(),
  language_id uuid not null references public.languages (id) on delete cascade,
  headword text not null,
  native_form text,
  translation text not null,
  phonetic text,
  part_of_speech text,
  grammatical_category text,
  definition text,
  morphology text,
  audio_url text,
  related_words text[] not null default '{}',
  dialect text,
  usage_notes text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dictionary_entries_language_idx on public.dictionary_entries (language_id);
create index dictionary_entries_headword_lower_idx on public.dictionary_entries (lower(headword));
create index dictionary_entries_headword_trgm_idx on public.dictionary_entries using gin (headword extensions.gin_trgm_ops);
create index dictionary_entries_translation_trgm_idx on public.dictionary_entries using gin (translation extensions.gin_trgm_ops);
create index dictionary_entries_definition_trgm_idx on public.dictionary_entries using gin (definition extensions.gin_trgm_ops);

create table public.dictionary_examples (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.dictionary_entries (id) on delete cascade,
  sentence text not null,
  translation text,
  sort_order int not null default 0
);
create index dictionary_examples_entry_idx on public.dictionary_examples (entry_id);

create table public.corpus_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  language_id uuid references public.languages (id) on delete set null,
  license text,
  dataset_path text,
  allow_download boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.corpus_documents (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.corpus_collections (id) on delete cascade,
  title text not null,
  content text not null,
  source text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index corpus_documents_collection_idx on public.corpus_documents (collection_id);

create table public.corpus_annotations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.corpus_documents (id) on delete cascade,
  start_offset int not null check (start_offset >= 0),
  end_offset int not null check (end_offset > start_offset),
  label text not null,
  note text,
  created_at timestamptz not null default now()
);
create index corpus_annotations_document_idx on public.corpus_annotations (document_id);

create table public.audio_recordings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  language_id uuid references public.languages (id) on delete set null,
  file_path text not null,
  duration_seconds numeric(10, 2),
  speaker_label text,
  consent_status text not null default 'pending' check (consent_status in (
    'pending', 'consent_given', 'restricted'
  )),
  recorded_on date,
  location text,
  phonetic_transcription text,
  orthographic_transcription text,
  translation text,
  gloss_id uuid references public.interlinear_glosses (id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index audio_recordings_language_idx on public.audio_recordings (language_id);

create table public.audio_transcriptions (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.audio_recordings (id) on delete cascade,
  start_seconds numeric(10, 2) not null check (start_seconds >= 0),
  end_seconds numeric(10, 2) not null,
  speaker_label text,
  orthographic text,
  phonetic text,
  translation text,
  notes text,
  sort_order int not null default 0,
  check (end_seconds >= start_seconds)
);
create index audio_transcriptions_recording_idx on public.audio_transcriptions (recording_id, start_seconds);
