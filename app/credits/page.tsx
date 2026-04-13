"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreditsOverlay from "@/components/env/CreditsOverlay";

export default function CreditsPage() {
  const router = useRouter();
  const [entered, setEntered] = useState(false);

  // Fade in from black on mount. The room → credits transition leaves
  // the screen fully opaque-black right as this page mounts, so we
  // start at opacity 0 and lerp to 1 to cover the navigation seam.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = useCallback(() => router.push("/room"), [router]);

  return (
    <div
      className="relative w-full h-screen bg-void"
      style={{
        opacity: entered ? 1 : 0,
        transition: "opacity 900ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <CreditsOverlay onClose={handleClose} />
    </div>
  );
}
