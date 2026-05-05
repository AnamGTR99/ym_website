import { getGPUTier } from "detect-gpu";

export type QualityTier = "full" | "high" | "medium" | "low" | "fallback";

export interface GPUProfile {
  tier: QualityTier;
  isMobile: boolean;
  gpuName: string;
  fps: number;
}

let cachedProfile: GPUProfile | null = null;

export async function detectGPUProfile(): Promise<GPUProfile> {
  if (cachedProfile) return cachedProfile;

  try {
    const result = await getGPUTier();

    const tierMap: Record<number, QualityTier> = {
      3: "full",
      2: "high",
      1: "medium",
      0: "fallback",
    };

    cachedProfile = {
      tier: tierMap[result.tier] ?? "medium",
      isMobile: result.isMobile ?? false,
      gpuName: result.gpu ?? "unknown",
      fps: result.fps ?? 30,
    };
  } catch {
    cachedProfile = {
      tier: "medium",
      isMobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
      gpuName: "detection-failed",
      fps: 30,
    };
  }

  return cachedProfile;
}

/**
 * Quick sync check for use inside components.
 * Returns the cached profile or a conservative default if detection hasn't run yet.
 */
export function getGPUProfile(): GPUProfile {
  return cachedProfile ?? {
    tier: "medium",
    isMobile: typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
    gpuName: "pending",
    fps: 30,
  };
}
