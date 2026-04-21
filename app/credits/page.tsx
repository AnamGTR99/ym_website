"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CreditsOverlay from "@/components/env/CreditsOverlay";
import VHSTransition from "@/components/env/VHSTransition";

export default function CreditsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // The CreditsOverlay renders its own <video>. We probe the same
  // source independently to know when it has buffered enough to play.
  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/video/bayou-bg-web.mp4";
    video.preload = "auto";
    video.muted = true;
    videoRef.current = video;

    const onCanPlay = () => setReady(true);
    video.addEventListener("canplay", onCanPlay);

    // Fallback: if video stalls, still show credits after 4s
    const fallback = setTimeout(() => setReady(true), 4000);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      clearTimeout(fallback);
      video.src = "";
      video.load();
    };
  }, []);

  const handleClose = useCallback(() => router.push("/room"), [router]);

  return (
    <div className="relative w-full h-screen bg-void">
      <CreditsOverlay onClose={handleClose} />
      <VHSTransition ready={ready} />
    </div>
  );
}
