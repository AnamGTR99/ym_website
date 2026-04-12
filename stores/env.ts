import { create } from "zustand";

type Scene = "landing" | "transition" | "room" | "tv" | "credits";

interface EnvState {
  currentScene: Scene;
  transitioning: boolean;
  showCredits: boolean;
  setScene: (scene: Scene) => void;
  startTransition: (to: Scene, onComplete: () => void) => void;
  openCredits: () => void;
  closeCredits: () => void;
}

const TRANSITION_DURATION = 3000; // ms

let transitionTimer: ReturnType<typeof setTimeout> | null = null;

export const useEnvStore = create<EnvState>((set) => ({
  currentScene: "landing",
  transitioning: false,
  showCredits: false,

  setScene: (scene) => set({ currentScene: scene }),

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
