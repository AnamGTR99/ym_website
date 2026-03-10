-- 007_storage_buckets.sql
-- Storage buckets for audio files and cover images

-- Private bucket for audio files (signed URLs only)
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

-- Public bucket for cover images
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Storage policies for covers bucket: anyone can read
create policy "Anyone can read covers"
  on storage.objects for select
  using (bucket_id = 'covers');

-- Storage policies for covers bucket: admins can upload
create policy "Admins can upload covers"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Storage policies for covers bucket: admins can delete
create policy "Admins can delete covers"
  on storage.objects for delete
  using (
    bucket_id = 'covers'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Storage policies for audio bucket: admins can upload
create policy "Admins can upload audio"
  on storage.objects for insert
  with check (
    bucket_id = 'audio'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Storage policies for audio bucket: admins can delete
create policy "Admins can delete audio"
  on storage.objects for delete
  using (
    bucket_id = 'audio'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- No public read on audio — server mints signed URLs via service role
