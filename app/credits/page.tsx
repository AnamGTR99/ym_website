"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import WalkthroughNav from "@/components/ui/WalkthroughNav";
import CreditsOverlay from "@/components/env/CreditsOverlay";

export default function CreditsPage() {
  const router = useRouter();
  const handleClose = useCallback(() => router.push("/room"), [router]);

  return (
    <>
      <WalkthroughNav current="/credits" />
      <div className="relative w-full h-screen bg-void">
        <CreditsOverlay onClose={handleClose} />
      </div>
    </>
  );
}
