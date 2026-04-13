"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  ContactShadows,
  Html,
  OrbitControls,
  Preload,
  useGLTF,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  BrightnessContrast,
  DepthOfField,
  N8AO,
  Noise,
  Outline,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { SplitToningEffect } from "./SplitToningEffect";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { RGBELoader } from "three-stdlib";
import { create } from "zustand";
import { useEnvStore } from "@/stores/env";
import { useMusicStore, getAudioElement } from "@/stores/music";
import ModelViewer from "./ModelViewer";

/* ================================================================== */
/*  DEBUG STORE — toggles + sliders for live tuning                   */
/* ================================================================== */

interface DebugState {
  open: boolean;
  bloom: boolean;
  noise: boolean;
  vignette: boolean;
  splitToning: boolean;
  smaa: boolean;
  hdr: boolean;
  ao: boolean;
  colorGrade: boolean;
  exposure: number;
  ambient: number;
  lamp: number;
  tvGlow: number;
  hdrIntensity: number;
  glbLight: number;
  purpleLight: number;
  toggle: (key: "bloom" | "noise" | "vignette" | "splitToning" | "smaa" | "hdr" | "ao" | "colorGrade") => void;
  set: (key: "exposure" | "ambient" | "lamp" | "tvGlow" | "hdrIntensity" | "glbLight" | "purpleLight", val: number) => void;
}

const useDebug = create<DebugState>((setState, getState) => ({
  open: false,
  bloom: true,
  noise: true,
  vignette: true,
  splitToning: true,
  smaa: true,
  hdr: true,
  ao: false,
  colorGrade: false,
  exposure: 1.55,
  ambient: 0.85,
  lamp: 14,
  tvGlow: 0.35,
  glbLight: 240,
  hdrIntensity: 0.28,
  purpleLight: 2.4,
  toggle: (key) => setState({ [key]: !getState()[key] }),
  set: (key, val) => setState({ [key]: val }),
}));

/* ================================================================== */
/*  HOVER STORE — which interactive target the cursor is currently on */
/* ================================================================== */

type HoverTarget = "tv" | "poster" | null;
interface HoverState {
  target: HoverTarget;
  setTarget: (t: HoverTarget) => void;
}
const useHover = create<HoverState>((setState) => ({
  target: null,
  setTarget: (target) => setState({ target }),
}));

/* ================================================================== */
/*  CONFIG — camera, orbit, interactions (UNCHANGED)                  */
/* ================================================================== */

/** Path to the GLB file, served from /public. */
const GLB_PATH = "/models/setup.glb";

/**
 * Draco decoder path — bundled locally under /public/draco/.
 * Avoids CSP issues from fetching gstatic.com at runtime.
 */
const DRACO_PATH = "/draco/";

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

/** Camera — room overview (starting position) */
const CAMERA_START = {
  position: [16.135, 8.636, -11.835] as [number, number, number],
  target: [6.515, 8.368, -9.116] as [number, number, number],
};

/** Camera — TV close-up (after clicking screen) */
const CAMERA_TV = {
  position: [-15.0, 8.2, -1.4] as [number, number, number],
  target: [-27.496, 7.652, -2.408] as [number, number, number],
};

const ACTIVE_CAMERA = CAMERA_START;

/** Camera field of view. Widen for very large scenes, narrow for tight framing. */
const CAMERA_FOV = 50;

const ORBIT_CONFIG = {
  enablePan: false,
  enableZoom: false,
  enableRotate: false,
  target: ACTIVE_CAMERA.target,
  enableDamping: true,
  dampingFactor: 0.08,
  makeDefault: true,
} as const;

type InteractionAction = "navigate-tv" | "open-credits" | "none";

const INTERACTIVE_MESHES: Record<string, InteractionAction> = {
  TV: "navigate-tv",
  TV_Screen: "navigate-tv",
  "bayou-bg": "open-credits",
  // Lamp: "toggle-lamp", // reserved
};

/** GLB global transform — apply if Bruno's scene needs scale/offset. */
const GLB_TRANSFORM = {
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  scale: 1,
} as const;

/* ================================================================== */
/*  GLB LOADING — drei's useGLTF handles Draco internally             */
/* ================================================================== */

/* ================================================================== */
/*  LOADING LOG — terminal overlay shared state                       */
/* ================================================================== */

interface LogLine {
  time: number;
  text: string;
}

let _logStartTime = performance.now();
let _logLines: LogLine[] = [];
const _logSubscribers = new Set<(lines: LogLine[]) => void>();

function resetLog() {
  _logStartTime = performance.now();
  _logLines = [];
  _logSubscribers.forEach((fn) => fn([]));
}

function addLog(text: string) {
  const line: LogLine = { time: performance.now(), text };
  _logLines = [..._logLines, line];
  const snapshot = _logLines;
  _logSubscribers.forEach((fn) => fn(snapshot));
}

function formatLogTime(time: number): string {
  const elapsed = time - _logStartTime;
  const totalSecs = Math.floor(elapsed / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const ms = Math.floor(elapsed % 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function useLogLines(): LogLine[] {
  const [lines, setLines] = useState<LogLine[]>(_logLines);
  useEffect(() => {
    _logSubscribers.add(setLines);
    setLines(_logLines);
    return () => {
      _logSubscribers.delete(setLines);
    };
  }, []);
  return lines;
}

/* ================================================================== */
/*  POST-PROCESSING CONFIG                                            */
/* ================================================================== */

const POST_CONFIG = {
  bloom: {
    intensity: 0.1,
    luminanceThreshold: 0.92,
    luminanceSmoothing: 0.01,
    radius: 0.2,
    mipmapBlur: true,
  },
  noise: {
    opacity: 0.01,
  },
  vignette: {
    offset: 0.1,
    darkness: 0.85,
  },
  splitToning: {
    shadowColor: 0x060402,
    highlightColor: 0xffaa44,
    intensity: 0.15,
    contrast: 0.4,
  },
} as const;

/* ================================================================== */
/*  HDR ENVIRONMENT MAP                                               */
/* ================================================================== */

const HDR_PATH = "/textures/old_room_2k.hdr";

/* ================================================================== */
/*  CAMERA ANIMATION STATE                                            */
/* ================================================================== */

interface CameraTarget {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  duration: number; // seconds
}

let _cameraAnim: CameraTarget | null = null;
let _cameraAnimProgress = 0;
let _cameraAnimFrom = { position: new THREE.Vector3(), lookAt: new THREE.Vector3() };
let _cameraAnimating = false;
let _zoomedToTV = false;
let _zoomListeners = new Set<(zoomed: boolean) => void>();

// When set, the global BackButton defers to this handler first. Used by
// TV sub-views (e.g. product detail) to intercept "back" so it returns
// to the TV grid instead of zooming the camera out of the TV entirely.
// Returns true when the handler consumed the click.
let _tvInternalBack: (() => boolean) | null = null;

function setZoomedToTV(val: boolean) {
  _zoomedToTV = val;
  _zoomListeners.forEach((fn) => fn(val));
  // Mirror to the env store so out-of-canvas UI (GlobalAudioPlayer, etc.)
  // can react without tapping module-level state.
  if (typeof window !== "undefined") {
    try {
      useEnvStore.getState().setTvZoomed(val);
    } catch {
      // no-op: store not initialised in SSR snapshot
    }
  }
}

let _cameraAnimOnComplete: (() => void) | null = null;

function animateCameraTo(
  pos: [number, number, number],
  lookAt: [number, number, number],
  duration = 2.5,
  onComplete?: () => void
) {
  _cameraAnimFrom.position.set(..._camPos);
  _cameraAnimFrom.lookAt.set(..._camTarget);
  _cameraAnim = {
    position: new THREE.Vector3(...pos),
    lookAt: new THREE.Vector3(...lookAt),
    duration,
  };
  _cameraAnimProgress = 0;
  _cameraAnimating = true;
  _cameraAnimOnComplete = onComplete ?? null;
}

/** Module-level ref for the bulb mesh — shared between GLBRoom and PostProcessingStack for GodRays */
let _bulbMesh: THREE.Mesh | null = null;

/** Module-level ref for the screen mesh — used by TVScreenHTML to position content */
let _screenMesh: THREE.Mesh | null = null;

/** Module-level ref for the poster (bayou-bg) mesh — used by the Outline pass */
let _posterMesh: THREE.Object3D | null = null;

// DEV HOOK — expose module state so Playwright can inspect from the outside.
// Safe to leave in (tree-shaken / dead in prod if window is undefined).
if (typeof window !== "undefined") {
  (window as unknown as { __ym?: Record<string, unknown> }).__ym = {
    get screen() { return _screenMesh; },
    get poster() { return _posterMesh; },
    get hovered() { return _hoveredInteractive; },
  };
}

/** Module-level hover state — shared between GLBRoom (3D raycasts) and TVScreenHTML (HTML mouse events) */
let _hoveredInteractive: THREE.Mesh | null = null;
const _interactiveOriginals = new Map<THREE.Mesh, { scale: THREE.Vector3; emissive: THREE.Color; emissiveIntensity: number }>();

function resetHoveredMesh() {
  const mesh = _hoveredInteractive;
  if (mesh) {
    const orig = _interactiveOriginals.get(mesh);
    if (orig) {
      mesh.scale.copy(orig.scale);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissive.copy(orig.emissive);
        mat.emissiveIntensity = orig.emissiveIntensity;
        mat.needsUpdate = true;
      }
    }
  }
  _hoveredInteractive = null;
}

/** Module-level camera state — updated every frame, read by debug panel */
let _camPos: [number, number, number] = [0, 0, 0];
let _camTarget: [number, number, number] = [0, 0, 0];

/* ================================================================== */
/*  MATERIAL PASS — Cycles filmic shading                             */
/* ================================================================== */

function applyMaterialPass(root: THREE.Group) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mat = obj.material;
    if (!mat || !(mat instanceof THREE.MeshStandardMaterial)) return;

    // Boost env map reflections for indirect light feel
    mat.envMapIntensity = 1.5;

    const name = obj.name.toLowerCase();

    // Lightbulb mesh — bright yellow emissive
    if (name.includes("bombillo")) {
      mat.emissive = new THREE.Color(0xffc044);
      mat.emissiveIntensity = 8.0;
      mat.color = new THREE.Color(0xffc044);
      mat.toneMapped = false;
      mat.needsUpdate = true;

      // Store world position for the spot light
      obj.updateWorldMatrix(true, false);
      const wp = new THREE.Vector3();
      obj.getWorldPosition(wp);
      // Mark for later — we'll read this after traverse
      obj.userData._bulbWorldPos = wp.toArray();
      return;
    }

    // Other lamp parts — no emissive to avoid bloom blowout
    if (name.includes("lamp") || name.includes("bulb") || name.includes("shade")) {
      if (name.includes("lava")) return; // skip lava lamp
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0;
      mat.needsUpdate = true;
      return;
    }

    // Walls / plaster / ceiling
    if (name.includes("wall") || name.includes("plaster") || name.includes("ceiling")) {
      mat.roughness = 0.92;
      mat.metalness = 0.0;
      mat.needsUpdate = true;
      return;
    }

    // Wood surfaces
    if (
      name.includes("wood") ||
      name.includes("floor") ||
      name.includes("cabinet") ||
      name.includes("desk") ||
      name.includes("table") ||
      name.includes("frame")
    ) {
      mat.roughness = 0.72;
      mat.metalness = 0.0;
      mat.needsUpdate = true;
      return;
    }

    // Metal fixtures / taps / handles
    if (
      name.includes("metal") ||
      name.includes("tap") ||
      name.includes("handle") ||
      name.includes("fixture") ||
      name.includes("hinge") ||
      name.includes("knob")
    ) {
      mat.roughness = 0.25;
      mat.metalness = 0.85;
      mat.needsUpdate = true;
      return;
    }
  });
}

/* ================================================================== */
/*  Bulb Spot Light — placed at the bulb mesh, points straight down  */
/* ================================================================== */

function BulbSpotLight({
  position,
  spotRef,
}: {
  position: [number, number, number];
  spotRef: React.MutableRefObject<THREE.SpotLight | null>;
}) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const { scene } = useThree();

  useEffect(() => {
    const light = lightRef.current;
    const target = targetRef.current;
    if (light && target) {
      light.target = target;
      scene.add(target);
      spotRef.current = light;
      console.log("[MotelRoom] Bulb spot light wired — pos:", position, "target:", [position[0], position[1] - 3, position[2]]);
    }
    return () => {
      if (target) scene.remove(target);
    };
  }, [position, scene, spotRef]);

  return (
    <>
      <spotLight
        ref={lightRef}
        position={position}
        intensity={useDebug.getState().lamp}
        color={0xffc044}
        distance={8}
        decay={1.5}
        angle={1.0}
        penumbra={0.5}
        castShadow
      />
      <object3D ref={targetRef} position={[position[0], position[1] - 4, position[2]]} />
    </>
  );
}

/* ================================================================== */
/*  GLB Room — manual Draco WASM loading with lifecycle logging       */
/* ================================================================== */

function GLBRoom({
  onModelReady,
  onLoadFailed,
}: {
  onModelReady: () => void;
  onLoadFailed: () => void;
}) {
  const { gl, scene: rootScene, camera } = useThree();
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const openCredits = useEnvStore((s) => s.openCredits);

  const [model, setModel] = useState<THREE.Group | null>(null);
  const [bulbPos, setBulbPos] = useState<[number, number, number] | null>(null);
  const screenRef = useRef<THREE.Mesh | null>(null);
  const glbLightRef = useRef<THREE.Light | null>(null);
  const bulbSpotRef = useRef<THREE.SpotLight | null>(null);
  const bulbMeshRef = useRef<THREE.Mesh | null>(null);
  const onModelReadyRef = useRef(onModelReady);
  const onLoadFailedRef = useRef(onLoadFailed);
  onModelReadyRef.current = onModelReady;
  onLoadFailedRef.current = onLoadFailed;

  /* ---- Load GLB via drei's useGLTF (handles Draco internally) ---- */
  // Args: (path, useDraco, useMeshopt, extendLoader)
  // useDraco = true → uses Google gstatic CDN (battle-tested, always works)
  // useMeshopt = false → CRITICAL: drei defaults to true which crashes
  //   when MeshoptDecoder() from three-stdlib fails to initialize
  const gltf = useGLTF(GLB_PATH, true, false);

  useEffect(() => {
    if (!gltf?.scene) return;
    resetLog();
    addLog("parsing geometry...");

    const scene = gltf.scene;

    // Tag interactive meshes + diagnostics
    const meshNames: string[] = [];
    const meshMaterialMap: string[] = [];
    let totalTriangles = 0;
    _interactiveOriginals.clear();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshNames.push(obj.name);
        const matName = !Array.isArray(obj.material) ? (obj.material as THREE.MeshStandardMaterial).name || "unnamed" : "multi";
        meshMaterialMap.push(`${obj.name} → mat:${matName}`);
        const geo = obj.geometry;
        totalTriangles += geo.index
          ? geo.index.count / 3
          : (geo.attributes.position?.count ?? 0) / 3;
      }
    });

    // Log all mesh→material mappings to the loading terminal
    addLog(`${meshNames.length} meshes, ${Math.round(totalTriangles).toLocaleString()} tris`);
    meshMaterialMap.forEach((m) => addLog(m));

    // Tag interactive objects by name OR material name
    // Bruno's GLB has generic mesh names but meaningful material names
    for (const [name, action] of Object.entries(INTERACTIVE_MESHES)) {
      // First try by object/node name
      let obj = scene.getObjectByName(name);

      // Fallback: find by material name
      if (!obj) {
        scene.traverse((child) => {
          if (obj) return; // already found
          if (child instanceof THREE.Mesh && !Array.isArray(child.material)) {
            const matName = (child.material as THREE.MeshStandardMaterial).name;
            if (matName && matName.toLowerCase() === name.toLowerCase()) {
              obj = child;
            }
          }
        });
      }

      if (!obj) continue;

      // Capture top-level object for the Outline pass
      if (name === "bayou-bg") {
        _posterMesh = obj;
      }

      obj.traverse((child) => {
        child.userData.interactionAction = action;
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat) {
            _interactiveOriginals.set(child, {
              scale: child.scale.clone(),
              emissive: mat.emissive.clone(),
              emissiveIntensity: mat.emissiveIntensity,
            });
          }
        }
      });
    }

    // Tame embedded lights from the GLB
    scene.traverse((obj) => {
      if ((obj as THREE.Light).isLight) {
        const light = obj as THREE.Light;
        obj.updateWorldMatrix(true, false);
        const lightPos = new THREE.Vector3();
        obj.getWorldPosition(lightPos);
        light.intensity = useDebug.getState().glbLight;
        glbLightRef.current = light;
        setBulbPos([lightPos.x, lightPos.y, lightPos.z]);
      }
    });

    addLog(`loaded ${meshNames.length} meshes, ${Math.round(totalTriangles).toLocaleString()} tris`);

    // Find the screen mesh — check both mesh name AND material name
    // Bruno's GLB has generic mesh names but material named "Screen"
    let screenMesh: THREE.Mesh | null = null;
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && (
        obj.name.toLowerCase() === "screen" ||
        (obj.material && !Array.isArray(obj.material) && (obj.material as THREE.MeshStandardMaterial).name?.toLowerCase() === "screen")
      )) {
        screenMesh = obj;
        const m = obj.material as THREE.MeshStandardMaterial;
        if (m) {
          m.emissive = new THREE.Color(0xffffff);
          m.emissiveIntensity = 2.5;
          m.needsUpdate = true;
        }
        // Tag as interactive so pointer-over fires and the Outline pass
        // can pick it up via the hover store.
        obj.userData.interactionAction = "navigate-tv";
      }
    });
    screenRef.current = screenMesh;
    _screenMesh = screenMesh;
    if (screenMesh) {
      const sm = screenMesh as THREE.Mesh;
      addLog(`SCREEN FOUND: ${sm.name} (mat: ${(sm.material as THREE.MeshStandardMaterial)?.name})`);
    } else {
      addLog("SCREEN NOT FOUND ✗");
    }

    // Material pass
    applyMaterialPass(scene);

    // Find bulb position
    let foundBulbPos: [number, number, number] | null = null;
    scene.traverse((obj) => {
      if (obj.userData._bulbWorldPos) {
        foundBulbPos = obj.userData._bulbWorldPos as [number, number, number];
      }
    });
    if (foundBulbPos) setBulbPos(foundBulbPos);

    setModel(scene);
    addLog("scene ready ✓");
  }, [gltf]);

  /* ---- Shader compile + find bulb position + signal ready ---- */
  useEffect(() => {
    if (!model) return;

    addLog("compiling shaders...");
    try {
      gl.compile(rootScene, camera);
    } catch (e) {
      console.warn("[MotelRoom] renderer.compile() threw:", e);
    }

    // Now the model is in the scene — find the bulb's actual world position
    model.updateMatrixWorld(true);
    let foundBulb = false;
    const allNames: string[] = [];
    model.traverse((obj) => {
      if (obj.name) allNames.push(`${obj.name} [${obj.type}]`);
      const nameLower = obj.name.toLowerCase();
      if (obj instanceof THREE.Mesh && (nameLower.includes("bombillo") || nameLower.includes("bulb"))) {
        const wp = new THREE.Vector3();
        obj.getWorldPosition(wp);
        console.log(`[MotelRoom] Found bulb mesh "${obj.name}" at:`, wp.toArray());
        setBulbPos([wp.x, wp.y, wp.z]);
        bulbMeshRef.current = obj;
        _bulbMesh = obj;
        foundBulb = true;
      }
    });
    if (!foundBulb) {
      console.warn("[MotelRoom] No bulb mesh found! All objects in GLB:", allNames);
    }
    console.log("[MotelRoom] Debug state:", {
      lamp: useDebug.getState().lamp,
      ambient: useDebug.getState().ambient,
      exposure: useDebug.getState().exposure,
      tvGlow: useDebug.getState().tvGlow,
      glbLight: useDebug.getState().glbLight,
      hdrIntensity: useDebug.getState().hdrIntensity,
    });

    addLog("scene ready \u2713");
    onModelReadyRef.current();

    // If the user arrived via /room?tv=1 (e.g. clicking "Back to TV" on a
    // product page), skip the default overview and zoom straight onto the
    // TV so they land back on the channel grid.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tv") === "1") {
        const timer = setTimeout(() => {
          animateCameraTo(
            CAMERA_TV.position,
            CAMERA_TV.target,
            1.1,
            () => setZoomedToTV(true)
          );
        }, 250);
        return () => clearTimeout(timer);
      }
    }
  }, [model, gl, rootScene, camera]);

  /* ---- Sync lights to debug sliders + lamp flicker ---- */
  useFrame((state) => {
    const light = glbLightRef.current;
    if (light) {
      light.intensity = useDebug.getState().glbLight;
    }
    const bulbSpot = bulbSpotRef.current;
    if (bulbSpot) {
      const base = useDebug.getState().lamp;
      const t = state.clock.elapsedTime;
      // Warm candle-like flicker
      const flicker = 1.0
        + Math.sin(t * 4.3) * 0.06
        + Math.sin(t * 7.1) * 0.04
        + Math.sin(t * 13.7) * 0.02
        + (Math.random() < 0.04 ? (Math.random() - 0.5) * 0.3 : 0);
      bulbSpot.intensity = base * flicker;
    }
  });

  /* ---- Screen flicker — bright white CRT bursts (dimmed when HTML overlay active) ---- */
  useFrame((state) => {
    const mesh = screenRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (!mat) return;

    // When zoomed to TV, dim emissive so HTML content reads clearly
    if (_zoomedToTV) {
      mat.emissiveIntensity = 0.15;
      mat.emissive.setRGB(0.4, 0.5, 0.55);
      return;
    }

    const t = state.clock.elapsedTime;
    // Base hum with bright white flashes
    const hum = 2.2 + Math.sin(t * 4.0) * 0.3;
    const jitter = Math.sin(t * 50) * 0.1;
    // Random bright white flash — 5% chance per frame
    const flash = Math.random() < 0.05 ? Math.random() * 2.0 : 0;
    mat.emissiveIntensity = Math.max(0.8, hum + jitter + flash);
    // Shift color toward pure white on flashes
    const whiteness = flash > 0.5 ? 1.0 : 0.85 + Math.sin(t * 7) * 0.15;
    mat.emissive.setRGB(whiteness, whiteness, whiteness);
  });

  /* ---- Interaction handlers ---- */
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (transitioning || _cameraAnimating) return;

    // Screen mesh — animate camera to TV close-up
    // Check both mesh name and material name (Bruno's GLB has material named "Screen")
    const meshName = e.object.name?.toLowerCase() ?? "";
    const matName = (!Array.isArray((e.object as THREE.Mesh).material) && ((e.object as THREE.Mesh).material as THREE.MeshStandardMaterial)?.name?.toLowerCase()) || "";
    if (meshName === "screen" || matName === "screen") {
      animateCameraTo(CAMERA_TV.position, CAMERA_TV.target, 2.5, () => setZoomedToTV(true));
      return;
    }

    const action = e.object.userData.interactionAction as
      | InteractionAction
      | undefined;
    if (!action) return;

    if (action === "navigate-tv") {
      animateCameraTo(CAMERA_TV.position, CAMERA_TV.target, 2.5, () => setZoomedToTV(true));
    } else if (action === "open-credits") {
      // Zoom into the poster, then fade to black → /credits
      e.object.updateWorldMatrix(true, false);
      const box = new THREE.Box3().setFromObject(e.object);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const camDir = new THREE.Vector3(..._camPos).sub(center).normalize();
      const targetPos = center.clone().add(camDir.multiplyScalar(2));
      animateCameraTo(
        targetPos.toArray() as [number, number, number],
        center.toArray() as [number, number, number],
        1.2,
        () => startTransition("credits", () => router.push("/credits"))
      );
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    const action = e.object.userData.interactionAction as InteractionAction | undefined;
    if (!action) return;
    document.body.style.cursor = "pointer";
    _hoveredInteractive = e.object as THREE.Mesh;

    // Resolve which interactive target this mesh belongs to so the
    // Outline pass knows which one to colour blue.
    let cur: THREE.Object3D | null = e.object;
    let target: HoverTarget = null;
    while (cur) {
      if (cur === _screenMesh) { target = "tv"; break; }
      if (cur === _posterMesh) { target = "poster"; break; }
      cur = cur.parent;
    }
    if (!target) {
      if (action === "navigate-tv") target = "tv";
      else if (action === "open-credits") target = "poster";
    }
    useHover.getState().setTarget(target);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "default";
    resetHoveredMesh();
    useHover.getState().setTarget(null);
  };

  /* ---- Hover pulse — subtle scale throb only. Border glow is handled
          by the Outline post-effect in PostProcessingStack. ---- */
  useFrame((state) => {
    const mesh = _hoveredInteractive;
    if (!mesh) return;
    const orig = _interactiveOriginals.get(mesh);
    if (!orig) return;
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 3) * 0.015;
    mesh.scale.set(
      orig.scale.x * pulse,
      orig.scale.y * pulse,
      orig.scale.z * pulse
    );
  });

  if (!model) return null;

  return (
    <>
      <primitive
        object={model}
        position={GLB_TRANSFORM.position}
        rotation={GLB_TRANSFORM.rotation}
        scale={GLB_TRANSFORM.scale}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {/* Spot light at the bulb position, pointing straight down */}
      {bulbPos && (
        <BulbSpotLight position={bulbPos} spotRef={bulbSpotRef} />
      )}
    </>
  );
}

/* ================================================================== */
/*  Procedural Room fallback — shown when GLB fails to load           */
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
/*  Procedural Hotspots — TV + Lamp cubes for the fallback scene      */
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
/*  Dust Particles — tiny floating motes                              */
/* ================================================================== */

const DUST_COUNT = 300;
const DUST_SPREAD = 30;
const DUST_HEIGHT = 10;

function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(DUST_COUNT * 3);
    const vel = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * DUST_SPREAD;
      pos[i * 3 + 1] = Math.random() * DUST_HEIGHT;
      pos[i * 3 + 2] = (Math.random() - 0.5) * DUST_SPREAD;
      vel[i * 3] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    return [pos, vel];
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const half = DUST_SPREAD / 2;

    for (let i = 0; i < DUST_COUNT; i++) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];

      if (arr[i * 3] > half) arr[i * 3] = -half;
      if (arr[i * 3] < -half) arr[i * 3] = half;
      if (arr[i * 3 + 1] > DUST_HEIGHT) arr[i * 3 + 1] = 0;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = DUST_HEIGHT;
      if (arr[i * 3 + 2] > half) arr[i * 3 + 2] = -half;
      if (arr[i * 3 + 2] < -half) arr[i * 3 + 2] = half;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color={0xddccaa}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ================================================================== */
/*  Volumetric Light Cone — fake god rays pointing downward           */
/* ================================================================== */

function LightCone({ position }: { position: [number, number, number] }) {
  const coneRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!coneRef.current) return;
    const mat = coneRef.current.material as THREE.MeshBasicMaterial;
    const t = state.clock.elapsedTime;
    // Subtle flicker matching the lamp
    mat.opacity = 0.06 + Math.sin(t * 4.3) * 0.01 + Math.sin(t * 7.1) * 0.005;
  });

  return (
    <mesh
      ref={coneRef}
      position={[position[0], position[1] - 2, position[2]]}
      rotation={[0, 0, 0]}
    >
      <coneGeometry args={[2.5, 4, 32, 1, true]} />
      <meshBasicMaterial
        color={0xffc044}
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ================================================================== */
/*  TV Screen HTML — VHS-styled content rendered on the Screen mesh    */
/* ================================================================== */

const VHS_WORDS = ["YUNMAKAI", "SOLUS RECORDS", "TUNE IN", "CHANNEL 01", "TEST SIGNAL"];

// TV is now a pure product navigation surface. All of these states render
// INSIDE the CRT — no camera moves, no page navigations. Credits live on
// the poster hotspot (separate overlay).
//   idle          — TV is not zoomed; test pattern / tune-in hint
//   products      — channel grid of all products
//   product-detail — single product view (title, price, image, add-to-cart,
//                   linked tracks) inside the CRT
type TVChannel = "idle" | "products" | "product-detail";

/* ---- Idle screen — cycling words when not zoomed ---- */

function TVIdleScreen({ onScreenClick }: { onScreenClick: () => void }) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % VHS_WORDS.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textShadow: "1.5px 0 #ff0040, -1.5px 0 #00ffcc",
        cursor: "pointer",
      }}
      onClick={onScreenClick}
    >
      <div
        key={wordIndex}
        style={{
          fontSize: "32px",
          fontWeight: 700,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          animation: "vhsTextIn 0.4s ease-out",
        }}
      >
        {VHS_WORDS[wordIndex]}
      </div>
    </div>
  );
}

/* ---- Product channel grid — first TV view when zoomed in ---- */

function TVProductGrid({ onSelect }: { onSelect: (handle: string) => void }) {
  // NOTE: do NOT call useRouter() here — this component renders inside drei's
  // <Html> portal, which doesn't propagate Next.js App Router context and
  // will throw "invariant expected app router to be mounted".
  const [products, setProducts] = useState<
    Array<{ shopify_id: string; title: string; handle: string; price: string; image_url: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch once on mount. Runs inside the R3F Html portal — server actions
  // won't work here, so we use the public /api/tv/products endpoint.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tv/products")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const rowStyle = {
    padding: "12px 16px",
    background: "rgba(10,8,5,0.55)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderLeft: "2px solid rgba(212,168,83,0.25)",
    borderRadius: "2px",
    fontSize: "12px",
    letterSpacing: "0.12em",
    color: "rgba(200,192,168,0.75)",
    cursor: "pointer",
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    gap: "18px",
    transition: "all 0.18s ease",
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "42px 52px 34px 52px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            textShadow: "1.5px 0 #ff0040, -1.5px 0 #00ffcc",
            marginBottom: "10px",
            lineHeight: 1,
          }}
        >
          YUNMAKAI TV
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "9px",
            color: "rgba(200,192,168,0.42)",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
          }}
        >
          <span>Channel Grid</span>
          <span style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(212,168,83,0.3), transparent)" }} />
          <span style={{ color: "rgba(212,168,83,0.55)" }}>
            {loading ? "TUNING" : products.length === 0 ? "NO SIGNAL" : `${String(products.length).padStart(2, "0")} SIGNALS`}
          </span>
        </div>
      </div>

      {/* Product channel list */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
        {error && (
          <div style={{ fontSize: "11px", color: "#ff4444", letterSpacing: "0.1em" }}>
            ERROR: {error}
          </div>
        )}
        {loading ? (
          <div style={{ fontSize: "11px", color: "rgba(200,192,168,0.4)", letterSpacing: "0.2em" }}>
            LOADING...
          </div>
        ) : products.length === 0 ? (
          <div style={{ fontSize: "11px", color: "rgba(200,192,168,0.3)", letterSpacing: "0.15em" }}>
            NO PRODUCTS
          </div>
        ) : (
          products.map((p, i) => (
            <div
              key={p.shopify_id}
              style={rowStyle}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(p.handle);
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderLeftColor = "rgba(212,168,83,0.85)";
                el.style.borderColor = "rgba(212,168,83,0.3)";
                el.style.background = "rgba(212,168,83,0.08)";
                el.style.transform = "translateX(3px)";
                el.style.boxShadow = "0 0 18px rgba(212,168,83,0.15)";
                const arrow = el.querySelector("[data-arrow]") as HTMLElement | null;
                if (arrow) arrow.style.transform = "translateX(3px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderLeftColor = "rgba(212,168,83,0.25)";
                el.style.borderColor = "rgba(255,255,255,0.07)";
                el.style.background = "rgba(10,8,5,0.55)";
                el.style.transform = "translateX(0)";
                el.style.boxShadow = "none";
                const arrow = el.querySelector("[data-arrow]") as HTMLElement | null;
                if (arrow) arrow.style.transform = "translateX(0)";
              }}
            >
              {/* Channel badge — boxed number */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 42,
                  minHeight: 36,
                  flexShrink: 0,
                  border: "1px solid rgba(212,168,83,0.25)",
                  borderRadius: "2px",
                  background: "rgba(0,0,0,0.4)",
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    color: "rgba(212,168,83,0.55)",
                    letterSpacing: "0.1em",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: "1px",
                  }}
                >
                  CH
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#e8e0c8",
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Title + price */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.14em",
                    color: "#e8e0c8",
                    marginBottom: "3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.title.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#d4a853",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.06em",
                  }}
                >
                  ${p.price}
                </div>
              </div>

              {/* VIEW arrow */}
              <span
                data-arrow
                style={{
                  fontSize: "9px",
                  color: "rgba(212,168,83,0.55)",
                  letterSpacing: "0.2em",
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: "transform 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                VIEW <span style={{ fontSize: "11px" }}>→</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---- Product detail view — opens inside the CRT when a row is selected ---- */

type TVProductDetailData = {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: string;
  image: string | null;
  glbUrl: string | null;
  variantId: string | null;
  availableForSale: boolean;
};

type TVTrackData = {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  duration_seconds: number | null;
};

/* -------- Media stage: 3D model / image / test pattern, centered hero -------- */

function TVProductStage({ product }: { product: TVProductDetailData }) {
  // Priority: glb > image > VHS test pattern fallback
  if (product.glbUrl) {
    return (
      <div
        style={{
          width: 180,
          height: 180,
          position: "relative",
          borderRadius: "2px",
          overflow: "hidden",
          // Recessed CRT viewfinder look
          boxShadow:
            "inset 0 0 30px rgba(0,0,0,0.9), 0 0 40px rgba(212,168,83,0.12), 0 0 0 1px rgba(212,168,83,0.25)",
          background:
            "radial-gradient(circle at 50% 45%, rgba(40,30,18,0.7) 0%, rgba(0,0,0,0.95) 70%)",
        }}
      >
        <ModelViewer src={product.glbUrl} alt={product.title} />
      </div>
    );
  }

  if (product.image) {
    return (
      <div
        style={{
          width: 180,
          height: 180,
          position: "relative",
          overflow: "hidden",
          borderRadius: "2px",
          backgroundImage: `url(${product.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow:
            "inset 0 0 30px rgba(0,0,0,0.8), 0 0 40px rgba(212,168,83,0.1), 0 0 0 1px rgba(212,168,83,0.25)",
        }}
      >
        {/* VHS scanline overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 3px)",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }

  // No media — VHS "TEST PATTERN" style placeholder. Rotating bar for life.
  return (
    <div
      style={{
        width: 180,
        height: 180,
        position: "relative",
        overflow: "hidden",
        borderRadius: "2px",
        background: "#0a0a0a",
        boxShadow:
          "inset 0 0 40px rgba(0,0,0,0.9), 0 0 40px rgba(212,168,83,0.08), 0 0 0 1px rgba(212,168,83,0.2)",
      }}
    >
      {/* SMPTE-ish color bars */}
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "12%",
          right: "12%",
          height: "40%",
          display: "flex",
          filter: "saturate(0.55) brightness(0.4)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {["#6b6b6b", "#c9c94e", "#4ec9c9", "#4ec94e", "#c94ec9", "#c94e4e", "#4e4ec9"].map(
          (c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          )
        )}
      </div>
      {/* Center readout */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "8px",
          letterSpacing: "0.35em",
          color: "rgba(212,168,83,0.55)",
          fontFamily: "monospace",
        }}
      >
        NO SIGNAL
      </div>
      {/* Sweeping scanline */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "3px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
          filter: "blur(0.8px)",
          animation: "tvStageSweep 3.2s linear infinite",
          pointerEvents: "none",
        }}
      />
      {/* Static dots */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/* -------- Mini music player — cinematic bottom strip inside the CRT -------- */

function TVMusicPlayer({ tracks }: { tracks: TVTrackData[] }) {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const progress = useMusicStore((s) => s.progress);
  const duration = useMusicStore((s) => s.duration);
  const buffering = useMusicStore((s) => s.buffering);

  // Pair the music store with its audio element events — GlobalAudioPlayer
  // normally does this, but it's unmounted during the initial landing flow
  // so we wire it up here too to keep the player responsive inside the CRT.
  useEffect(() => {
    const audio = getAudioElement();
    const setProgress = useMusicStore.getState().setProgress;
    const setDuration = useMusicStore.getState().setDuration;
    const setBuffering = useMusicStore.getState().setBuffering;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      useMusicStore.getState().pause();
      setProgress(0);
    };
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  // Which of the product's tracks is currently loaded (if any)
  const activeIdx = useMemo(() => {
    if (!currentTrack) return -1;
    return tracks.findIndex((t) => t.id === currentTrack.id);
  }, [tracks, currentTrack]);

  const displayTrack = activeIdx >= 0 ? tracks[activeIdx] : tracks[0];
  if (!displayTrack) return null;

  const isActive = activeIdx >= 0;
  const effectiveDuration =
    isActive && duration > 0
      ? duration
      : displayTrack.duration_seconds ?? 0;
  const effectiveProgress = isActive ? progress : 0;
  const progressPct =
    effectiveDuration > 0
      ? Math.min(100, (effectiveProgress / effectiveDuration) * 100)
      : 0;

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const onPlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive) {
      useMusicStore.getState().playTrack(displayTrack.id);
      return;
    }
    useMusicStore.getState().togglePlay();
  };

  const onSelectTrack = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    useMusicStore.getState().playTrack(trackId);
  };

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isActive || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    useMusicStore.getState().seek(ratio * duration);
  };

  return (
    <div
      style={{
        position: "relative",
        padding: "10px 14px 8px 14px",
        borderTop: "1px solid rgba(212,168,83,0.15)",
        background:
          "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(15,10,5,0.6) 50%, rgba(0,0,0,0.65) 100%)",
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: "9px",
          letterSpacing: "0.32em",
          color: isActive ? "#d4a853" : "rgba(232,224,200,0.55)",
          textTransform: "uppercase",
          marginBottom: "7px",
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isActive && isPlaying ? "#ff2020" : "rgba(212,168,83,0.55)",
            boxShadow: isActive && isPlaying ? "0 0 8px #ff2020" : "0 0 4px rgba(212,168,83,0.3)",
            animation: isActive && isPlaying ? "tvStageBlink 1s step-end infinite" : undefined,
          }}
        />
        <span>
          {isActive
            ? isPlaying
              ? "NOW PLAYING"
              : buffering
              ? "BUFFERING"
              : "PAUSED"
            : "AUDIO · TAP TO PLAY"}
        </span>
      </div>

      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Play / pause — breathing amber circle */}
        <div
          onClick={onPlayPause}
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${isActive ? "rgba(212,168,83,0.75)" : "rgba(255,255,255,0.2)"}`,
            borderRadius: "50%",
            color: isActive ? "#d4a853" : "rgba(255,255,255,0.6)",
            fontSize: "13px",
            cursor: "pointer",
            background: isActive
              ? "radial-gradient(circle at center, rgba(212,168,83,0.15) 0%, transparent 70%)"
              : "transparent",
            boxShadow:
              isActive && isPlaying
                ? "0 0 14px rgba(212,168,83,0.45)"
                : "none",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(212,168,83,0.9)";
            e.currentTarget.style.color = "#d4a853";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isActive
              ? "rgba(212,168,83,0.75)"
              : "rgba(255,255,255,0.2)";
            e.currentTarget.style.color = isActive ? "#d4a853" : "rgba(255,255,255,0.6)";
          }}
        >
          {buffering && isActive ? (
            <span style={{ fontSize: "10px", animation: "tvStageBlink 0.8s step-end infinite" }}>
              ···
            </span>
          ) : isActive && isPlaying ? (
            <span style={{ fontSize: "10px" }}>❚❚</span>
          ) : (
            <span style={{ marginLeft: "2px" }}>▶</span>
          )}
        </div>

        {/* Track title + artist + progress bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "12px",
              marginBottom: "5px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#e8e0c8",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayTrack.title}
              <span style={{ color: "rgba(200,192,168,0.35)", margin: "0 6px" }}>·</span>
              <span style={{ color: "rgba(200,192,168,0.55)" }}>{displayTrack.artist}</span>
            </div>
            <div
              style={{
                fontSize: "9px",
                fontFamily: "monospace",
                color: "#d4a853",
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmt(effectiveProgress)}
              <span style={{ color: "rgba(200,192,168,0.35)" }}> / </span>
              {fmt(effectiveDuration)}
            </div>
          </div>

          {/* Scrubbable progress bar with glow */}
          <div
            onClick={onSeek}
            style={{
              position: "relative",
              height: "3px",
              background: "rgba(255,255,255,0.08)",
              cursor: isActive ? "pointer" : "default",
              borderRadius: "1px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, rgba(212,168,83,0.8), #d4a853)",
                boxShadow: isActive ? "0 0 10px rgba(212,168,83,0.6)" : "none",
                transition: "width 100ms linear",
              }}
            />
            {/* Playhead dot */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  left: `${progressPct}%`,
                  top: "50%",
                  width: 7,
                  height: 7,
                  marginLeft: -3,
                  marginTop: -3,
                  background: "#d4a853",
                  borderRadius: "50%",
                  boxShadow: "0 0 8px rgba(212,168,83,0.9)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Multi-track selector — only if the product has more than one track */}
      {tracks.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginTop: "7px",
            flexWrap: "wrap",
          }}
        >
          {tracks.map((t, i) => {
            const isThis = currentTrack?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={(e) => onSelectTrack(e, t.id)}
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.15em",
                  padding: "3px 8px",
                  border: `1px solid ${
                    isThis ? "rgba(212,168,83,0.6)" : "rgba(255,255,255,0.12)"
                  }`,
                  color: isThis ? "#d4a853" : "rgba(200,192,168,0.45)",
                  background: isThis ? "rgba(212,168,83,0.08)" : "transparent",
                  borderRadius: "2px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {String(i + 1).padStart(2, "0")} {t.title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// NOTE: `onBack` is kept in the prop signature for symmetry but is no
// longer wired to a visible in-CRT button. The global BackButton defers
// to _tvInternalBack (set by VHSScreen) which calls the parent-level
// handleBackToGrid directly, so the in-CRT pill would be redundant.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TVProductDetail({ handle, onBack: _onBack }: { handle: string; onBack: () => void }) {
  const [product, setProduct] = useState<TVProductDetailData | null>(null);
  const [tracks, setTracks] = useState<TVTrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Fetch product + linked tracks in one roundtrip
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/tv/product/${handle}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        setProduct(data.product ?? null);
        setTracks(Array.isArray(data.tracks) ? data.tracks : []);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "failed");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [handle]);

  const addToCart = useCallback(() => {
    if (!product?.variantId || adding) return;
    setAdding(true);
    import("@/stores/cart").then((mod) => {
      mod.useCartStore
        .getState()
        .addItem(product.variantId!, 1)
        .then(() => {
          setAdding(false);
          setAdded(true);
          setTimeout(() => setAdded(false), 1800);
        })
        .catch(() => setAdding(false));
    });
  }, [product, adding]);

  // Shorten long descriptions — the CRT area is narrow
  const shortDescription = useMemo(() => {
    if (!product?.description) return "";
    const max = 120;
    if (product.description.length <= max) return product.description;
    return product.description.slice(0, max).trimEnd() + "…";
  }, [product]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        padding: "18px 24px 0 24px",
      }}
    >
      {/* Header spacer — the global "Back" button (outside the CRT) handles
          navigation, and the CRT chrome shows CH-YM / LIVE markers around
          this area. Keeping an empty row preserves the layout rhythm. */}
      <div style={{ height: "4px", marginBottom: "4px" }} />

      {loading && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "rgba(200,192,168,0.4)",
            letterSpacing: "0.3em",
          }}
        >
          TUNING CHANNEL…
        </div>
      )}
      {error && !loading && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#ff4444",
            letterSpacing: "0.15em",
          }}
        >
          ERROR: {error}
        </div>
      )}

      {!loading && !error && product && (
        <>
          {/* Hero stage — centred media + title + price + description + add-to-cart */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "10px",
              minHeight: 0,
            }}
          >
            <TVProductStage product={product} />

            {/* Title in display serif-like CRT style */}
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "#e8e0c8",
                textTransform: "uppercase",
                textAlign: "center",
                textShadow: "1px 0 rgba(255,0,64,0.3), -1px 0 rgba(0,255,204,0.3)",
                marginTop: "2px",
              }}
            >
              {product.title}
            </div>

            {/* Divider */}
            <div
              style={{
                width: "48px",
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(212,168,83,0.55), transparent)",
              }}
            />

            {/* Price + short description + add to cart — tight vertical stack */}
            <div
              style={{
                fontSize: "13px",
                color: "#d4a853",
                fontFamily: "monospace",
                letterSpacing: "0.08em",
              }}
            >
              {product.price}
            </div>

            <div
              style={{
                fontSize: "9px",
                lineHeight: 1.55,
                color: "rgba(200,192,168,0.55)",
                letterSpacing: "0.04em",
                textAlign: "center",
                maxWidth: "82%",
              }}
            >
              {shortDescription}
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation();
                addToCart();
              }}
              style={{
                marginTop: "4px",
                padding: "8px 22px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                cursor: product.variantId && !adding ? "pointer" : "default",
                color: added
                  ? "#0a0a0a"
                  : product.variantId
                  ? "#0a0a0a"
                  : "rgba(200,192,168,0.3)",
                background: added
                  ? "rgba(120, 200, 120, 0.85)"
                  : product.variantId
                  ? "rgba(212,168,83,0.9)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(212,168,83,0.45)",
                borderRadius: "2px",
                opacity: adding ? 0.6 : 1,
                transition: "all 0.2s ease",
                boxShadow: product.variantId
                  ? "0 0 20px rgba(212,168,83,0.2)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!product.variantId || adding || added) return;
                e.currentTarget.style.background = "#d4a853";
                e.currentTarget.style.boxShadow = "0 0 28px rgba(212,168,83,0.55)";
              }}
              onMouseLeave={(e) => {
                if (!product.variantId || adding || added) return;
                e.currentTarget.style.background = "rgba(212,168,83,0.9)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(212,168,83,0.2)";
              }}
            >
              {added ? "ADDED ✓" : adding ? "ADDING…" : "ADD TO CART"}
            </div>
          </div>

          {/* Music player strip — sits at the bottom of the CRT */}
          {tracks.length > 0 && <TVMusicPlayer tracks={tracks} />}
        </>
      )}
    </div>
  );
}

/* ---- VHS Screen shell — wraps content with CRT/VHS effects ---- */

function VHSScreen({ interactive, onScreenClick, onHoverStart, onHoverEnd }: { interactive: boolean; onScreenClick: () => void; onHoverStart: () => void; onHoverEnd: () => void }) {
  const [channel, setChannel] = useState<TVChannel>("idle");
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [time, setTime] = useState("00:00:00");

  // Reset to idle when zooming out — and wipe any selected product
  useEffect(() => {
    if (!interactive) {
      setChannel("idle");
      setSelectedHandle(null);
    }
  }, [interactive]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // When zoomed and still on idle, auto-switch to the product grid.
  useEffect(() => {
    if (interactive && channel === "idle") {
      const t = setTimeout(() => setChannel("products"), 300);
      return () => clearTimeout(t);
    }
  }, [interactive, channel]);

  const handleSelectProduct = useCallback((handle: string) => {
    setSelectedHandle(handle);
    setChannel("product-detail");
  }, []);

  const handleBackToGrid = useCallback(() => {
    setSelectedHandle(null);
    setChannel("products");
  }, []);

  // Register an internal back handler so the global BackButton can defer
  // to us — product-detail should pop back to the grid instead of
  // zooming the camera out of the TV entirely.
  useEffect(() => {
    _tvInternalBack = () => {
      if (channel === "product-detail") {
        handleBackToGrid();
        return true;
      }
      return false;
    };
    return () => { _tvInternalBack = null; };
  }, [channel, handleBackToGrid]);

  // Readout in the top-right chrome. Mode-aware so it feels alive
  // instead of hardcoded.
  const activeChNum =
    channel === "idle"
      ? "--"
      : channel === "products"
      ? "GRID"
      : "SHOP";

  return (
    <div
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      style={{
        width: 640,
        height: 391,
        background: "radial-gradient(ellipse at center, #0f1810 0%, #050505 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Courier New', monospace",
        color: "#c8c0a8",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={onScreenClick}
    >
      {/* Page content */}
      {channel === "idle" && <TVIdleScreen onScreenClick={onScreenClick} />}
      {channel === "products" && <TVProductGrid onSelect={handleSelectProduct} />}
      {channel === "product-detail" && selectedHandle && (
        <TVProductDetail handle={selectedHandle} onBack={handleBackToGrid} />
      )}

      {/* REC indicator — hidden on product-detail where the music player
          owns the bottom-right corner. Moved to the bottom-LEFT on the
          grid view to avoid bumping into CH-YM / LIVE chrome elements. */}
      {channel !== "product-detail" && (
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            left: "18px",
            fontSize: "11px",
            color: "#ff2020",
            textShadow: "0 0 6px rgba(255, 0, 0, 0.55)",
            fontFamily: "monospace",
            letterSpacing: "0.08em",
            animation: "vhsRecBlink 1s step-end infinite",
            pointerEvents: "none",
          }}
        >
          ● REC {time}
        </div>
      )}

      {/* Channel readout — top-right chrome */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          right: "18px",
          fontSize: "11px",
          color: "#e8e0c8",
          textShadow: "0 0 6px rgba(232,224,200,0.35)",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.15em",
          pointerEvents: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span style={{ color: "rgba(200,192,168,0.45)" }}>CH</span>
        <span>{activeChNum}</span>
      </div>

      {/* Status indicator — top-left chrome */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "18px",
          fontSize: "10px",
          color: channel === "idle" ? "rgba(232,224,200,0.35)" : "#d4a853",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.2em",
          pointerEvents: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: channel === "idle" ? "rgba(232,224,200,0.35)" : "#d4a853",
            boxShadow: channel === "idle" ? "none" : "0 0 6px #d4a853",
          }}
        />
        {channel === "idle" ? "STANDBY" : "LIVE"}
      </div>

      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* VHS tracking distortion bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)",
          filter: "blur(1px)",
          animation: "vhsTracking 6s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* Second tracking bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "2px",
          background: "rgba(255,255,255,0.06)",
          animation: "vhsTracking 4s linear infinite reverse",
          animationDelay: "-2s",
          pointerEvents: "none",
        }}
      />

      {/* CRT edge shadow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.7), inset 0 0 20px rgba(0,0,0,0.5)",
          borderRadius: "4px",
          pointerEvents: "none",
        }}
      />

      {/* Noise flicker */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect fill='white' width='2' height='2'/%3E%3C/svg%3E\")",
          backgroundSize: "4px 4px",
          animation: "vhsNoise 0.15s steps(3) infinite",
          pointerEvents: "none",
          mixBlendMode: "overlay" as const,
        }}
      />

      <style>{`
        @keyframes vhsTracking {
          0% { top: -4px; }
          100% { top: 100%; }
        }
        @keyframes vhsRecBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes vhsTextIn {
          0% { opacity: 0; transform: translateY(6px) scaleY(1.15); filter: blur(2px); }
          40% { opacity: 1; filter: blur(0); }
          100% { transform: translateY(0) scaleY(1); }
        }
        @keyframes vhsNoise {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes tvStageSweep {
          0%   { top: -6%;  opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.9; }
          100% { top: 108%; opacity: 0; }
        }
        @keyframes tvStageBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}

function TVScreenHTML() {
  const groupRef = useRef<THREE.Group>(null);
  const [ready, setReady] = useState(false);
  const [zoomed, setZoomed] = useState(_zoomedToTV);
  useEffect(() => {
    const listener = (z: boolean) => setZoomed(z);
    _zoomListeners.add(listener);
    return () => { _zoomListeners.delete(listener); };
  }, []);

  // Poll for screen mesh availability
  useEffect(() => {
    if (_screenMesh) { setReady(true); return; }
    const id = setInterval(() => {
      if (_screenMesh) { setReady(true); clearInterval(id); }
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Position at the geometric center of the screen mesh (not the origin,
  // which may be offset in Blender), then face the camera
  useEffect(() => {
    if (!ready || !groupRef.current || !_screenMesh) return;
    _screenMesh.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(_screenMesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    console.log(
      "[TVScreenHTML] Screen bbox center:",
      center.toArray().map((n) => n.toFixed(2)),
      "size:",
      size.toArray().map((n) => n.toFixed(2))
    );
    groupRef.current.position.copy(center);
    groupRef.current.lookAt(new THREE.Vector3(...CAMERA_TV.position));
    // Tilt top toward the TV screen (~15 degrees on local X)
    groupRef.current.rotateX(THREE.MathUtils.degToRad(-8));
  }, [ready]);

  const handleScreenClick = useCallback(() => {
    if (_cameraAnimating) return;
    if (!zoomed) {
      animateCameraTo(CAMERA_TV.position, CAMERA_TV.target, 2.5, () => setZoomedToTV(true));
    }
  }, [zoomed]);

  if (!ready) return null;

  return (
    <group ref={groupRef}>
      <Html
        transform
        distanceFactor={3.125}
        zIndexRange={[0, 0]}
        style={{
          pointerEvents: "auto",
        }}
      >
        <VHSScreen
          interactive={zoomed}
          onScreenClick={handleScreenClick}
          onHoverStart={() => {
            if (_screenMesh) {
              _hoveredInteractive = _screenMesh;
              document.body.style.cursor = "pointer";
            }
          }}
          onHoverEnd={() => {
            resetHoveredMesh();
            document.body.style.cursor = "default";
          }}
        />
      </Html>
    </group>
  );
}

/* ================================================================== */
/*  Room Content — loads GLB, falls back to procedural                 */
/* ================================================================== */

/* Error boundary for GLB loading — catches useGLTF Suspense failures */
import React from "react";

class GLBErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.error("[GLBRoom] Load failed — falling back to procedural:", err.message);
    this.props.onError();
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

function RoomContent({ onModelReady }: { onModelReady: () => void }) {
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const openCredits = useEnvStore((s) => s.openCredits);
  const [loadFailed, setLoadFailed] = useState(false);

  if (loadFailed) {
    return (
      <>
        <ProceduralRoom />
        <Hotspot
          position={[2.5, 1.4, -4.6]}
          args={[1.6, 1.2, 0.3]}
          color="#0a0a0a"
          glowColor="#4a9e9e"
          label="TV"
          onClick={() => {
            if (!transitioning) startTransition("tv", () => router.push("/tv"));
          }}
          disabled={transitioning}
        />
        <Hotspot
          position={[2.5, 1.5, -4]}
          args={[0.25, 0.6, 0.25]}
          color="#d4a853"
          glowColor="#d4a853"
          label="Lamp"
          onClick={() => {
            if (!transitioning) openCredits();
          }}
          disabled={transitioning}
        />
      </>
    );
  }

  return (
    <GLBErrorBoundary onError={() => setLoadFailed(true)}>
      <Suspense fallback={null}>
        <GLBRoom
          onModelReady={onModelReady}
          onLoadFailed={() => setLoadFailed(true)}
        />
      </Suspense>
    </GLBErrorBoundary>
  );
}

/* ================================================================== */
/*  HDR Environment — warm interior env map for reflections           */
/* ================================================================== */

function HDREnvironment() {
  const { scene } = useThree();
  const hdrIntensity = useDebug((s) => s.hdrIntensity);

  useEffect(() => {
    const loader = new RGBELoader();
    loader.load(
      HDR_PATH,
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = tex;
        scene.environmentIntensity = hdrIntensity;
        console.log("[MotelRoom] HDR environment map loaded");
      },
      undefined,
      () => {
        console.warn("[MotelRoom] HDR not found at", HDR_PATH, "— skipping env map");
      }
    );

    return () => {
      if (scene.environment) {
        scene.environment.dispose();
        scene.environment = null;
      }
    };
  }, [scene, hdrIntensity]);

  // Live update intensity without reloading the HDR
  useEffect(() => {
    scene.environmentIntensity = hdrIntensity;
  }, [scene, hdrIntensity]);

  return null;
}

/* ================================================================== */
/*  Deferred Post-Processing Stack                                    */
/* ================================================================== */

function PostProcessingStack() {
  const P = POST_CONFIG;
  const d = useDebug();
  const [bulbReady, setBulbReady] = useState(false);
  const [outlineTargetsReady, setOutlineTargetsReady] = useState(false);
  const hoverTarget = useHover((s) => s.target);

  const splitToning = useMemo(
    () =>
      new SplitToningEffect({
        shadowColor: P.splitToning.shadowColor,
        highlightColor: P.splitToning.highlightColor,
        intensity: d.splitToning ? P.splitToning.intensity : 0,
        contrast: P.splitToning.contrast,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [P.splitToning.shadowColor, P.splitToning.highlightColor, P.splitToning.intensity, P.splitToning.contrast, d.splitToning]
  );

  // Poll for bulb mesh availability (set by GLBRoom after load)
  useEffect(() => {
    if (_bulbMesh) { setBulbReady(true); return; }
    const id = setInterval(() => {
      if (_bulbMesh) { setBulbReady(true); clearInterval(id); }
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Poll for poster + screen mesh availability — both must exist before
  // we can populate the Outline selection.
  useEffect(() => {
    if (_screenMesh && _posterMesh) { setOutlineTargetsReady(true); return; }
    const id = setInterval(() => {
      if (_screenMesh && _posterMesh) {
        setOutlineTargetsReady(true);
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Split the two interactive targets into base (white, at-rest) and
  // hover (blue). The currently-hovered target is removed from the base
  // selection so the colours don't stack.
  const { baseSelection, hoverSelection } = useMemo(() => {
    const base: THREE.Object3D[] = [];
    const hover: THREE.Object3D[] = [];
    if (_screenMesh) {
      if (hoverTarget === "tv") hover.push(_screenMesh);
      else base.push(_screenMesh);
    }
    if (_posterMesh) {
      if (hoverTarget === "poster") hover.push(_posterMesh);
      else base.push(_posterMesh);
    }
    return { baseSelection: base, hoverSelection: hover };
  }, [hoverTarget, outlineTargetsReady]);

  return (
    <EffectComposer multisampling={0} enabled>
      <SMAA />

      <N8AO
        aoRadius={1.2}
        intensity={4}
        distanceFalloff={0.8}
        halfRes
      />

      <Bloom
        intensity={0.05}
        luminanceThreshold={0.95}
        luminanceSmoothing={0.01}
        mipmapBlur
      />
      <DepthOfField
        focusDistance={0.02}
        focalLength={0.008}
        bokehScale={0.3}
      />
      <BrightnessContrast brightness={-0.03} contrast={0.15} />
      <primitive object={splitToning} dispose={null} />

      {/* Interactive target glow — always-on white border around TV + poster.
          Bright enough to read at a glance, wide kernel for a soft halo,
          bloomed further via the global Bloom pass. */}
      <Outline
        selection={baseSelection}
        visibleEdgeColor={0xffffff}
        hiddenEdgeColor={0xffffff}
        edgeStrength={6}
        width={2000}
        kernelSize={KernelSize.VERY_LARGE}
        blur
        xRay={false}
        pulseSpeed={0}
      />
      {/* Hover accent — swaps the hovered target's outline from white → pure
          electric cyan and cranks strength so it reads as an obvious cue
          even against the TV's own emissive glow. */}
      <Outline
        selection={hoverSelection}
        visibleEdgeColor={0x00e5ff}
        hiddenEdgeColor={0x00e5ff}
        edgeStrength={16}
        width={2400}
        kernelSize={KernelSize.HUGE}
        blur
        xRay
        pulseSpeed={0.6}
      />

      <Noise opacity={d.noise ? P.noise.opacity : 0} blendFunction={BlendFunction.SCREEN} />
      <Vignette offset={P.vignette.offset} darkness={d.vignette ? P.vignette.darkness : 0} />
    </EffectComposer>
  );
}

/* ================================================================== */
/*  Scene — lights, fog, content, orbit, deferred post-processing     */
/* ================================================================== */

/** Subtle idle camera sway — pauses when user is orbiting */
/** Mouse parallax — camera target shifts subtly based on cursor position */
function CameraParallax() {
  const mouse = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });
  const baseTarget = useRef(new THREE.Vector3(...ACTIVE_CAMERA.target));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state) => {
    if (_cameraAnimating || _zoomedToTV) return;

    smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * 0.03;
    smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * 0.03;

    const controls = state.controls as any;
    if (controls?.target) {
      controls.target.x = baseTarget.current.x + smoothMouse.current.x * 0.8;
      controls.target.y = baseTarget.current.y - smoothMouse.current.y * 0.5;
      controls.update();
    }
  });

  return null;
}

function CameraAnimator() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Grab the OrbitControls ref
  useEffect(() => {
    // OrbitControls with makeDefault stores itself on the camera
    const controls = (camera as any).__r3f?.controls;
    if (controls) controlsRef.current = controls;
  });

  useFrame((state, delta) => {
    if (!_cameraAnimating || !_cameraAnim) return;

    _cameraAnimProgress += delta / _cameraAnim.duration;
    // Smooth ease-in-out
    const t = Math.min(_cameraAnimProgress, 1);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(_cameraAnimFrom.position, _cameraAnim.position, ease);

    // Update OrbitControls target
    const controls = state.controls as any;
    if (controls?.target) {
      controls.target.lerpVectors(_cameraAnimFrom.lookAt, _cameraAnim.lookAt, ease);
      controls.update();
    }

    if (t >= 1) {
      _cameraAnimating = false;
      _cameraAnim = null;
      if (_cameraAnimOnComplete) {
        _cameraAnimOnComplete();
        _cameraAnimOnComplete = null;
      }
    }
  });

  return null;
}

function CameraTracker() {
  const { camera } = useThree();
  useFrame(() => {
    _camPos = [camera.position.x, camera.position.y, camera.position.z];
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const target = camera.position.clone().add(dir.multiplyScalar(10));
    _camTarget = [target.x, target.y, target.z];
  });
  return null;
}

function RendererSync() {
  const { gl } = useThree();
  const exposure = useDebug((s) => s.exposure);
  const zoomedRef = useRef(false);
  const currentExposureRef = useRef(exposure);

  useEffect(() => {
    const listener = (zoomed: boolean) => { zoomedRef.current = zoomed; };
    _zoomListeners.add(listener);
    return () => { _zoomListeners.delete(listener); };
  }, []);

  // Sync base exposure ref when debug slider changes
  useEffect(() => {
    currentExposureRef.current = exposure;
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  // Lerp toward brighter when TV zoomed, back to base when unzoomed
  useFrame(() => {
    const target = zoomedRef.current ? exposure * 1.4 : exposure;
    currentExposureRef.current += (target - currentExposureRef.current) * 0.025;
    gl.toneMappingExposure = currentExposureRef.current;
  });

  return null;
}

function Scene() {
  const [modelReady, setModelReady] = useState(false);
  const d = useDebug();

  return (
    <>
      <RendererSync />
      <CameraTracker />
      <CameraAnimator />
      <CameraParallax />

      {/* ---- Lighting — dark room, lamp + TV + bounce fills ---- */}
      <ambientLight intensity={d.ambient} color={0x1a1410} />

      {/* Purple exterior light — neon bleed through the curtain/window */}
      <pointLight
        position={[20, 8, -6]}
        intensity={d.purpleLight}
        color={0x8844cc}
        distance={12}
        decay={1.5}
      />

      {/* (Lamp point light removed — bulb spot light in GLBRoom handles this now) */}

      {/* TV screen glow — positioned behind the screen, spills forward only */}
      <group>
        <spotLight
          position={[0, 1.5, -4.8]}
          intensity={d.tvGlow}
          color={0xaaccdd}
          distance={4}
          decay={2}
          angle={0.6}
          penumbra={0.8}
        />
        {/* SpotLight target — where the cone points */}
        <object3D position={[0, 0.5, -2]} ref={(obj) => {
          if (obj) {
            const spot = obj.parent?.children.find(
              (c) => (c as THREE.SpotLight).isSpotLight
            ) as THREE.SpotLight | undefined;
            if (spot) spot.target = obj;
          }
        }} />
      </group>

      <fog attach="fog" args={["#020201", 30, 80]} />

      <RoomContent onModelReady={() => setModelReady(true)} />
      <DustParticles />
      {modelReady && <TVScreenHTML />}

      <OrbitControls {...ORBIT_CONFIG} />

      <Preload all />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {/* ---- Deferred: HDR env map + post-processing (after model loads) ---- */}
      {modelReady && d.hdr && <HDREnvironment />}
      {modelReady && <PostProcessingStack />}
    </>
  );
}

/* ================================================================== */
/*  Loading Terminal — top-right overlay with timestamped log lines    */
/* ================================================================== */

function LoadingTerminal() {
  const lines = useLogLines();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const isReady = lines.some((l) => l.text.includes("scene ready"));

  // Fade out 1.5s after "scene ready", then remove from DOM
  useEffect(() => {
    if (!isReady) return;
    const t1 = setTimeout(() => setFading(true), 1500);
    const t2 = setTimeout(() => setVisible(false), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isReady]);

  if (!visible) return null;

  const visibleLines = lines.slice(-6);

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 999,
        fontFamily: "monospace",
        fontSize: "11px",
        lineHeight: 1.6,
        background: "rgba(0, 0, 0, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "4px",
        padding: "8px 12px",
        maxWidth: "340px",
        transition: "opacity 800ms ease",
        opacity: fading ? 0 : 1,
        pointerEvents: "none",
      }}
    >
      {visibleLines.map((line, i) => {
        const isComplete = line.text.includes("scene ready");
        return (
          <div
            key={`${line.time}-${i}`}
            style={{
              color: isComplete
                ? "rgba(255, 255, 255, 0.9)"
                : "rgba(255, 255, 255, 0.5)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>
              [{formatLogTime(line.time)}]
            </span>{" "}
            {line.text}
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Debug Panel — toggle effects + tune lighting live                 */
/* ================================================================== */

function DebugPanel() {
  const d = useDebug();

  // Only available in local development — never shown to end users on Vercel
  if (process.env.NODE_ENV !== "development") return null;

  if (!d.open) {
    return (
      <button
        onClick={() => useDebug.setState({ open: true })}
        style={{
          position: "fixed",
          bottom: "1rem",
          right: "1rem",
          zIndex: 1000,
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "4px",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "monospace",
          fontSize: "10px",
          padding: "4px 8px",
          cursor: "pointer",
        }}
      >
        debug
      </button>
    );
  }

  const toggles: Array<{ label: string; key: "bloom" | "noise" | "vignette" | "splitToning" | "smaa" | "hdr" | "ao" | "colorGrade" }> = [
    { label: "Bloom", key: "bloom" },
    { label: "Noise", key: "noise" },
    { label: "Vignette", key: "vignette" },
    { label: "Split Tone", key: "splitToning" },
    { label: "SMAA", key: "smaa" },
    { label: "HDR Env", key: "hdr" },
    { label: "AO", key: "ao" },
    { label: "Color Grade", key: "colorGrade" },
  ];

  const sliders: Array<{ label: string; key: "exposure" | "ambient" | "lamp" | "tvGlow" | "hdrIntensity" | "glbLight" | "purpleLight"; min: number; max: number; step: number }> = [
    { label: "Exposure", key: "exposure", min: 0.05, max: 2, step: 0.05 },
    { label: "Ambient", key: "ambient", min: 0, max: 1, step: 0.01 },
    { label: "Lamp", key: "lamp", min: 0, max: 20, step: 0.5 },
    { label: "TV Glow", key: "tvGlow", min: 0, max: 3, step: 0.1 },
    { label: "HDR Env", key: "hdrIntensity", min: 0, max: 0.5, step: 0.01 },
    { label: "GLB Light", key: "glbLight", min: 0, max: 200, step: 1 },
    { label: "Purple", key: "purpleLight", min: 0, max: 10, step: 0.1 },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "6px",
        padding: "10px 14px",
        fontFamily: "monospace",
        fontSize: "11px",
        color: "rgba(255,255,255,0.7)",
        minWidth: "180px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontWeight: 600, letterSpacing: "0.05em" }}>DEBUG</span>
        <button
          onClick={() => useDebug.setState({ open: false })}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "11px" }}
        >
          ✕
        </button>
      </div>

      {toggles.map(({ label, key }) => (
        <label
          key={key}
          style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={d[key]}
            onChange={() => d.toggle(key)}
            style={{ accentColor: "#ffbb66" }}
          />
          {label}
        </label>
      ))}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0 6px" }} />

      {sliders.map(({ label, key, min, max, step }) => (
        <div key={key} style={{ marginBottom: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>{label}</span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>{d[key].toFixed(step < 0.01 ? 3 : 2)}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={d[key]}
            onChange={(e) => d.set(key, parseFloat(e.target.value))}
            style={{ width: "100%", height: "4px", accentColor: "#ffbb66" }}
          />
        </div>
      ))}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0 6px" }} />

      {/* Camera readout */}
      <CameraReadout />

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0 6px" }} />

      {/* Copy all values to console */}
      <button
        onClick={() => {
          const values = {
            toggles: {
              bloom: d.bloom,
              noise: d.noise,
              vignette: d.vignette,
              splitToning: d.splitToning,
              smaa: d.smaa,
              hdr: d.hdr,
            },
            sliders: {
              exposure: d.exposure,
              ambient: d.ambient,
              lamp: d.lamp,
              tvGlow: d.tvGlow,
              hdrIntensity: d.hdrIntensity,
              glbLight: d.glbLight,
              purpleLight: d.purpleLight,
            },
            camera: {
              position: _camPos.map((n) => +n.toFixed(3)),
              lookAt: _camTarget.map((n) => +n.toFixed(3)),
            },
          };
          console.log("=== SCENE VALUES ===");
          console.log(JSON.stringify(values, null, 2));
          navigator.clipboard?.writeText(JSON.stringify(values, null, 2));
        }}
        style={{
          width: "100%",
          padding: "4px",
          background: "rgba(255,187,102,0.15)",
          border: "1px solid rgba(255,187,102,0.3)",
          borderRadius: "3px",
          color: "rgba(255,255,255,0.7)",
          fontFamily: "monospace",
          fontSize: "10px",
          cursor: "pointer",
        }}
      >
        Copy Values to Clipboard
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Camera Readout — live position + lookAt in the debug panel        */
/* ================================================================== */

function CameraReadout() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, []);

  const fmt = (arr: [number, number, number]) =>
    arr.map((n) => n.toFixed(2)).join(", ");

  return (
    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
      <div>pos: [{fmt(_camPos)}]</div>
      <div>lookAt: [{fmt(_camTarget)}]</div>
    </div>
  );
}

/* ================================================================== */
/*  TV Hint — subtle prompt to click the TV                           */
/* ================================================================== */

function TVHint() {
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show after 3s, fade after 8s
    const t1 = setTimeout(() => setFading(false), 3000);
    const hide = () => { setFading(true); setTimeout(() => setShow(false), 800); };
    _zoomListeners.add((zoomed) => { if (zoomed) hide(); });
    const t2 = setTimeout(hide, 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "4rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        fontFamily: "monospace",
        fontSize: "11px",
        color: "rgba(255,255,255,0.45)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        pointerEvents: "none",
        transition: "opacity 800ms ease",
        opacity: fading ? 0 : 1,
        animation: "pulse 2s ease-in-out infinite",
      }}
    >
      click the tv
    </div>
  );
}

/* ================================================================== */
/*  Back Button — returns camera to room overview after TV zoom       */
/* ================================================================== */

function BackButton() {
  const [show, setShow] = useState(_zoomedToTV);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    _zoomListeners.add(setShow);
    return () => { _zoomListeners.delete(setShow); };
  }, []);

  if (!show) return null;

  const handleClick = () => {
    // Defer to the TV's internal back handler first — e.g. product
    // detail should pop back to the grid instead of zooming out.
    if (_tvInternalBack && _tvInternalBack()) return;
    animateCameraTo(CAMERA_START.position, CAMERA_START.target, 2.0);
    setZoomedToTV(false);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        top: "1.4rem",
        left: "1.4rem",
        zIndex: 10000,
        background: hovered ? "rgba(10,10,10,0.75)" : "rgba(0,0,0,0.55)",
        border: `1px solid ${hovered ? "rgba(212,168,83,0.55)" : "rgba(255,255,255,0.18)"}`,
        borderRadius: "2px",
        color: hovered ? "#d4a853" : "rgba(232,224,200,0.8)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        padding: "9px 16px 9px 14px",
        cursor: "pointer",
        backdropFilter: "blur(6px)",
        transition: "all 200ms ease",
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: hovered
          ? "0 0 22px rgba(212,168,83,0.22), inset 0 0 12px rgba(212,168,83,0.04)"
          : "0 0 14px rgba(0,0,0,0.5)",
      }}
    >
      <span style={{ fontSize: "11px" }}>←</span>
      <span>Back</span>
    </button>
  );
}

/* ================================================================== */
/*  Canvas wrapper — client-only                                      */
/* ================================================================== */

export default function MotelRoomScene() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <LoadingTerminal />
      <TVHint />
      <BackButton />
      <DebugPanel />
      <Canvas
        shadows="soft"
        camera={{ position: ACTIVE_CAMERA.position, fov: CAMERA_FOV }}
        dpr={[0.75, 1]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.5, // synced via RendererSync
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: "#050505" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
