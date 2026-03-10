"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleTrackPublished(
  trackId: string,
  published: boolean
) {
  // Verify the caller is an admin
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

  // Use admin client to bypass RLS for the update
  const admin = createAdminClient();
  const { error } = await admin
    .from("tracks")
    .update({ published })
    .eq("id", trackId);

  if (error) throw new Error("Failed to update track");

  revalidatePath("/admin/tracks");
}
