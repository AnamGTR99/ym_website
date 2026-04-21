-- 013_preview_path.sql
-- Add preview_path column to tracks for 30-60 second preview clips

alter table public.tracks
  add column preview_path text;

comment on column public.tracks.preview_path is
  'Path to preview audio clip in Supabase Storage audio bucket (30-60s). Nullable.';
