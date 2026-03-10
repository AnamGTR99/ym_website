import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPublishedTrack, createSignedAudioUrl } from "@/lib/supabase/tracks";
import { rateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const SIGNED_URL_TTL = 120; // seconds

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trackId } = await params;

  // Rate limit by IP
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0].trim() ?? "unknown";

  const limit = rateLimit(`stream:${ip}`, {
    maxRequests: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.resetMs / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trackId)) {
    return NextResponse.json({ error: "Invalid track ID" }, { status: 400 });
  }

  // Fetch track
  const track = await getPublishedTrack(trackId);
  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Generate signed URL
  const result = await createSignedAudioUrl(track.audio_path, SIGNED_URL_TTL);
  if (!result) {
    return NextResponse.json(
      { error: "Failed to generate streaming URL" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      url: result.signedUrl,
      expiresAt: result.expiresAt,
      track: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverUrl: track.cover_url,
        durationSeconds: track.duration_seconds,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-RateLimit-Remaining": String(limit.remaining),
      },
    }
  );
}
