"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import CreditsOverlay from "@/components/env/CreditsOverlay";

export default function CreditsPage() {
  const router = useRouter();
  const handleClose = useCallback(() => router.push("/room"), [router]);

  return (
    <div className="relative w-full h-screen bg-void">
      <CreditsOverlay onClose={handleClose} />
    </div>
  );
}
