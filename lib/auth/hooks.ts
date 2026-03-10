"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

/**
 * Initialize auth listener. Call once in a root client component (e.g. AuthProvider).
 */
export function useAuthInit() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);
}

/**
 * Returns the current user or null. Non-blocking — returns null while loading.
 */
export function useUser() {
  return useAuthStore((s) => s.user);
}

/**
 * Returns true if the current user has the admin role.
 */
export function useIsAdmin() {
  return useAuthStore((s) => s.role === "admin");
}

/**
 * Returns true while auth state is being resolved.
 */
export function useAuthLoading() {
  return useAuthStore((s) => s.loading);
}
