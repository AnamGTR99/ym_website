"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

/**
 * Minimal GLB test page — no post-processing, no Bruno scene code,
 * no complex lighting. Just: load the GLB, render it, orbit controls.
 *
 * If this renders on Vercel: the GLB and Draco pipeline work fine,
 * the issue is in MotelRoomScene's complex scene code.
 *
 * If this also fails: the GLB, Draco decoder, or CSP is broken.
 */

function Model() {
  const { scene } = useGLTF("/models/setup.glb", "/draco/");
  return <primitive object={scene} />;
}

function ErrorFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

export default function RoomTestPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111" }}>
      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 10,
          color: "white",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        GLB TEST — /models/setup.glb via useGLTF + Draco at /draco/
      </div>
      <Canvas camera={{ position: [15, 5, 0], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <Suspense fallback={<ErrorFallback />}>
          <Model />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
