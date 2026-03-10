import { create } from "zustand";
import { fetchStreamUrl } from "@/lib/streaming/client";

// Refresh signed URL 30 seconds before expiry
const REFRESH_BUFFER_MS = 30 * 1000;

interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  durationSeconds: number | null;
}

interface MusicState {
  // Current track
  currentTrack: TrackInfo | null;
  signedUrl: string | null;
  expiresAt: number | null;

  // Playback
  isPlaying: boolean;
  progress: number; // seconds
  duration: number; // seconds
  volume: number; // 0–1
  muted: boolean;
  buffering: boolean;

  // Error
  error: string | null;

  // Actions
  playTrack: (trackId: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setProgress: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setBuffering: (buffering: boolean) => void;
  stop: () => void;
  retryUrl: () => Promise<void>;
  clearError: () => void;
}

// Singleton audio element — created once, reused across tracks
let audioElement: HTMLAudioElement | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioElement && typeof window !== "undefined") {
    audioElement = new Audio();
    audioElement.preload = "auto";
  }
  return audioElement!;
}

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  signedUrl: null,
  expiresAt: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  muted: false,
  buffering: false,
  error: null,

  playTrack: async (trackId: string) => {
    const { currentTrack } = get();

    // If same track, just resume
    if (currentTrack?.id === trackId) {
      get().resume();
      return;
    }

    // Stop current playback
    const audio = getAudio();
    audio.pause();
    clearRefreshTimer();

    set({
      buffering: true,
      error: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
    });

    try {
      const data = await fetchStreamUrl(trackId);

      set({
        currentTrack: data.track,
        signedUrl: data.url,
        expiresAt: data.expiresAt,
      });

      // Set audio source and play
      audio.src = data.url;
      audio.volume = get().muted ? 0 : get().volume;

      await audio.play();
      set({ isPlaying: true, buffering: false });

      // Schedule URL refresh
      scheduleRefresh(trackId, data.expiresAt);
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to play track",
        buffering: false,
        currentTrack: null,
        signedUrl: null,
        expiresAt: null,
      });
    }
  },

  pause: () => {
    getAudio().pause();
    set({ isPlaying: false });
  },

  resume: () => {
    const audio = getAudio();
    if (audio.src) {
      audio.play().then(() => set({ isPlaying: true })).catch(() => {
        set({ error: "Playback failed — browser may require interaction" });
      });
    }
  },

  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().resume();
    }
  },

  seek: (seconds: number) => {
    const audio = getAudio();
    if (audio.src && isFinite(seconds)) {
      audio.currentTime = seconds;
      set({ progress: seconds });
    }
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    const audio = getAudio();
    audio.volume = get().muted ? 0 : clamped;
    set({ volume: clamped });
  },

  toggleMute: () => {
    const { muted, volume } = get();
    const audio = getAudio();
    const newMuted = !muted;
    audio.volume = newMuted ? 0 : volume;
    set({ muted: newMuted });
  },

  setProgress: (seconds: number) => set({ progress: seconds }),
  setDuration: (seconds: number) => set({ duration: seconds }),
  setBuffering: (buffering: boolean) => set({ buffering }),

  stop: () => {
    const audio = getAudio();
    audio.pause();
    audio.src = "";
    clearRefreshTimer();
    set({
      currentTrack: null,
      signedUrl: null,
      expiresAt: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
      buffering: false,
      error: null,
    });
  },

  retryUrl: async () => {
    const { currentTrack } = get();
    if (!currentTrack) return;

    set({ error: null, buffering: true });

    try {
      const data = await fetchStreamUrl(currentTrack.id);
      const audio = getAudio();
      const wasPlaying = get().isPlaying;
      const currentTime = audio.currentTime;

      set({
        signedUrl: data.url,
        expiresAt: data.expiresAt,
      });

      audio.src = data.url;
      audio.currentTime = currentTime;

      if (wasPlaying) {
        await audio.play();
        set({ isPlaying: true });
      }

      set({ buffering: false });
      scheduleRefresh(currentTrack.id, data.expiresAt);
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to refresh URL",
        buffering: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

/**
 * Schedule a signed URL refresh before expiry.
 */
function scheduleRefresh(trackId: string, expiresAt: number) {
  clearRefreshTimer();

  const delay = expiresAt - Date.now() - REFRESH_BUFFER_MS;
  if (delay <= 0) {
    // Already past refresh window — refresh immediately
    refreshUrl(trackId);
    return;
  }

  refreshTimer = setTimeout(() => refreshUrl(trackId), delay);
}

async function refreshUrl(trackId: string) {
  const store = useMusicStore.getState();

  // Only refresh if still playing the same track
  if (store.currentTrack?.id !== trackId) return;

  try {
    const data = await fetchStreamUrl(trackId);
    const audio = getAudio();
    const currentTime = audio.currentTime;
    const wasPlaying = store.isPlaying;

    useMusicStore.setState({
      signedUrl: data.url,
      expiresAt: data.expiresAt,
    });

    // Swap source seamlessly
    audio.src = data.url;
    audio.currentTime = currentTime;
    if (wasPlaying) {
      await audio.play();
    }

    scheduleRefresh(trackId, data.expiresAt);
  } catch {
    useMusicStore.setState({
      error: "Stream URL expired — tap retry to continue",
    });
  }
}
