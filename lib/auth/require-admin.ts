import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Independent admin check for Server Components.
 * Redirects to sign-in or home if not an admin.
 * Uses service-role client for the profile query to bypass RLS edge
 * cases where the session token is valid but the anon-key profile
 * read fails due to cookie propagation timing in Next.js 16 proxy.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirect=/admin");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }
}
