import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/aac",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
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
      { error: `Unsupported format: ${file.type}. Use MP3, AAC, or WAV.` },
      { status: 400 }
    );
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 50MB.` },
      { status: 400 }
    );
  }

  // Determine extension from MIME
  const ext = file.type.includes("wav")
    ? "wav"
    : file.type.includes("aac") || file.type === "audio/mp4"
      ? "aac"
      : "mp3";

  const path = `${trackId}.${ext}`;

  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("audio")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Update track record with audio_path
  const { error: updateError } = await admin
    .from("tracks")
    .update({ audio_path: path })
    .eq("id", trackId);

  if (updateError) {
    return NextResponse.json(
      { error: `Upload succeeded but failed to update track: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ path });
}
