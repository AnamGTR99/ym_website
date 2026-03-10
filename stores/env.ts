import { create } from "zustand";

type Scene = "landing" | "transition" | "room" | "tv" | "credits";

interface EnvState {
  currentScene: Scene;
  transitioning: boolean;
  setScene: (scene: Scene) => void;
  startTransition: (to: Scene, onComplete: () => void) => void;
}

const TRANSITION_DURATION = 1200; // ms

export const useEnvStore = create<EnvState>((set) => ({
  currentScene: "landing",
  transitioning: false,

  setScene: (scene) => set({ currentScene: scene }),

  startTransition: (to, onComplete) => {
    set({ transitioning: true });
    setTimeout(() => {
      set({ currentScene: to, transitioning: false });
      onComplete();
    }, TRANSITION_DURATION);
  },
}));
