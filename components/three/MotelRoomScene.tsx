"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { useEnvStore } from "@/stores/env";

/* ================================================================== */
/*  CONFIG — tune everything from here when Bruno's final GLB lands   */
/* ================================================================== */

/** Path to the GLB file, served from /public. */
const GLB_PATH = "/models/room.glb";

/** Camera initial position + field of view. */
const CAMERA_CONFIG = {
  position: [0, 1.6, 2] as [number, number, number],
  fov: 55,
};

/** OrbitControls constraints — camera stays inside the room. */
const ORBIT_CONFIG = {
  enablePan: false,
  enableZoom: false,
  minPolarAngle: Math.PI / 3,
  maxPolarAngle: Math.PI / 2.1,
  minAzimuthAngle: -Math.PI / 4,
  maxAzimuthAngle: Math.PI / 4,
  target: [0, 1.4, -3] as [number, number, number],
  enableDamping: true,
  dampingFactor: 0.08,
};

/** Runtime lighting — warm amber lamp + cool teal fill + fog. */
const LIGHTING_CONFIG = {
  ambient: { intensity: 0.15, color: "#d4a853" },
  lampPoint: {
    position: [2.5, 2.2, -3] as [number, number, number],
    intensity: 8,
    color: "#d4a853",
    distance: 8,
    decay: 2,
  },
  fillDirectional: {
    position: [0, 3, 3] as [number, number, number],
    intensity: 0.3,
    color: "#6bc4c4",
  },
  fog: { color: "#050505", near: 5, far: 15 },
};

/**
 * Mesh-name → interaction mapping for the GLB room.
 * Bruno's brief locks these names: Room, TV, TV_Screen, Poster, Lamp.
 * To add more interactive meshes, just add them here — no other code changes.
 */
type InteractionAction = "navigate-tv" | "open-credits" | "none";

const INTERACTIVE_MESHES: Record<string, InteractionAction> = {
  TV: "navigate-tv",
  TV_Screen: "navigate-tv",
  Poster: "open-credits",
  // Lamp: "toggle-lamp", // reserved for future
};

/** GLB transform — apply if Bruno's scene needs global scale/offset. */
const GLB_TRANSFORM = {
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  scale: 1,
};

/* ================================================================== */
/*  GLB Room — loaded via useGLTF, click handlers via scene traverse  */
/* ================================================================== */

function GLBRoom() {
  const { scene } = useGLTF(GLB_PATH);
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const openCredits = useEnvStore((s) => s.openCredits);

  // Tag interactive meshes once the scene loads.
  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const action = INTERACTIVE_MESHES[obj.name];
      if (action) {
        obj.userData.interactionAction = action;
      }
    });
  }, [scene]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (transitioning) return;
    const action = e.object.userData.interactionAction as
      | InteractionAction
      | undefined;
    if (!action) return;

    if (action === "navigate-tv") {
      startTransition("tv", () => router.push("/tv"));
    } else if (action === "open-credits") {
      openCredits();
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (e.object.userData.interactionAction) {
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "default";
  };

  return (
    <primitive
      object={scene}
      position={GLB_TRANSFORM.position}
      rotation={GLB_TRANSFORM.rotation}
      scale={GLB_TRANSFORM.scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}

/* ================================================================== */
/*  Procedural Room — fallback when no GLB is present (e.g. prod     */
/*  before Bruno's file is committed, or local before drop)           */
/* ================================================================== */

function ProceduralRoom() {
  return (
    <group>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1410" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, 2, -5]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#2a1f18" roughness={1} />
      </mesh>
      <mesh position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#241a14" roughness={1} />
      </mesh>
      <mesh position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#241a14" roughness={1} />
      </mesh>
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#15100b" roughness={1} />
      </mesh>
      <mesh position={[-2.5, 0.4, -3]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.8, 4]} />
        <meshStandardMaterial color="#3a2820" roughness={0.8} />
      </mesh>
      <mesh position={[-2.5, 0.9, -3]} castShadow>
        <boxGeometry args={[2.4, 0.15, 3.9]} />
        <meshStandardMaterial color="#5a3a2a" roughness={0.7} />
      </mesh>
      <mesh position={[-1, 0.5, -4]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1, 0.6]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/*  Procedural Hotspots — TV + Lamp cubes for the fallback scene     */
/* ================================================================== */

interface HotspotProps {
  position: [number, number, number];
  args: [number, number, number];
  color: string;
  glowColor: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function Hotspot({ position, args, color, glowColor, label, onClick, disabled }: HotspotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const base = hovered ? 0.8 : 0.25;
    mat.emissiveIntensity = base + Math.sin(t * 2) * 0.08;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      castShadow
      userData={{ label }}
    >
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={glowColor}
        emissiveIntensity={0.25}
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );
}

/* ================================================================== */
/*  Room Content — branches GLB vs procedural based on file presence */
/* ================================================================== */

type GlbStatus = "loading" | "available" | "missing";

function RoomContent() {
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const openCredits = useEnvStore((s) => s.openCredits);

  const [glbStatus, setGlbStatus] = useState<GlbStatus>("loading");

  // Probe for the GLB file on mount. Graceful fallback if missing.
  useEffect(() => {
    let cancelled = false;
    fetch(GLB_PATH, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        setGlbStatus(res.ok ? "available" : "missing");
      })
      .catch(() => {
        if (!cancelled) setGlbStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTV = () => {
    if (transitioning) return;
    startTransition("tv", () => router.push("/tv"));
  };

  const handleLamp = () => {
    if (transitioning) return;
    openCredits();
  };

  // While probing, render nothing inside the canvas (overlay still shows loading)
  if (glbStatus === "loading") return null;

  if (glbStatus === "available") {
    return (
      <Suspense fallback={null}>
        <GLBRoom />
      </Suspense>
    );
  }

  // Missing → procedural fallback with click-cube hotspots
  return (
    <>
      <ProceduralRoom />
      <Hotspot
        position={[2.5, 1.4, -4.6]}
        args={[1.6, 1.2, 0.3]}
        color="#0a0a0a"
        glowColor="#4a9e9e"
        label="TV"
        onClick={handleTV}
        disabled={transitioning}
      />
      <Hotspot
        position={[2.5, 1.5, -4]}
        args={[0.25, 0.6, 0.25]}
        color="#d4a853"
        glowColor="#d4a853"
        label="Lamp"
        onClick={handleLamp}
        disabled={transitioning}
      />
    </>
  );
}

/* ================================================================== */
/*  Scene — shared lights + fog + orbit controls, wraps RoomContent  */
/* ================================================================== */

function Scene() {
  const L = LIGHTING_CONFIG;

  return (
    <>
      <ambientLight intensity={L.ambient.intensity} color={L.ambient.color} />
      <pointLight
        position={L.lampPoint.position}
        intensity={L.lampPoint.intensity}
        color={L.lampPoint.color}
        distance={L.lampPoint.distance}
        decay={L.lampPoint.decay}
        castShadow
      />
      <directionalLight
        position={L.fillDirectional.position}
        intensity={L.fillDirectional.intensity}
        color={L.fillDirectional.color}
      />
      <fog attach="fog" args={[L.fog.color, L.fog.near, L.fog.far]} />

      <RoomContent />

      <OrbitControls {...ORBIT_CONFIG} />
    </>
  );
}

/* ================================================================== */
/*  Canvas wrapper — client-only                                      */
/* ================================================================== */

export default function MotelRoomScene() {
  return (
    <Canvas
      shadows
      camera={{ position: CAMERA_CONFIG.position, fov: CAMERA_CONFIG.fov }}
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#050505" }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}

// Opportunistic preload — if the GLB ever 200s, parse it early.
// Safe when the file is missing: drei's useGLTF.preload swallows 404s.
useGLTF.preload(GLB_PATH);
