-- OPTIONAL starter content (not a migration).
-- Everything here is generic scaffolding or clearly marked [DEMO] so you can delete it.
-- No personal information, publications, research findings or language data is invented:
-- add your own through the admin dashboard.

insert into public.blog_categories (name, slug, description) values
  ('Linguistic Articles', 'linguistic-articles', 'Articles on language and linguistics'),
  ('Research Updates', 'research-updates', 'Progress notes on ongoing research'),
  ('Book and Journal Reviews', 'reviews', 'Reviews of academic books and journals'),
  ('Reflections', 'reflections', 'Research reflections and academic discussion')
on conflict (slug) do nothing;

insert into public.seo_pages (path, title, description) values
  ('/', null, null),
  ('/about', 'About', null),
  ('/research', 'Research', null),
  ('/publications', 'Publications', null),
  ('/blog', 'Linguistic Insights', null),
  ('/contact', 'Contact', null)
on conflict (path) do nothing;

-- Demonstration interlinear gloss: a standard Turkish textbook example for showing the layout.
-- Delete it once you add your own examples.
insert into public.interlinear_glosses (source_text, segmentation, gloss, free_translation, notes, reference, is_published)
values (
  'evlerimizde',
  'ev-ler-imiz-de',
  'house-PL-1PL.POSS-LOC',
  '[DEMO] in our houses',
  'Demonstration entry showing Leipzig-style alignment. Not part of the researcher''s data.',
  'Demonstration only',
  false
);
