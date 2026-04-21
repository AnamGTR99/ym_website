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
  preview_path: string | null;
  access_type: "public" | "one_off";
  published: boolean;
  created_at: string;
}

/**
 * Fetch a published track by ID.
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
 * Check if a user has an entitlement for a specific track.
 */
export async function hasEntitlement(
  userId: string,
  trackId: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("entitlements")
    .select("user_id")
    .eq("user_id", userId)
    .eq("track_id", trackId)
    .single();

  return !!data;
}

/** Lightweight track info safe to send to the client (no audio_path). */
export type TrackInfo = Pick<
  Track,
  "id" | "title" | "artist" | "cover_url" | "duration_seconds"
>;

/**
 * Fetch published tracks linked to a Shopify product via track_product_map.
 */
export async function getTracksByProductId(
  shopifyProductId: string
): Promise<TrackInfo[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("track_product_map")
    .select("track_id, tracks!inner(id, title, artist, cover_url, duration_seconds, published)")
    .eq("shopify_product_id", shopifyProductId);

  if (error) {
    console.error("[getTracksByProductId] error:", error.message, "productId:", shopifyProductId);
    return [];
  }
  if (!data) return [];

  type JoinRow = {
    tracks: {
      id: string;
      title: string;
      artist: string;
      cover_url: string | null;
      duration_seconds: number | null;
      published: boolean;
    };
  };

  return (data as unknown as JoinRow[])
    .filter((row) => row.tracks.published)
    .map((row) => ({
      id: row.tracks.id,
      title: row.tracks.title,
      artist: row.tracks.artist,
      cover_url: row.tracks.cover_url,
      duration_seconds: row.tracks.duration_seconds,
    }));
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
