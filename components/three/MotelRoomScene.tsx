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
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  BrightnessContrast,
  DepthOfField,
  N8AO,
  Noise,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { SplitToningEffect } from "./SplitToningEffect";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { DRACOLoader, GLTFLoader, RGBELoader } from "three-stdlib";
import { create } from "zustand";
import { useEnvStore } from "@/stores/env";

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
  exposure: 0.5,
  ambient: 0.1,
  lamp: 5,
  tvGlow: 0.3,
  glbLight: 200,
  hdrIntensity: 0.12,
  purpleLight: 2.0,
  toggle: (key) => setState({ [key]: !getState()[key] }),
  set: (key, val) => setState({ [key]: val }),
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
  position: [-17.537, 7.184, -1.632] as [number, number, number],
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
/*  DRACO SETUP — force WASM decoding + parallel preload              */
/* ================================================================== */

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(DRACO_PATH);
dracoLoader.setDecoderConfig({ type: "wasm" });
dracoLoader.preload();

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

function setZoomedToTV(val: boolean) {
  _zoomedToTV = val;
  _zoomListeners.forEach((fn) => fn(val));
}

function animateCameraTo(
  pos: [number, number, number],
  lookAt: [number, number, number],
  duration = 2.5
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
}

/** Module-level ref for the bulb mesh — shared between GLBRoom and PostProcessingStack for GodRays */
let _bulbMesh: THREE.Mesh | null = null;

/** Module-level ref for the screen mesh — used by TVScreenHTML to position content */
let _screenMesh: THREE.Mesh | null = null;

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

  /* ---- Manual GLB load with full lifecycle logging ---- */
  useEffect(() => {
    resetLog();
    addLog("initialising draco decoder...");

    // Observe WASM decoder readiness (internal promise)
    const decoderPending = (dracoLoader as unknown as { decoderPending?: Promise<void> })
      .decoderPending;
    if (decoderPending) {
      decoderPending.then(() => addLog("wasm decoder ready")).catch(() => {});
    } else {
      addLog("wasm decoder ready");
    }

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    addLog("fetching model...");

    let lastPct = 0;
    loader.load(
      GLB_PATH,
      (gltf) => {
        addLog("parsing geometry...");

        // Tag interactive meshes + diagnostics
        const meshNames: string[] = [];
        let totalTriangles = 0;
        _interactiveOriginals.clear();
        gltf.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            meshNames.push(obj.name);
            const geo = obj.geometry;
            totalTriangles += geo.index
              ? geo.index.count / 3
              : (geo.attributes.position?.count ?? 0) / 3;
          }
        });

        // Tag interactive objects by name — handles both Mesh and Group nodes.
        // When the named object is a Group, tag all descendant meshes.
        for (const [name, action] of Object.entries(INTERACTIVE_MESHES)) {
          const obj = gltf.scene.getObjectByName(name);
          if (!obj) continue;
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

        // Tame embedded lights from the GLB — store ref + grab position for cone
        const embeddedLights: string[] = [];
        gltf.scene.traverse((obj) => {
          if ((obj as THREE.Light).isLight) {
            const light = obj as THREE.Light;
            obj.updateWorldMatrix(true, false);
            const lightPos = new THREE.Vector3();
            obj.getWorldPosition(lightPos);
            embeddedLights.push(
              `${obj.name || "(unnamed)"} [${light.type}] intensity=${light.intensity} pos=[${lightPos.toArray().map(n => n.toFixed(2))}]`
            );
            light.intensity = useDebug.getState().glbLight;
            glbLightRef.current = light;
            // Use the embedded light position for the cone + spot light
            setBulbPos([lightPos.x, lightPos.y, lightPos.z]);
            console.log("[MotelRoom] Using embedded light position for cone:", lightPos.toArray());
          }
        });
        if (embeddedLights.length > 0) {
          console.warn(
            `[MotelRoom GLB] Tamed ${embeddedLights.length} embedded lights:\n  ` +
              embeddedLights.join("\n  ")
          );
        }

        console.log(
          `[MotelRoom GLB] Parsed — ${meshNames.length} meshes, ` +
            `${Math.round(totalTriangles).toLocaleString()} tris\n` +
            `  Meshes: ${meshNames.join(", ")}`
        );

        const missing = Object.keys(INTERACTIVE_MESHES).filter(
          (n) => !meshNames.includes(n)
        );
        if (missing.length > 0) {
          console.warn("[MotelRoom GLB] Interactive meshes MISSING:", missing);
        }

        // Find the screen mesh for flicker animation
        let screenMesh: THREE.Mesh | null = null;
        gltf.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.name.toLowerCase() === "screen") {
            screenMesh = obj;
            const m = obj.material as THREE.MeshStandardMaterial;
            if (m) {
              m.emissive = new THREE.Color(0xffffff);
              m.emissiveIntensity = 2.5;
              m.needsUpdate = true;
            }
          }
        });
        screenRef.current = screenMesh;
        _screenMesh = screenMesh;

        // Material pass — Cycles filmic shading
        applyMaterialPass(gltf.scene);

        // Find the bulb position for our spot light
        let foundBulbPos: [number, number, number] | null = null;
        gltf.scene.traverse((obj) => {
          if (obj.userData._bulbWorldPos) {
            foundBulbPos = obj.userData._bulbWorldPos as [number, number, number];
            console.log("[MotelRoom] Bulb position:", foundBulbPos);
          }
        });
        if (foundBulbPos) {
          setBulbPos(foundBulbPos);
        }

        setModel(gltf.scene);
      },
      (progress) => {
        if (progress.lengthComputable) {
          const pct = Math.floor((progress.loaded / progress.total) * 100);
          const rounded = Math.floor(pct / 10) * 10;
          if (rounded > lastPct && rounded <= 100) {
            lastPct = rounded;
            addLog(`loading ${rounded}%`);
          }
        }
      },
      (err) => {
        addLog("model load failed ✗");
        console.error("[MotelRoom] GLB load error:", err);
        onLoadFailedRef.current();
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (e.object.name.toLowerCase() === "screen") {
      animateCameraTo(CAMERA_TV.position, CAMERA_TV.target, 2.5);
      setTimeout(() => setZoomedToTV(true), 2500);
      return;
    }

    const action = e.object.userData.interactionAction as
      | InteractionAction
      | undefined;
    if (!action) return;

    if (action === "navigate-tv") {
      animateCameraTo(CAMERA_TV.position, CAMERA_TV.target, 2.5);
      setTimeout(() => setZoomedToTV(true), 2500);
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
        1.2
      );
      setTimeout(() => {
        startTransition("credits", () => router.push("/credits"));
      }, 800);
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (e.object.userData.interactionAction) {
      document.body.style.cursor = "pointer";
      _hoveredInteractive = e.object as THREE.Mesh;
    }
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "default";
    resetHoveredMesh();
  };

  /* ---- Hover pulse — subtle scale bump + white emissive glow ---- */
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
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat) {
      const glow = 0.3 + Math.sin(t * 2.5) * 0.15;
      mat.emissive.setRGB(
        orig.emissive.r + glow,
        orig.emissive.g + glow,
        orig.emissive.b + glow
      );
      mat.emissiveIntensity = orig.emissiveIntensity + glow;
    }
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
          count={DUST_COUNT}
          array={positions}
          itemSize={3}
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

type TVChannel = "idle" | "menu" | "shop" | "music" | "credits";

const CHANNELS: { id: TVChannel; label: string; chNum: string }[] = [
  { id: "shop", label: "SHOP", chNum: "01" },
  { id: "music", label: "MUSIC", chNum: "02" },
  { id: "credits", label: "CREDITS", chNum: "03" },
];

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

/* ---- Channel menu — grid of selectable channels ---- */

function TVMenuScreen({ onSelect }: { onSelect: (ch: TVChannel) => void }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "40px 50px" }}>
      <div style={{
        fontSize: "18px",
        fontWeight: 700,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        textShadow: "1.5px 0 #ff0040, -1.5px 0 #00ffcc",
        marginBottom: "8px",
      }}>
        YUNMAKAI TV
      </div>
      <div style={{ fontSize: "9px", color: "rgba(200,192,168,0.4)", letterSpacing: "0.2em", marginBottom: "28px" }}>
        SELECT CHANNEL
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {CHANNELS.map((ch, i) => (
          <div
            key={ch.id}
            onClick={(e) => { e.stopPropagation(); onSelect(ch.id); }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "10px 16px",
              cursor: "pointer",
              background: hoveredIdx === i ? "rgba(212,168,83,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${hoveredIdx === i ? "rgba(212,168,83,0.4)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: "2px",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{
              fontSize: "20px",
              fontWeight: 700,
              color: hoveredIdx === i ? "#d4a853" : "rgba(255,255,255,0.3)",
              fontFamily: "monospace",
              minWidth: "36px",
              transition: "color 0.15s ease",
            }}>
              {ch.chNum}
            </span>
            <span style={{
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: hoveredIdx === i ? "#c8c0a8" : "rgba(200,192,168,0.6)",
              transition: "color 0.15s ease",
            }}>
              {ch.label}
            </span>
            <span style={{
              marginLeft: "auto",
              fontSize: "10px",
              color: "rgba(255,255,255,0.2)",
            }}>
              ▶
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Channel pages — placeholder content per channel ---- */

function TVChannelPage({ channel, onBack }: { channel: TVChannel; onBack: () => void }) {
  const info = CHANNELS.find((c) => c.id === channel);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "40px 50px" }}>
      {/* Header with back button */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          style={{
            fontSize: "11px",
            color: "rgba(200,192,168,0.5)",
            cursor: "pointer",
            padding: "4px 10px",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "2px",
            letterSpacing: "0.1em",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(212,168,83,0.4)"; e.currentTarget.style.color = "#d4a853"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(200,192,168,0.5)"; }}
        >
          ← BACK
        </div>
        <div style={{
          fontSize: "16px",
          fontWeight: 700,
          letterSpacing: "0.25em",
          textShadow: "1.5px 0 #ff0040, -1.5px 0 #00ffcc",
        }}>
          CH-{info?.chNum} {info?.label}
        </div>
      </div>

      {/* Channel content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
        {channel === "shop" && (
          <>
            <div style={{ fontSize: "11px", color: "rgba(200,192,168,0.5)", letterSpacing: "0.15em", marginBottom: "4px" }}>
              YUNMAKAI GOODS
            </div>
            {["MOTEL TEES", "SOLUS VINYL", "BAYOU PRINTS"].map((item, i) => (
              <div key={i} style={{
                padding: "10px 14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
                fontSize: "12px",
                letterSpacing: "0.15em",
                color: "rgba(200,192,168,0.7)",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(212,168,83,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                <span>{item}</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>COMING SOON</span>
              </div>
            ))}
          </>
        )}
        {channel === "music" && (
          <>
            <div style={{ fontSize: "11px", color: "rgba(200,192,168,0.5)", letterSpacing: "0.15em", marginBottom: "4px" }}>
              NOW PLAYING
            </div>
            {["TRACK 01 — SWAMP HYMN", "TRACK 02 — NEON MOTEL", "TRACK 03 — BAYOU DRIFT"].map((item, i) => (
              <div key={i} style={{
                padding: "10px 14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
                fontSize: "12px",
                letterSpacing: "0.1em",
                color: "rgba(200,192,168,0.7)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(212,168,83,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>▶</span>
                <span>{item}</span>
              </div>
            ))}
          </>
        )}
        {channel === "credits" && (
          <>
            <div style={{ fontSize: "11px", color: "rgba(200,192,168,0.5)", letterSpacing: "0.15em", marginBottom: "8px" }}>
              CREDITS
            </div>
            <div style={{ fontSize: "12px", lineHeight: 2.2, color: "rgba(200,192,168,0.6)", letterSpacing: "0.1em" }}>
              <div>DIRECTION — <span style={{ color: "#c8c0a8" }}>YUNMAKAI</span></div>
              <div>MUSIC — <span style={{ color: "#c8c0a8" }}>SOLUS RECORDS</span></div>
              <div>3D ENVIRONMENT — <span style={{ color: "#c8c0a8" }}>BRUNO</span></div>
              <div>DEVELOPMENT — <span style={{ color: "#c8c0a8" }}>STUDIO</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- VHS Screen shell — wraps content with CRT/VHS effects ---- */

function VHSScreen({ interactive, onScreenClick, onHoverStart, onHoverEnd }: { interactive: boolean; onScreenClick: () => void; onHoverStart: () => void; onHoverEnd: () => void }) {
  const [channel, setChannel] = useState<TVChannel>("idle");
  const [time, setTime] = useState("00:00:00");

  // Reset to idle when zooming out
  useEffect(() => {
    if (!interactive) setChannel("idle");
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

  // When zoomed and still on idle, auto-switch to menu
  useEffect(() => {
    if (interactive && channel === "idle") {
      const t = setTimeout(() => setChannel("menu"), 300);
      return () => clearTimeout(t);
    }
  }, [interactive, channel]);

  const activeChNum = channel === "idle" || channel === "menu"
    ? "--"
    : CHANNELS.find((c) => c.id === channel)?.chNum ?? "--";

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
      {channel === "menu" && <TVMenuScreen onSelect={setChannel} />}
      {channel !== "idle" && channel !== "menu" && (
        <TVChannelPage channel={channel} onBack={() => setChannel("menu")} />
      )}

      {/* REC indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "14px",
          right: "18px",
          fontSize: "12px",
          color: "#ff2020",
          textShadow: "0 0 6px rgba(255, 0, 0, 0.6)",
          fontFamily: "monospace",
          animation: "vhsRecBlink 1s step-end infinite",
          pointerEvents: "none",
        }}
      >
        ● REC {time}
      </div>

      {/* Channel */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          right: "18px",
          fontSize: "16px",
          color: "#ffffff",
          textShadow: "0 0 6px rgba(255, 255, 255, 0.3)",
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      >
        CH-{activeChNum}
      </div>

      {/* Play indicator */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "18px",
          fontSize: "11px",
          color: "rgba(255, 255, 255, 0.4)",
          fontFamily: "monospace",
          letterSpacing: "0.1em",
          pointerEvents: "none",
        }}
      >
        {channel === "idle" ? "▶ PLAY" : "● LIVE"}
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
      animateCameraTo(CAMERA_TV.position, CAMERA_TV.target, 2.5);
      setTimeout(() => setZoomedToTV(true), 2500);
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
    <GLBRoom
      onModelReady={onModelReady}
      onLoadFailed={() => setLoadFailed(true)}
    />
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
      <Noise opacity={d.noise ? P.noise.opacity : 0} blendFunction={BlendFunction.SCREEN} />
      <Vignette offset={P.vignette.offset} darkness={d.vignette ? P.vignette.darkness : 0} />
    </EffectComposer>
  );
}

/* ================================================================== */
/*  Scene — lights, fog, content, orbit, deferred post-processing     */
/* ================================================================== */

/** Subtle idle camera sway — pauses when user is orbiting */
function CameraBreathing() {
  const { camera } = useThree();
  const basePos = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const userInteracting = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onStart = () => {
      userInteracting.current = true;
      initialized.current = false;
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
    const onEnd = () => {
      idleTimer.current = setTimeout(() => {
        userInteracting.current = false;
      }, 2000);
    };
    window.addEventListener("pointerdown", onStart);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("wheel", onStart);
    window.addEventListener("wheel", onEnd);
    return () => {
      window.removeEventListener("pointerdown", onStart);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("wheel", onStart);
      window.removeEventListener("wheel", onEnd);
    };
  }, []);

  useFrame((state) => {
    if (_cameraAnimating || userInteracting.current) {
      initialized.current = false;
      return;
    }
    if (!initialized.current) {
      basePos.current.copy(camera.position);
      initialized.current = true;
    }
    const t = state.clock.elapsedTime;
    camera.position.x = basePos.current.x + Math.sin(t * 0.3) * 0.08 + Math.sin(t * 0.7) * 0.04;
    camera.position.y = basePos.current.y + Math.sin(t * 0.4) * 0.05 + Math.cos(t * 0.6) * 0.03;
    camera.position.z = basePos.current.z + Math.cos(t * 0.35) * 0.06;
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
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
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
      <CameraBreathing />

      {/* ---- Lighting — dark room, lamp + TV + bounce fills ---- */}
      <ambientLight intensity={d.ambient} color={0x0a0806} />

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

  const sliders: Array<{ label: string; key: "exposure" | "ambient" | "lamp" | "tvGlow" | "hdrIntensity" | "glbLight"; min: number; max: number; step: number }> = [
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

  useEffect(() => {
    _zoomListeners.add(setShow);
    return () => { _zoomListeners.delete(setShow); };
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => {
        animateCameraTo(CAMERA_START.position, CAMERA_START.target, 2.0);
        setZoomedToTV(false);
      }}
      style={{
        position: "fixed",
        top: "1.5rem",
        left: "1.5rem",
        zIndex: 1000,
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "6px",
        color: "rgba(255,255,255,0.7)",
        fontFamily: "monospace",
        fontSize: "12px",
        padding: "8px 16px",
        cursor: "pointer",
        backdropFilter: "blur(4px)",
        transition: "opacity 300ms ease",
      }}
    >
      ← back
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
