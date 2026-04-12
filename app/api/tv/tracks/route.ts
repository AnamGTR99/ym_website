import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Public endpoint — no auth required. Returns published tracks.
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tracks")
      .select("id, title, artist, duration_seconds, cover_url")
      .eq("published", true)
      .order("title");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
