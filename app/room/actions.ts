"use server";

import { createAdminClient } from "@/lib/supabase/server";

export interface TVProduct {
  id: string;
  title: string;
  handle: string;
  price: string;
  imageUrl: string | null;
}

export interface TVTrack {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number | null;
  coverUrl: string | null;
}

/**
 * Fetch products for the TV shop channel.
 * Reads from product_cache (Supabase), not Shopify API.
 */
export async function getShopProducts(): Promise<TVProduct[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("product_cache")
      .select("shopify_id, title, handle, price, image_url")
      .order("title");

    if (error || !data) return [];

    return data.map((p) => ({
      id: p.shopify_id,
      title: p.title,
      handle: p.handle,
      price: p.price ?? "0.00",
      imageUrl: p.image_url,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch published tracks for the TV music channel.
 */
export async function getMusicTracks(): Promise<TVTrack[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tracks")
      .select("id, title, artist, duration_seconds, cover_url")
      .eq("published", true)
      .order("title");

    if (error || !data) return [];

    return data.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      durationSeconds: t.duration_seconds,
      coverUrl: t.cover_url,
    }));
  } catch {
    return [];
  }
}
