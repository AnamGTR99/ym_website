"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { useEnvStore } from "@/stores/env";

/* ------------------------------------------------------------------ */
/*  Procedural motel room — placeholder geometry                       */
/*  Swap out <ProceduralRoom /> for <GLBRoom /> when asset lands.     */
/* ------------------------------------------------------------------ */

function ProceduralRoom() {
  return (
    <group>
      {/* Floor — dark stained wood */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1410" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Back wall — peeling wallpaper */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#2a1f18" roughness={1} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#241a14" roughness={1} />
      </mesh>

      {/* Right wall */}
      <mesh position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#241a14" roughness={1} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#15100b" roughness={1} />
      </mesh>

      {/* Bed (low box suggestion) */}
      <mesh position={[-2.5, 0.4, -3]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.8, 4]} />
        <meshStandardMaterial color="#3a2820" roughness={0.8} />
      </mesh>
      <mesh position={[-2.5, 0.9, -3]} castShadow>
        <boxGeometry args={[2.4, 0.15, 3.9]} />
        <meshStandardMaterial color="#5a3a2a" roughness={0.7} />
      </mesh>

      {/* Nightstand */}
      <mesh position={[-1, 0.5, -4]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1, 0.6]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Interactive hotspots — TV, door, lamp                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Scene — camera, lights, fog, interactions                          */
/* ------------------------------------------------------------------ */

function Scene() {
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const openCredits = useEnvStore((s) => s.openCredits);

  const handleTV = () => {
    if (transitioning) return;
    startTransition("tv", () => router.push("/tv"));
  };

  const handleLamp = () => {
    if (transitioning) return;
    openCredits();
  };

  return (
    <>
      {/* Warm amber ambient — matches brand palette */}
      <ambientLight intensity={0.15} color="#d4a853" />

      {/* Lamp point light — warm hotspot */}
      <pointLight
        position={[2.5, 2.2, -3]}
        intensity={8}
        color="#d4a853"
        distance={8}
        decay={2}
        castShadow
      />

      {/* Fill light from camera side */}
      <directionalLight position={[0, 3, 3]} intensity={0.3} color="#6bc4c4" />

      {/* Fog — bayou mist bleeding into the room */}
      <fog attach="fog" args={["#050505", 5, 15]} />

      {/* Base room geometry */}
      <ProceduralRoom />

      {/* TV — click to enter catalogue */}
      <Hotspot
        position={[2.5, 1.4, -4.6]}
        args={[1.6, 1.2, 0.3]}
        color="#0a0a0a"
        glowColor="#4a9e9e"
        label="TV"
        onClick={handleTV}
        disabled={transitioning}
      />

      {/* Lamp — click for credits */}
      <Hotspot
        position={[2.5, 1.5, -4]}
        args={[0.25, 0.6, 0.25]}
        color="#d4a853"
        glowColor="#d4a853"
        label="Lamp"
        onClick={handleLamp}
        disabled={transitioning}
      />

      {/* Camera + orbit — pan only, no escape */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.1}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
        target={[0, 1.4, -3]}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Canvas wrapper — client-only                                       */
/* ------------------------------------------------------------------ */

export default function MotelRoomScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.6, 2], fov: 55 }}
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
