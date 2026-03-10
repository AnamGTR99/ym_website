import { createAdminClient } from "./server";

export interface Track {
  id: string;
  title: string;
  artist: string;
  description: string | null;
  release_date: string | null;
  duration_seconds: number | null;
  cover_url: string | null;
  audio_path: string;
  access_type: "public" | "subscriber" | "one_off" | "hybrid";
  published: boolean;
  created_at: string;
}

/**
 * Fetch a published track by ID.
 * Uses admin client to bypass RLS (for service-level access).
 */
export async function getPublishedTrack(
  trackId: string
): Promise<Track | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .eq("id", trackId)
    .eq("published", true)
    .single();

  if (error || !data) return null;
  return data as Track;
}

/**
 * Generate a signed URL for a track's audio file.
 * The audio bucket is private — signed URLs are the only access path.
 */
export async function createSignedAudioUrl(
  audioPath: string,
  expiresIn = 120
): Promise<{ signedUrl: string; expiresAt: number } | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from("audio")
    .createSignedUrl(audioPath, expiresIn);

  if (error || !data?.signedUrl) return null;

  return {
    signedUrl: data.signedUrl,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}
