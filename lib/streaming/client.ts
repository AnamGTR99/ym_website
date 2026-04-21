/**
 * Client helper to fetch signed streaming URLs from our API.
 */

export interface StreamUrlResponse {
  url: string;
  expiresAt: number;
  preview: boolean;
  track: {
    id: string;
    title: string;
    artist: string;
    coverUrl: string | null;
    durationSeconds: number | null;
  };
}

export async function fetchStreamUrl(
  trackId: string
): Promise<StreamUrlResponse> {
  const res = await fetch(`/api/tracks/${trackId}/stream-url`);

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Rate limited — please wait before playing again");
    }
    if (res.status === 404) {
      throw new Error("Track not found");
    }
    if (res.status === 403) {
      throw new Error("Purchase required");
    }
    throw new Error("Failed to get streaming URL");
  }

  return res.json();
}
