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
  startTransition: (to: Scene, onComplete: () => void) => void;
  openCredits: () => void;
  closeCredits: () => void;
  setTvZoomed: (v: boolean) => void;
}

const TRANSITION_DURATION = 3000; // ms

let transitionTimer: ReturnType<typeof setTimeout> | null = null;

export const useEnvStore = create<EnvState>((set) => ({
  currentScene: "landing",
  transitioning: false,
  showCredits: false,
  tvZoomed: false,

  setScene: (scene) => set({ currentScene: scene }),
  setTvZoomed: (v) => set({ tvZoomed: v }),

  startTransition: (to, onComplete) => {
    // Clear any in-flight transition timer
    if (transitionTimer) clearTimeout(transitionTimer);
    set({ transitioning: true });
    transitionTimer = setTimeout(() => {
      transitionTimer = null;
      set({ currentScene: to, transitioning: false });
      onComplete();
    }, TRANSITION_DURATION);
  },

  openCredits: () => set({ showCredits: true }),
  closeCredits: () => set({ showCredits: false }),
}));
