import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: NextRequest) {
  // Verify admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const trackId = formData.get("trackId") as string | null;

  if (!file || !trackId) {
    return NextResponse.json(
      { error: "File and trackId are required" },
      { status: 400 }
    );
  }

  // Validate trackId is a UUID to prevent path traversal
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(trackId)) {
    return NextResponse.json(
      { error: "Invalid track ID" },
      { status: 400 }
    );
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported format: ${file.type}. Use JPG, PNG, or WEBP.` },
      { status: 400 }
    );
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.` },
      { status: 400 }
    );
  }

  const ext = file.type === "image/png"
    ? "png"
    : file.type === "image/webp"
      ? "webp"
      : "jpg";

  const path = `${trackId}.${ext}`;

  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("covers")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Get public URL for the cover
  const { data: urlData } = admin.storage
    .from("covers")
    .getPublicUrl(path);

  const coverUrl = urlData.publicUrl;

  // Update track record with cover_url
  const { error: updateError } = await admin
    .from("tracks")
    .update({ cover_url: coverUrl })
    .eq("id", trackId);

  if (updateError) {
    return NextResponse.json(
      { error: `Upload succeeded but failed to update track: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: coverUrl });
}
