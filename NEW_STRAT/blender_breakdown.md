# GLB Asset Audit — setup.glb

**Date:** 2026-04-12
**File:** `public/models/setup.glb`
**Size on disk:** 42 MB (44,188,496 bytes)
**Generator:** Khronos glTF Blender I/O v5.1.18
**Tag:** TEST-1025PM (commit 036b8c8)

---

## Files in the Asset Pipeline

| File | Location | Size | In Git? | Used By |
|---|---|---|---|---|
| `setup.glb` | `public/models/` | 42 MB | Yes (force-added past gitignore) | `MotelRoomScene.tsx` via `GLB_PATH = "/models/setup.glb"` |
| `room.glb` | `public/models/` | 142 MB | No (gitignored) | NOT USED — original uncompressed version from Bruno's first export |
| `setup-opt.glb` | `public/models/` | 17 MB | No (gitignored) | NOT USED — gltf-transform optimized version (broke visual quality) |
| `old_room_2k.hdr` | `public/textures/` | 6.1 MB | Yes | `MotelRoomScene.tsx` via `HDR_PATH = "/textures/old_room_2k.hdr"` |
| `bayou-bg.jpg` | `public/images/` | 430 KB | Yes | `CreditsOverlay.tsx` poster image |

---

## Compression Status

**Draco mesh compression: ENABLED** (`KHR_draco_mesh_compression` in extensionsRequired)

Draco is compressing the geometry. Without Draco, the meshes would be ~15-20MB.
With Draco, the total mesh data on disk is **~5 MB**.

**Texture compression: NONE.** All textures are raw JPEG or PNG embedded in the GLB.
Textures account for **~37 MB** of the 42 MB file (88%).

| What | Disk size | % of file |
|---|---|---|
| Mesh geometry (Draco-compressed) | ~5 MB | 12% |
| Textures (uncompressed JPEG/PNG) | ~37 MB | 88% |
| **Total** | **42 MB** | 100% |

**Conclusion: Draco is doing its job on geometry. The problem is 100% textures.**

---

## Geometry Breakdown

**Total render vertices: 4,902,240** (the number the GPU processes per frame)
**Total upload vertices: 974,911** (actual unique vertices in GPU memory)

### Heaviest Meshes (by vertex count)

| # | Mesh Name | Vertices | Indices | Disk Size | Notes |
|---|---|---|---|---|---|
| 32 | Mesh (unnamed) | — | 376,275 | 23.35 MB | **BIGGEST — nearly half the file** |
| 33 | Mesh (unnamed) | — | 113,764 | 7.13 MB | Second largest |
| 30 | Mesh (unnamed) | — | 62,260 | 3.15 MB | |
| 31 | Mesh (unnamed) | — | 62,452 | 2.66 MB | |
| 21 | Cube.017 | — | 50,399 | 2.4 MB | |
| 14 | Cube.013_Cube.005 | — | 19,786 | 952 KB | |
| 16 | Plane.049 | — | 16,556 | 728 KB | |

**4 unnamed "Mesh" objects account for ~36 MB** of the 42 MB file. These are
likely the room shell (walls/floor/ceiling) and possibly the bed or curtains.
Bruno should identify and name these — they're the optimization targets.

### Light Meshes (correctly sized for web)

Most other meshes are small (under 5K indices, under 50KB). The furniture
props, cylinders, cubes, and decorative items are fine. Only the 4 unnamed
heavy meshes are the problem.

---

## Texture Breakdown

**40 textures total** — each material has 3-4 maps (base color, normal,
roughness/metallic, sometimes emission or specular).

### By Resolution

| Resolution | Count | Disk Size (total) | GPU Memory (total) |
|---|---|---|---|
| 2048×2048 | 33 textures | ~16 MB | **737 MB** (22.37 MB each) |
| 2730×2730 | 1 texture (curtain) | 1.13 MB | **39.74 MB** |
| 1920×1080 | 1 texture (bayou-bg) | 2.56 MB | **11.06 MB** |
| 1024×1024 | 3 textures (side table) | 245 KB | **16.77 MB** |
| 800×800 | 2 textures (wood detail) | 190 KB | **6.82 MB** |
| **Total** | **40 textures** | **~20 MB disk** | **~811 MB GPU** |

### Critical Finding: 811 MB GPU Texture Memory

Even though the textures are only 20 MB on disk (JPEG compressed), the
GPU decompresses them to full RGBA at runtime. **33 textures at 2048×2048
each = 737 MB of GPU memory.** Plus the 2730px curtain and the 1080p
bayou image = 811 MB total.

**A typical laptop GPU has 1-4 GB of VRAM.** This scene uses 800 MB just
for textures before any geometry, framebuffers, or post-processing.
On integrated GPUs (Intel/AMD on most laptops), it shares system RAM
and will cause swapping, stuttering, or crashes.

### Largest Individual Textures (Disk)

| Texture | Format | Resolution | Disk Size | GPU Size |
|---|---|---|---|---|
| Material.001_BaseColor (Alpha) | **PNG** | 2048×2048 | **5.82 MB** | 22.37 MB |
| bayou-bg | **PNG** | 1920×1080 | **2.56 MB** | 11.06 MB |
| ZaclonaFFF (curtain) | JPEG | 2730×2730 | **1.13 MB** | 39.74 MB |
| Metall1_basecolor | JPEG | 2048×2048 | **1.10 MB** | 22.37 MB |
| Fleur De Lis Wall - albedo | JPEG | 2048×2048 | **1.00 MB** | 22.37 MB |
| floor_Normal | JPEG | 2048×2048 | **958 KB** | 22.37 MB |
| floor_Diffuse | JPEG | 2048×2048 | **784 KB** | 22.37 MB |
| Wood_Normal 2 | JPEG | 2048×2048 | **711 KB** | 22.37 MB |

**Two PNG textures alone = 8.38 MB.** Converting to JPEG at quality 85
would save ~5 MB with no visible difference.

---

## Material Breakdown

**9 advanced PBR extensions used:**

1. `KHR_draco_mesh_compression` ← geometry compression (good)
2. `KHR_materials_clearcoat` ← expensive shader
3. `KHR_materials_transmission` ← expensive shader (glass/transparency)
4. `KHR_materials_emissive_strength` ← moderate cost
5. `KHR_materials_specular` ← moderate cost
6. `KHR_materials_anisotropy` ← expensive shader
7. `KHR_materials_ior` ← moderate cost
8. `KHR_texture_transform` ← cheap (UV transforms)
9. `KHR_materials_sheen` ← expensive shader (fabric)
10. `KHR_lights_punctual` ← embedded lights (fine)

**Extensions 2, 3, 6, 9 (clearcoat, transmission, anisotropy, sheen) are
the most expensive.** Each one adds extra shader passes. Combined with
4.9M vertices, the shader compilation time alone is several seconds.

**For web:** only `KHR_draco_mesh_compression`, `KHR_texture_transform`,
and `KHR_lights_punctual` should remain. Everything else should be
baked into textures.

---

## Why It Doesn't Load

Three bottlenecks, in order:

### 1. Download: 42 MB over network
At 50 Mbps: ~7 seconds. At 20 Mbps: ~17 seconds. At 10 Mbps: ~34 seconds.
The loading terminal shows "fetching model..." and stalls here.

### 2. GPU texture upload: 811 MB
After download, Three.js decompresses every JPEG/PNG and uploads to GPU
as uncompressed RGBA. 33 textures × 2048² × 4 bytes = 737 MB. Most
laptop GPUs cannot allocate this. The browser tab crashes or hangs.

### 3. Shader compilation: 9 material extensions × many materials
Each unique material with advanced extensions compiles a separate GLSL
shader program. With clearcoat + transmission + anisotropy + sheen, each
shader is complex. Initial compilation blocks the main thread for 1-3
seconds per material.

---

## Optimization Targets (Priority Order)

### Target 1 — Textures (biggest impact, easiest fix)

| Action | Savings | Effort |
|---|---|---|
| Downscale all 2K textures → 1K | 75% GPU memory (811 → ~200 MB) | 5 min in Blender |
| Downscale curtain 2730 → 1K | 39 MB → 5.6 MB GPU | 1 min |
| Convert 2 PNGs to JPEG | ~5 MB disk saved | 2 min |
| Export with WebP instead of JPEG | ~30% smaller | Blender export toggle |
| **Use KTX2/Basis** (via gltfpack -tc) | 80% smaller + stays compressed on GPU | Post-export tool |

**If Bruno does ONLY the 2K→1K downscale and PNG→JPEG conversion:**
- Disk: 42 MB → ~15-18 MB
- GPU: 811 MB → ~200 MB
- Load time: 17s → ~6s on 20 Mbps
- Rendering: actually feasible on consumer GPUs

### Target 2 — Materials (medium impact, medium effort)

| Action | Effect |
|---|---|
| Remove clearcoat, transmission, anisotropy, sheen | Faster shader compile, simpler render |
| Bake complex materials to texture | Same visual, 1/10th GPU cost |
| Use only Principled BSDF metallic-roughness | Standard web PBR, fast everywhere |

### Target 3 — Geometry (low disk impact since Draco handles it, but GPU impact)

| Action | Effect |
|---|---|
| Identify + optimize the 4 unnamed heavy meshes | 36 MB → much less |
| Name all meshes properly | Enables targeted optimization |
| Consider normal map baking for the heavy meshes | 4.9M → 200K verts, same visual |

### Target 4 — HDR Environment

| File | Current | Recommendation |
|---|---|---|
| `old_room_2k.hdr` | 6.1 MB, 2K | Downscale to 512×256 (sufficient for interior reflections): ~200 KB |

---

## Quick Wins for Bruno (Do These First)

1. **Resize all textures to 1024×1024** in Blender (Image Editor → Image → Resize)
2. **Convert the 2 PNG textures to JPEG** (Material.001_BaseColor, bayou-bg)
3. **Remove clearcoat, transmission, anisotropy, sheen** from materials
4. **Name the 4 heavy unnamed meshes** so we can target them
5. **Export with WebP** (Blender glTF export → Images → Format → WebP)
6. **Re-export** with Draco enabled (already is)

**Expected result after quick wins: 42 MB → 10-15 MB, 811 MB GPU → ~150 MB GPU.**
Should load in 3-5 seconds and render at 30-60fps on consumer machines.

---

## Ideal Final Target

| Metric | Current | After Quick Wins | Production Target |
|---|---|---|---|
| File size | 42 MB | 10-15 MB | 2-5 MB |
| Render vertices | 4.9M | 4.9M | 200-500K |
| GPU texture memory | 811 MB | ~150 MB | ~50 MB |
| Texture count | 40 | 40 | 4-8 (atlas) |
| Material extensions | 9 | 3-4 | 3 (Draco + texTransform + lights) |
| Shader compile time | 3-5s | 1-2s | <0.5s |
| Load time (20 Mbps) | 17s+ | 4-6s | 1-2s |
| FPS (M1 MacBook) | 30-40 | 50-60 | 60 |
| FPS (Intel laptop) | 10-15 | 25-35 | 60 |
