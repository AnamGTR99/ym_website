"use server";

import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const trackSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  artist: z.string().min(1, "Artist is required").max(200),
  description: z.string().max(5000).optional().default(""),
  release_date: z.string().optional().default(""),
  access_type: z.enum(["public", "subscriber", "one_off", "hybrid"]),
  published: z.boolean(),
  duration_seconds: z.number().int().positive().nullable(),
  audio_path: z.string().optional().default(""),
  cover_url: z.string().optional().default(""),
  product_ids: z.array(z.string()).default([]),
});

export type TrackFormData = z.infer<typeof trackSchema>;

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
}

export async function toggleTrackPublished(
  trackId: string,
  published: boolean
) {
  await verifyAdmin();

  if (!UUID_RE.test(trackId)) throw new Error("Invalid track ID");

  const admin = createAdminClient();
  const { error } = await admin
    .from("tracks")
    .update({ published })
    .eq("id", trackId);

  if (error) throw new Error("Failed to update track");

  revalidatePath("/admin/tracks");
}

export async function createTrack(input: TrackFormData) {
  await verifyAdmin();

  const data = trackSchema.parse(input);
  const admin = createAdminClient();

  const { data: track, error } = await admin
    .from("tracks")
    .insert({
      title: data.title,
      artist: data.artist,
      description: data.description || null,
      release_date: data.release_date || null,
      access_type: data.access_type,
      published: data.published,
      duration_seconds: data.duration_seconds,
      audio_path: data.audio_path || "pending",
      cover_url: data.cover_url || null,
    })
    .select("id")
    .single();

  if (error || !track) throw new Error("Failed to create track");

  // Atomically set product associations via RPC
  if (data.product_ids.length > 0) {
    const { error: rpcError } = await admin.rpc("replace_track_products", {
      p_track_id: track.id,
      p_product_ids: data.product_ids,
    });

    if (rpcError) {
      // Clean up orphaned track if product mapping failed
      await admin.from("tracks").delete().eq("id", track.id);
      throw new Error("Failed to create track: product linking failed");
    }
  }

  revalidatePath("/admin/tracks");
  return track.id;
}

export async function updateTrack(trackId: string, input: TrackFormData) {
  await verifyAdmin();

  if (!UUID_RE.test(trackId)) throw new Error("Invalid track ID");

  const data = trackSchema.parse(input);
  const admin = createAdminClient();

  const { error } = await admin
    .from("tracks")
    .update({
      title: data.title,
      artist: data.artist,
      description: data.description || null,
      release_date: data.release_date || null,
      access_type: data.access_type,
      published: data.published,
      duration_seconds: data.duration_seconds,
      audio_path: data.audio_path || "pending",
      cover_url: data.cover_url || null,
    })
    .eq("id", trackId);

  if (error) throw new Error("Failed to update track");

  // Atomically replace product associations via RPC
  const { error: rpcError } = await admin.rpc("replace_track_products", {
    p_track_id: trackId,
    p_product_ids: data.product_ids,
  });

  if (rpcError) throw new Error("Track updated but failed to link products");

  revalidatePath("/admin/tracks");
}
