import { create } from "zustand";

type Scene = "landing" | "transition" | "room" | "tv" | "credits";

interface EnvState {
  currentScene: Scene;
  transitioning: boolean;
  showCredits: boolean;
  // True when the user has zoomed the room camera onto the CRT. Used
  // by GlobalAudioPlayer / FloatingUI to get out of the way while the
  // in-CRT UI takes over.
  tvZoomed: boolean;
  setScene: (scene: Scene) => void;
  /**
   * Fade to black, then run `onComplete` (which typically navigates).
   * Defaults to 3000ms — matches the landing → room transition where
   * the room needs time to start loading the GLB. Pass a shorter
   * duration (e.g. 1100) for in-scene transitions like room → credits.
   */
  startTransition: (
    to: Scene,
    onComplete: () => void,
    durationMs?: number
  ) => void;
  openCredits: () => void;
  closeCredits: () => void;
  setTvZoomed: (v: boolean) => void;
  sceneReady: boolean;
  setSceneReady: (v: boolean) => void;
}

const DEFAULT_TRANSITION_DURATION = 3000; // ms

let transitionTimer: ReturnType<typeof setTimeout> | null = null;

export const useEnvStore = create<EnvState>((set) => ({
  currentScene: "landing",
  transitioning: false,
  showCredits: false,
  tvZoomed: false,
  sceneReady: false,

  setScene: (scene) => set({ currentScene: scene }),
  setTvZoomed: (v) => set({ tvZoomed: v }),
  setSceneReady: (v) => set({ sceneReady: v }),

  startTransition: (to, onComplete, durationMs = DEFAULT_TRANSITION_DURATION) => {
    // Clear any in-flight transition timer
    if (transitionTimer) clearTimeout(transitionTimer);
    set({ transitioning: true });
    transitionTimer = setTimeout(() => {
      transitionTimer = null;
      set({ currentScene: to, transitioning: false });
      onComplete();
    }, durationMs);
  },

  openCredits: () => set({ showCredits: true }),
  closeCredits: () => set({ showCredits: false }),
}));
