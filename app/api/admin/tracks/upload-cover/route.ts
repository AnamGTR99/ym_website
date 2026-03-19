import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { detectMimeType, isValidImageMime } from "@/lib/upload-validation";

export const maxDuration = 60;

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.` },
      { status: 400 }
    );
  }

  // Verify actual file content via magic bytes (client-supplied type is spoofable)
  const detectedMime = await detectMimeType(file);
  if (!isValidImageMime(detectedMime)) {
    return NextResponse.json(
      { error: "Invalid image file. Upload a real JPG, PNG, or WEBP file." },
      { status: 400 }
    );
  }

  const ext =
    detectedMime === "image/png" ? "png" : detectedMime === "image/webp" ? "webp" : "jpg";

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

  const { data: urlData } = admin.storage.from("covers").getPublicUrl(path);
  const coverUrl = urlData.publicUrl;

  // Update track record — cleanup uploaded file on failure
  const { error: updateError } = await admin
    .from("tracks")
    .update({ cover_url: coverUrl })
    .eq("id", trackId);

  if (updateError) {
    await admin.storage.from("covers").remove([path]);
    return NextResponse.json(
      { error: `Failed to update track record: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: coverUrl });
}
