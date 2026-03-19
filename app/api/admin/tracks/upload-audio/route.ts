import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { detectMimeType, isValidAudioMime } from "@/lib/upload-validation";

export const maxDuration = 60;

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const trackId = formData.get("trackId") as string | null;

  if (!file || !trackId) {
    return NextResponse.json(
      { error: "File and trackId are required" },
      { status: 400 }
    );
  }

  if (!UUID_RE.test(trackId)) {
    return NextResponse.json(
      { error: "Invalid track ID" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 50MB.` },
      { status: 400 }
    );
  }

  // Verify actual file content via magic bytes (client-supplied type is spoofable)
  const detectedMime = await detectMimeType(file);
  if (!isValidAudioMime(detectedMime)) {
    return NextResponse.json(
      { error: "Invalid audio file. Upload a real MP3, AAC, or WAV file." },
      { status: 400 }
    );
  }

  const ext = detectedMime === "audio/wav"
    ? "wav"
    : detectedMime === "audio/aac" || detectedMime === "audio/mp4"
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

  // Update track record — cleanup uploaded file on failure
  const { error: updateError } = await admin
    .from("tracks")
    .update({ audio_path: path })
    .eq("id", trackId);

  if (updateError) {
    await admin.storage.from("audio").remove([path]);
    return NextResponse.json(
      { error: `Failed to update track record: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ path });
}
