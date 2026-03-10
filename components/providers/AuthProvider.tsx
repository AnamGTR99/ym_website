"use client";

import { useAuthInit } from "@/lib/auth/hooks";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthInit();
  return <>{children}</>;
}
