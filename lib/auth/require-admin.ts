import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Independent admin check for Server Components.
 * Redirects to sign-in or home if not an admin.
 * Use this in every admin page — do not rely solely on layout guard.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }
}
