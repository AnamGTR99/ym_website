"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { useEnvStore } from "@/stores/env";

/* ================================================================== */
/*  CONFIG — tune everything from here when the GLB drops             */
/* ================================================================== */

/** Path to the GLB file, served from /public. */
const GLB_PATH = "/models/room.glb";

/**
 * Draco decoder path — bundled locally under /public/draco/.
 * Avoids CSP issues from fetching gstatic.com at runtime.
 * drei's useGLTF will use this for any Draco-compressed meshes.
 */
const DRACO_PATH = "/draco/";

/**
 * Camera presets — flip these if Bruno's model is facing a different axis.
 *
 * Blender's default "front" is +Y (looking down -Y), and glTF exports with
 * Z-up → Y-up conversion. Bruno set the scene to face +X in Blender, which
 * after conversion should still point the front toward +X in Three.js.
 * If the model shows up sideways or we can't find it, flip ACTIVE_CAMERA
 * to LOOK_AT_Y or LOOK_AT_Z.
 *
 * The camera sits at `position` and looks at `target`. Up is +Y.
 */
const CAMERA_PRESETS = {
  /** Front of model faces +X → camera on +X axis looking back toward origin */
  LOOK_AT_X: {
    position: [15, 4, 0] as [number, number, number],
    target: [0, 1.5, 0] as [number, number, number],
  },
  /** Front of model faces +Z → camera on +Z axis */
  LOOK_AT_Z: {
    position: [0, 4, 15] as [number, number, number],
    target: [0, 1.5, 0] as [number, number, number],
  },
  /** Top-down view — useful if we can't find the model */
  LOOK_AT_Y: {
    position: [0, 20, 0.01] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
  },
  /** Classic front-Z negative (Three.js default) */
  LOOK_AT_NEG_Z: {
    position: [0, 4, -15] as [number, number, number],
    target: [0, 1.5, 0] as [number, number, number],
  },
} as const;

/** Active camera — flip this line if the model is facing a different axis. */
const ACTIVE_CAMERA = CAMERA_PRESETS.LOOK_AT_X;

/** Camera field of view. Widen for very large scenes, narrow for tight framing. */
const CAMERA_FOV = 50;

/**
 * OrbitControls — unlocked for debug / exploration of a new GLB.
 * Re-lock (set enablePan/enableZoom false + polar/azimuth constraints)
 * once we know the final camera framing and scale.
 */
const ORBIT_CONFIG = {
  enablePan: true,
  enableZoom: true,
  minDistance: 0.5,
  maxDistance: 100,
  target: ACTIVE_CAMERA.target,
  enableDamping: true,
  dampingFactor: 0.08,
  makeDefault: true,
} as const;

/** Runtime lighting. Disable individual lights if Bruno baked them in. */
const LIGHTING_CONFIG = {
  ambient: { intensity: 0.35, color: "#ffffff" },
  lampPoint: {
    position: [2.5, 2.5, -3] as [number, number, number],
    intensity: 12,
    color: "#d4a853",
    distance: 12,
    decay: 2,
  },
  keyDirectional: {
    position: [8, 10, 4] as [number, number, number],
    intensity: 0.6,
    color: "#ffffff",
  },
  fillDirectional: {
    position: [-6, 5, 4] as [number, number, number],
    intensity: 0.3,
    color: "#6bc4c4",
  },
  fog: { color: "#050505", near: 15, far: 80 },
} as const;

/**
 * Post-processing — bloom + grain + vignette baked into the WebGL render.
 * These layer on top of the CSS grain/vignette overlays in RoomEnvironment
 * (intentional — WebGL post gives us HDR bloom; CSS gives us film-grade
 * vignette falloff).
 */
const POST_CONFIG = {
  bloom: {
    intensity: 0.9,
    luminanceThreshold: 0.7,
    luminanceSmoothing: 0.35,
    mipmapBlur: true,
    kernelSize: KernelSize.LARGE,
  },
  noise: {
    opacity: 0.18,
    premultiply: false,
    blendFunction: BlendFunction.MULTIPLY,
  },
  vignette: {
    offset: 0.32,
    darkness: 0.7,
    blendFunction: BlendFunction.NORMAL,
  },
} as const;

/**
 * Mesh-name → interaction mapping for Bruno's GLB.
 * Brief locks these: Room, TV, TV_Screen, Poster, Lamp.
 * Add more interactive meshes here without touching any other code.
 */
type InteractionAction = "navigate-tv" | "open-credits" | "none";

const INTERACTIVE_MESHES: Record<string, InteractionAction> = {
  TV: "navigate-tv",
  TV_Screen: "navigate-tv",
  Poster: "open-credits",
  // Lamp: "toggle-lamp", // reserved
};

/** GLB global transform — apply if Bruno's scene needs scale/offset. */
const GLB_TRANSFORM = {
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  scale: 1,
} as const;

/* ================================================================== */
/*  GLB Room — loaded via useGLTF with Draco support                  */
/* ================================================================== */

function GLBRoom() {
  const { scene } = useGLTF(GLB_PATH, DRACO_PATH);
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const openCredits = useEnvStore((s) => s.openCredits);

  // Tag interactive meshes + log scene graph for debugging
  useEffect(() => {
    const meshNames: string[] = [];
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshNames.push(obj.name);
        const action = INTERACTIVE_MESHES[obj.name];
        if (action) obj.userData.interactionAction = action;
      }
    });
    if (typeof window !== "undefined") {
      console.log("[MotelRoom GLB] meshes:", meshNames);
      const bbox = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bbox.getSize(size);
      bbox.getCenter(center);
      console.log(
        "[MotelRoom GLB] bbox size:",
        size.toArray().map((n) => n.toFixed(2)),
        "center:",
        center.toArray().map((n) => n.toFixed(2))
      );
    }
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
/*  Procedural Room fallback — shown when /models/room.glb is missing */
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
/*  Room Content — probes for GLB, branches GLB vs procedural         */
/* ================================================================== */

type GlbStatus = "loading" | "available" | "missing";

function RoomContent() {
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const openCredits = useEnvStore((s) => s.openCredits);

  const [glbStatus, setGlbStatus] = useState<GlbStatus>("loading");

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

  if (glbStatus === "loading") return null;

  if (glbStatus === "available") {
    return (
      <Suspense fallback={null}>
        <GLBRoom />
      </Suspense>
    );
  }

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
/*  Scene — lights, fog, content, orbit, post-processing stack       */
/* ================================================================== */

function Scene() {
  const L = LIGHTING_CONFIG;
  const P = POST_CONFIG;

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
        position={L.keyDirectional.position}
        intensity={L.keyDirectional.intensity}
        color={L.keyDirectional.color}
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

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={P.bloom.intensity}
          luminanceThreshold={P.bloom.luminanceThreshold}
          luminanceSmoothing={P.bloom.luminanceSmoothing}
          mipmapBlur={P.bloom.mipmapBlur}
          kernelSize={P.bloom.kernelSize}
        />
        <Noise
          opacity={P.noise.opacity}
          premultiply={P.noise.premultiply}
          blendFunction={P.noise.blendFunction}
        />
        <Vignette
          offset={P.vignette.offset}
          darkness={P.vignette.darkness}
          blendFunction={P.vignette.blendFunction}
        />
      </EffectComposer>
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
      camera={{ position: ACTIVE_CAMERA.position, fov: CAMERA_FOV }}
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{ antialias: false, alpha: false }}
      style={{ background: "#050505" }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}

// Opportunistic preload — if /models/room.glb exists, parse it early.
// drei's useGLTF.preload swallows 404s so this is safe in all envs.
useGLTF.preload(GLB_PATH, DRACO_PATH);
