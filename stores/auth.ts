import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  role: string | null;
  loading: boolean;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,

  initialize: () => {
    const supabase = createClient();

    // Fetch initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
          .then(({ data: profile }) => {
            set({ user, role: profile?.role ?? "user", loading: false });
          });
      } else {
        set({ user: null, role: null, loading: false });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;

      if (newUser) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", newUser.id)
          .single()
          .then(({ data: profile }) => {
            set({ user: newUser, role: profile?.role ?? "user", loading: false });
          });
      } else {
        set({ user: null, role: null, loading: false });
      }
    });

    // Return cleanup function
    return () => subscription.unsubscribe();
  },
}));
