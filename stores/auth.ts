import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  role: string | null;
  loading: boolean;
  initialize: () => () => void;
}

let initialized = false;
let cleanup: (() => void) | null = null;

async function fetchRole(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  userId: string
): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    return profile?.role ?? "user";
  } catch {
    return "user";
  }
}

const noop = () => {};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,

  initialize: () => {
    if (initialized && cleanup) return cleanup;
    initialized = true;

    const supabase = createClient();

    if (!supabase) {
      set({ user: null, role: null, loading: false });
      cleanup = noop;
      return noop;
    }

    // Fetch initial session with error handling
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (user) {
          const role = await fetchRole(supabase, user.id);
          set({ user, role, loading: false });
        } else {
          set({ user: null, role: null, loading: false });
        }
      })
      .catch(() => {
        set({ user: null, role: null, loading: false });
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;

      if (newUser) {
        const role = await fetchRole(supabase, newUser.id);
        set({ user: newUser, role, loading: false });
      } else {
        set({ user: null, role: null, loading: false });
      }
    });

    cleanup = () => subscription.unsubscribe();
    return cleanup;
  },
}));
