"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
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

  const admin = createAdminClient();
  const { error } = await admin
    .from("tracks")
    .update({ published })
    .eq("id", trackId);

  if (error) throw new Error("Failed to update track");

  revalidatePath("/admin/tracks");
}

export interface TrackFormData {
  title: string;
  artist: string;
  description: string;
  release_date: string;
  access_type: "public" | "subscriber" | "one_off" | "hybrid";
  published: boolean;
  duration_seconds: number | null;
  audio_path: string;
  cover_url: string;
  product_ids: string[];
}

export async function createTrack(data: TrackFormData) {
  await verifyAdmin();

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

  // Insert product associations
  if (data.product_ids.length > 0) {
    const mappings = data.product_ids.map((pid) => ({
      track_id: track.id,
      shopify_product_id: pid,
    }));

    const { error: mapError } = await admin
      .from("track_product_map")
      .insert(mappings);

    if (mapError) throw new Error("Track created but failed to link products");
  }

  revalidatePath("/admin/tracks");
  return track.id;
}

export async function updateTrack(trackId: string, data: TrackFormData) {
  await verifyAdmin();

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

  // Replace product associations — delete old, insert new
  const { error: deleteError } = await admin
    .from("track_product_map")
    .delete()
    .eq("track_id", trackId);

  if (deleteError) throw new Error("Failed to update product links");

  if (data.product_ids.length > 0) {
    const mappings = data.product_ids.map((pid) => ({
      track_id: trackId,
      shopify_product_id: pid,
    }));

    const { error: mapError } = await admin
      .from("track_product_map")
      .insert(mappings);

    if (mapError) throw new Error("Track updated but failed to link products");
  }

  revalidatePath("/admin/tracks");
}
