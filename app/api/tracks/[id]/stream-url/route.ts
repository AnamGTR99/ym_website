import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  getPublishedTrack,
  createSignedAudioUrl,
  hasEntitlement,
} from "@/lib/supabase/tracks";
import { createClient } from "@/lib/supabase/server";
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

  const trackMeta = {
    id: track.id,
    title: track.title,
    artist: track.artist,
    coverUrl: track.cover_url,
    durationSeconds: track.duration_seconds,
  };

  const responseHeaders = {
    "Cache-Control": "private, no-store",
    "X-RateLimit-Remaining": String(limit.remaining),
  };

  // Public tracks: full audio, no auth required
  if (track.access_type === "public") {
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
        preview: false,
        track: trackMeta,
      },
      { headers: responseHeaders }
    );
  }

  // one_off tracks: check auth + entitlement
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let entitled = false;
  if (user) {
    entitled = await hasEntitlement(user.id, trackId);
  }

  if (entitled) {
    // Entitled: full audio
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
        preview: false,
        track: trackMeta,
      },
      { headers: responseHeaders }
    );
  }

  // Not entitled: serve preview if available (no auth required for preview)
  if (track.preview_path) {
    const result = await createSignedAudioUrl(
      track.preview_path,
      SIGNED_URL_TTL
    );
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
        preview: true,
        track: trackMeta,
      },
      { headers: responseHeaders }
    );
  }

  // No preview available
  return NextResponse.json(
    { error: "Purchase required to access this track" },
    { status: 403 }
  );
}
