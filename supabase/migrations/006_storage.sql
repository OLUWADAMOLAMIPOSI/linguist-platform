-- 006_storage.sql
-- Storage buckets and access policies.
-- Public buckets serve files by URL. Private buckets (linguistic-recordings, corpus-datasets)
-- are only reachable through short-lived signed URLs created by the server after checks.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('profile-images', 'profile-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('publication-documents', 'publication-documents', true, 26214400,
    array['application/pdf']),
  ('research-attachments', 'research-attachments', true, 26214400,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'text/csv',
          'application/zip',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('dictionary-audio', 'dictionary-audio', true, 10485760,
    array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/aac']),
  ('linguistic-recordings', 'linguistic-recordings', false, 52428800,
    array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/aac']),
  ('corpus-datasets', 'corpus-datasets', false, 52428800,
    array['text/plain', 'text/csv', 'application/json', 'application/zip', 'application/pdf']),
  ('media-library', 'media-library', true, 26214400,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf',
          'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only staff can upload, replace, list or delete objects in these buckets
create policy "staff manage site storage" on storage.objects
  for all to authenticated
  using (
    bucket_id in (
      'profile-images', 'publication-documents', 'research-attachments', 'dictionary-audio',
      'linguistic-recordings', 'corpus-datasets', 'media-library'
    )
    and public.is_staff()
  )
  with check (
    bucket_id in (
      'profile-images', 'publication-documents', 'research-attachments', 'dictionary-audio',
      'linguistic-recordings', 'corpus-datasets', 'media-library'
    )
    and public.is_staff()
  );
