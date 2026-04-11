"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  90s TV Room — retro CRT display surface for Yunmakai 3D goods     */
/*                                                                    */
/*  - Procedural wood-panel room (swap later for GLB via useGLTF)    */
/*  - CRT TV prop with screen plane that displays product image       */
/*  - If glbUrl present: product GLB rotates as a figurine on the TV */
/*  - Always works: image fallback on screen plane for all products  */
/* ------------------------------------------------------------------ */

/* ----- Procedural room geometry ---------------------------------- */

function RetroRoom() {
  return (
    <group>
      {/* Shag carpet floor — warm burnt orange */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#5c2d0e" roughness={1} />
      </mesh>

      {/* Wood-panel back wall */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#3a2418" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Panel grooves — vertical stripes for wood-panel look */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-4.2 + i * 1.2, 2.5, -4.99]} receiveShadow>
          <planeGeometry args={[0.02, 5]} />
          <meshStandardMaterial color="#1a0f08" />
        </mesh>
      ))}

      {/* Left wall */}
      <mesh position={[-6, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#2e1d13" roughness={0.9} />
      </mesh>

      {/* Right wall */}
      <mesh position={[6, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#2e1d13" roughness={0.9} />
      </mesh>

      {/* Ceiling — dark */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#15100b" roughness={1} />
      </mesh>

      {/* TV stand — dark wood cabinet */}
      <mesh position={[0, 0.45, -3.2]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.9, 1.4]} />
        <meshStandardMaterial color="#1a0f08" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Cabinet trim */}
      <mesh position={[0, 0.91, -3.2]} castShadow>
        <boxGeometry args={[3.3, 0.04, 1.5]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.7} />
      </mesh>

      {/* Side lamp — warm glow source */}
      <mesh position={[-3.5, 1.2, -3.5]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.7, 16]} />
        <meshStandardMaterial
          color="#d4a853"
          emissive="#d4a853"
          emissiveIntensity={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[-3.5, 0.7, -3.5]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
        <meshStandardMaterial color="#2a1a10" />
      </mesh>
    </group>
  );
}

/* ----- CRT TV body with screen plane ---------------------------- */

interface CRTTVProps {
  screenTexture: THREE.Texture | null;
}

function CRTTV({ screenTexture }: CRTTVProps) {
  const screenRef = useRef<THREE.Mesh>(null);

  // Subtle CRT flicker on screen emissive intensity
  useFrame((state) => {
    if (!screenRef.current) return;
    const mat = screenRef.current.material as THREE.MeshStandardMaterial;
    const t = state.clock.elapsedTime;
    mat.emissiveIntensity = 0.7 + Math.sin(t * 40) * 0.03 + Math.sin(t * 7) * 0.05;
  });

  return (
    <group position={[0, 1.55, -3.2]}>
      {/* TV outer case — cream plastic */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.8, 1.2]} />
        <meshStandardMaterial color="#c4a882" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* TV face bezel — darker */}
      <mesh position={[0, 0, 0.605]} castShadow>
        <boxGeometry args={[2.2, 1.6, 0.02]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.9} />
      </mesh>

      {/* Screen plane — product image texture */}
      <mesh ref={screenRef} position={[-0.25, 0.1, 0.62]}>
        <planeGeometry args={[1.55, 1.15]} />
        <meshStandardMaterial
          map={screenTexture}
          emissive="#ffffff"
          emissiveMap={screenTexture}
          emissiveIntensity={0.7}
          color={screenTexture ? "#ffffff" : "#1a3a3a"}
          toneMapped={false}
        />
      </mesh>

      {/* Control panel on right side of TV face */}
      <mesh position={[0.9, -0.2, 0.62]}>
        <planeGeometry args={[0.35, 1.1]} />
        <meshStandardMaterial color="#1a0f08" roughness={0.9} />
      </mesh>

      {/* Knobs */}
      {[0.3, 0, -0.3].map((y, i) => (
        <mesh key={i} position={[0.9, -0.1 + y, 0.64]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
          <meshStandardMaterial color="#8a6a4a" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* "SOLUS" label plate under screen */}
      <mesh position={[-0.25, -0.72, 0.62]}>
        <planeGeometry args={[0.8, 0.12]} />
        <meshStandardMaterial color="#d4a853" emissive="#d4a853" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

/* ----- Product GLB figurine on top of TV ------------------------- */

interface ProductFigurineProps {
  glbUrl: string;
}

function ProductFigurine({ glbUrl }: ProductFigurineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(glbUrl);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.004;
    }
  });

  return (
    <group ref={groupRef} position={[0, 2.7, -3.2]} scale={[0.5, 0.5, 0.5]}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

/* ----- Scene assembly -------------------------------------------- */

interface SceneProps {
  productImageUrl: string | null;
  glbUrl: string | null;
}

function Scene({ productImageUrl, glbUrl }: SceneProps) {
  const [screenTexture, setScreenTexture] = useState<THREE.Texture | null>(null);

  // Load product image as a Three texture — manual, with error handling
  useEffect(() => {
    if (!productImageUrl) {
      setScreenTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    let cancelled = false;
    loader.load(
      productImageUrl,
      (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        setScreenTexture(tex);
      },
      undefined,
      () => {
        if (!cancelled) setScreenTexture(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [productImageUrl]);

  return (
    <>
      {/* Lights — warm lamp + teal CRT bleed */}
      <ambientLight intensity={0.2} color="#d4a853" />
      <pointLight
        position={[-3.5, 1.5, -3.5]}
        intensity={6}
        color="#d4a853"
        distance={8}
        decay={2}
        castShadow
      />
      <pointLight
        position={[0, 1.8, -2]}
        intensity={2}
        color="#4a9e9e"
        distance={5}
        decay={2}
      />
      <directionalLight position={[0, 4, 4]} intensity={0.25} color="#6bc4c4" />

      <Environment preset="apartment" background={false} />

      <fog attach="fog" args={["#0a0a0a", 4, 12]} />

      <RetroRoom />
      <CRTTV screenTexture={screenTexture} />

      {glbUrl && (
        <Suspense fallback={null}>
          <ProductFigurine glbUrl={glbUrl} />
        </Suspense>
      )}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={6}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.05}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
        target={[0, 1.55, -3.2]}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

/* ----- Public Canvas wrapper ------------------------------------- */

interface TVRoomSceneProps {
  productImageUrl: string | null;
  glbUrl: string | null;
}

export default function TVRoomScene({ productImageUrl, glbUrl }: TVRoomSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.8, 0.8], fov: 40 }}
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#050505" }}
    >
      <Suspense fallback={null}>
        <Scene productImageUrl={productImageUrl} glbUrl={glbUrl} />
      </Suspense>
    </Canvas>
  );
}

/* Preload nothing by default — product GLBs are dynamic per page */
