# Bruno — Blender Bake Guide for Web Export

The current GLB is 42MB / 4.9M render vertices. Web budget is 2-5MB / 
100-200K vertices. Decimation alone doesn't fix it — the textures are 
~35MB of the file and the materials use 9 advanced PBR extensions the 
browser struggles with.

The fix is **baking** — render all the detail INTO textures, then ship 
simple geometry wearing those textures.

---

## Step-by-Step in Blender

### Step 1 — Set up the low-poly target

You said you already decimated. Check your tri count:

1. Select all objects → bottom bar should show total tris
2. If above 200K tris, apply more decimation:
   - Select mesh → **Modifier → Decimate** → Ratio slider
   - **Un-Subdivide** mode works better than Collapse for interiors
   - Keep separate objects separate (don't merge TV + walls etc.)
   - Target: 100-200K tris total across all objects

If you're already under 200K, skip to Step 2.

### Step 2 — UV unwrap for baking

The baked textures need clean UVs:

1. Select all meshes
2. **UV → Smart UV Project** (angle limit 66°, island margin 0.02)
3. Or if you have manual UVs already, keep them

For a texture atlas (one big texture for everything):
1. Select all objects → **Ctrl+J** to join into one mesh temporarily
2. UV → Smart UV Project
3. This gives you one UV space for one baked texture
4. You'll separate them back after baking

### Step 3 — Bake the normal map

This captures the 4.9M poly detail as a texture:

1. Create a new image: **Image → New** → name it `room_normal`, 
   size **2048x2048**, 32-bit float, check "Non-Color"
2. In the Shader Editor for the joined mesh:
   - Add an **Image Texture** node
   - Select `room_normal`
   - **Don't connect it** to anything — just select the node (it must 
     be the active/selected node)
3. **Render Properties → Bake**:
   - Bake Type: **Normal**
   - Space: Tangent
   - If baking from a separate high-poly: check "Selected to Active"
     (select high-poly first, then shift-select low-poly)
   - If baking from the same mesh (self-bake): just click Bake
4. Click **Bake** — wait for it to finish
5. **Save the image** (Image → Save As → `room_normal.png`)

### Step 4 — Bake the combined color + lighting

This captures materials + Cycles lighting in one texture:

1. Create new image: `room_combined`, **2048x2048**, sRGB
2. Select the Image Texture node with `room_combined` in Shader Editor
3. Render Properties → Bake:
   - Bake Type: **Combined**
   - Check: Diffuse, Glossy, Emission, Transmission (all lighting)
   - This bakes EVERYTHING — colors, materials, shadows, lamp glow, 
     purple light bleed — all into one flat texture
4. Click **Bake** — this takes longer (Cycles renders every pixel)
5. Save as `room_combined.png`

### Step 5 — Optional: Bake emission/lightmap separately

If you want the lamp glow and TV screen glow as a separate layer 
(useful for us to control bloom in the browser):

1. Create new image: `room_emission`, **1024x1024**, sRGB, black bg
2. Bake Type: **Emit**
3. Bake + Save

### Step 6 — Create the final material

Replace all the complex materials with ONE simple material:

1. Delete all existing materials on the mesh
2. Create a new material: **Principled BSDF**
3. Plug in:
   - **Base Color** → Image Texture → `room_combined.png`
   - **Normal** → Normal Map → Image Texture → `room_normal.png`
   - **Emission** → Image Texture → `room_emission.png` (if you did 
     Step 5)
   - **Roughness** → 0.8 (flat value, no map needed)
   - **Metallic** → 0.0
   - **Everything else**: default. NO clearcoat, NO transmission, 
     NO anisotropy, NO sheen, NO IOR, NO specular map.

### Step 7 — Separate meshes back + rename

If you joined everything in Step 2:

1. **Edit Mode → Select linked by material** or manually select
2. **Mesh → Separate → By Selection** for interactive objects
3. Rename:
   - `Room` — walls/floor/ceiling shell
   - `TV` — TV housing
   - `Screen` — TV screen plane (separate mesh)
   - `Poster` — wall poster
   - `Lamp` — lamp prop

These names are required for our click handlers to work.

### Step 8 — Export

1. **File → Export → glTF 2.0 (.glb)**
2. Settings:
   - Format: **glTF Binary (.glb)**
   - Include: **Visible Objects** (hide anything you don't want exported)
   - Transform: **+Y Up** ✓
   - Data → Mesh:
     - Apply Modifiers ✓
     - **Compression → Draco** ✓ (level 6)
   - Data → Material:
     - Images: **WebP** (or Auto)
     - Quality: **80**
   - Data → Animation: **Uncheck** (no animations)
3. Save as `setup.glb`

### Expected result

| Before | After |
|---|---|
| 42MB | 2-5MB |
| 4.9M vertices | 100-200K vertices |
| 9 PBR extensions | Basic Principled BSDF only |
| Runtime Cycles-quality lighting | Baked into textures — free at runtime |
| Loads in 30+ seconds / crashes | Loads in 1-2 seconds |
| 15fps on laptops | 60fps everywhere |

The visual quality should be **identical** at the fixed camera angles 
we use. Normal maps preserve every surface bump. Baked lighting 
preserves every shadow and light bleed. The browser just doesn't have 
to compute it at runtime.

---

## Quick checklist before export

- [ ] Total tris under 200K
- [ ] All baked textures are 2048x2048 or smaller
- [ ] Only Principled BSDF material (no advanced extensions)
- [ ] Mesh names preserved: Room, TV, Screen, Poster, Lamp
- [ ] Draco compression enabled in export
- [ ] WebP texture format in export
- [ ] No animations included
- [ ] +Y Up transform
- [ ] Test: open the exported GLB in https://gltf-viewer.donmccurdy.com/ 
  — it should load in under 3 seconds and look correct
