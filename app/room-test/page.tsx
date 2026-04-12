"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";

/**
 * GLB loading diagnostic page.
 * Tests multiple loading strategies and shows errors on screen.
 */

export default function RoomTestPage() {
  const [log, setLog] = useState<string[]>(["Starting diagnostics..."]);
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  const addLog = (msg: string) => setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  useEffect(() => {
    async function diagnose() {
      // Test 1: Can we fetch the GLB at all?
      addLog("Test 1: Fetching /models/setup.glb via fetch()...");
      try {
        const res = await fetch("/models/setup.glb");
        addLog(`  Status: ${res.status}, Content-Type: ${res.headers.get("content-type")}, Size: ${res.headers.get("content-length") || "unknown"}`);
        if (!res.ok) {
          addLog(`  FAIL: HTTP ${res.status}`);
          return;
        }
        const blob = await res.blob();
        addLog(`  OK: Downloaded ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
        const url = URL.createObjectURL(blob);
        setModelUrl(url);
      } catch (err) {
        addLog(`  FAIL: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }

      // Test 2: Can we fetch the Draco decoder?
      addLog("Test 2: Fetching /draco/draco_decoder.wasm...");
      try {
        const res = await fetch("/draco/draco_decoder.wasm");
        addLog(`  Status: ${res.status}, Content-Type: ${res.headers.get("content-type")}, Size: ${res.headers.get("content-length") || "unknown"}`);
        if (!res.ok) {
          addLog(`  FAIL: HTTP ${res.status}`);
        } else {
          const buf = await res.arrayBuffer();
          addLog(`  OK: ${(buf.byteLength / 1024).toFixed(0)} KB`);
        }
      } catch (err) {
        addLog(`  FAIL: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Test 3: Can we instantiate WebAssembly?
      addLog("Test 3: WebAssembly support...");
      try {
        const wasmSupported = typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function";
        addLog(`  WebAssembly available: ${wasmSupported}`);
      } catch (err) {
        addLog(`  FAIL: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Test 4: Can we create a blob Worker?
      addLog("Test 4: Blob Worker creation...");
      try {
        const blob = new Blob(["postMessage('ok')"], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        await new Promise<void>((resolve, reject) => {
          worker.onmessage = () => { addLog("  OK: Blob worker created and responded"); resolve(); };
          worker.onerror = (e) => { addLog(`  FAIL: Worker error: ${e.message}`); reject(e); };
          setTimeout(() => { addLog("  TIMEOUT: Worker didn't respond in 3s"); reject(new Error("timeout")); }, 3000);
        });
        worker.terminate();
        URL.revokeObjectURL(url);
      } catch (err) {
        addLog(`  FAIL: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Test 5: Try loading with THREE.GLTFLoader directly
      addLog("Test 5: Loading GLB with THREE.GLTFLoader + DRACOLoader...");
      try {
        const { GLTFLoader } = await import("three-stdlib");
        const { DRACOLoader } = await import("three-stdlib");
        const draco = new DRACOLoader();
        draco.setDecoderPath("/draco/");
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);

        await new Promise<void>((resolve, reject) => {
          loader.load(
            "/models/setup.glb",
            (gltf) => {
              const meshCount = gltf.scene.children.length;
              let totalVerts = 0;
              gltf.scene.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                  totalVerts += obj.geometry.attributes.position?.count ?? 0;
                }
              });
              addLog(`  OK: ${meshCount} root children, ${totalVerts.toLocaleString()} vertices`);
              resolve();
            },
            (progress) => {
              if (progress.lengthComputable) {
                const pct = Math.round((progress.loaded / progress.total) * 100);
                if (pct % 25 === 0) addLog(`  Progress: ${pct}%`);
              }
            },
            (err) => {
              addLog(`  FAIL: ${err instanceof Error ? err.message : String(err)}`);
              reject(err);
            }
          );
        });
      } catch (err) {
        addLog(`  FAIL: ${err instanceof Error ? err.message : String(err)}`);
      }

      addLog("Diagnostics complete.");
    }

    diagnose();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0a0a0a", color: "#e0e0e0", fontFamily: "monospace", fontSize: 12, display: "flex" }}>
      {/* Left: diagnostic log */}
      <div style={{ width: "50%", padding: 16, overflowY: "auto", borderRight: "1px solid #333" }}>
        <h2 style={{ color: "#d4a853", marginBottom: 12, fontSize: 14, letterSpacing: "0.15em" }}>GLB DIAGNOSTIC LOG</h2>
        {log.map((line, i) => (
          <div key={i} style={{ marginBottom: 4, color: line.includes("FAIL") ? "#ff4444" : line.includes("OK") ? "#44ff44" : "#999" }}>
            {line}
          </div>
        ))}
      </div>

      {/* Right: 3D viewport (if model loaded) */}
      <div style={{ width: "50%", position: "relative" }}>
        <Canvas camera={{ position: [15, 5, 0], fov: 50 }}>
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 5]} intensity={2} />
          <OrbitControls />
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#333" wireframe />
          </mesh>
        </Canvas>
        <div style={{ position: "absolute", top: 8, left: 8, color: "#666", fontSize: 10 }}>
          Canvas renders (wireframe box = baseline)
        </div>
      </div>
    </div>
  );
}
