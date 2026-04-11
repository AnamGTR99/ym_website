# Option E — Blender + Blender MCP for the Motel Room

Full breakdown of using Blender driven by the Blender MCP to create the
Yunmakai motel room, all props, materials, lighting, and interactive
hotspots — as a single GLB ready to drop into
`components/three/MotelRoomScene.tsx`.

**Source of truth for art direction:** `docs/briefs/3d-room-brief-bruno.md`
(Bruno's original brief — inherited wholesale).

**Source of truth for technical budget:** same file, section 4.

**Source of truth for site flow:** `docs/project_brain.md` line 9 —
*"Landing (lake) → Room (motel hub) → TV (catalogue) → Product Page"*.

**Client notes (`from_client/(Solus Records).pdf`):** read. They cover
DRM/analog-hole licensing concerns around 3D-printed tangible goods — **no
bearing on room design**, already flagged as out-of-scope in
`project_scope_pivot.md`. Not a reference for this doc beyond confirming
the products in `/tv/[handle]` are 3D-printed physical goods that ship
with music access.

---

## 1. What Option E Is

**Blender MCP** (community project `blender-mcp` by `ahujasid`, MIT licensed)
is an MCP server that exposes Blender's Python API to any MCP-speaking
client (Claude Desktop, Claude Code, Cline, etc.). It works by:

1. You install a Blender addon that opens a local TCP socket (default
   port 9876) inside Blender
2. Blender runs with that addon enabled, listening on the socket
3. The `blender-mcp` Node package (or `uvx blender-mcp`) is registered as
   an MCP server in your Claude config
4. When I call an MCP tool, the server proxies the Python command into
   Blender's socket → Blender executes it in its own Python interpreter
   → result returns through the socket → MCP → me

**What that means practically:** while Blender is running on your Mac
with the addon enabled, **I can directly create/modify the motel room
scene from this conversation** — spawn objects, set materials, position
lights, name meshes, run bpy operators, and trigger a GLB export to
`public/models/room.glb`. You watch the changes happen live in the
Blender viewport.

**What the MCP exposes (typical toolset):**

| MCP tool | What it does |
|---|---|
| `get_scene_info` | Dump current scene state — objects, cameras, lights, materials |
| `get_object_info` | Inspect a specific object's transform, mesh, modifiers |
| `execute_blender_code` | Run arbitrary Python in Blender's interpreter (`bpy.ops.*`, `bpy.data.*`, `bmesh.*`) — the most powerful tool, covers everything |
| `create_object` | Shorthand for common primitives (cube, plane, cylinder, light, camera) |
| `modify_object` | Translate/rotate/scale/rename an existing object |
| `set_material` | Assign or create a PBR material on an object |
| `delete_object` | Remove an object |
| `get_polyhaven_status` / `download_polyhaven_asset` | **Poly Haven integration — download HDRIs, textures, and GLB assets directly into Blender from the MCP.** Huge for this project. |
| `get_hyper3d_status` / `generate_hyper3d_model_via_text` | **Rodin text-to-3D integration — generate individual props from a prompt.** |

The combination of these tools means I can: block out the room with
primitives → pull real PBR wall/floor/wood textures from Poly Haven →
generate hero props (CRT TV, lamp, bed) from Rodin text prompts →
arrange, name, and light them → bake → export to GLB. All while you
watch it happen and veto direction in natural language.

---

## 2. The Vibe (Condensed From Bruno's Brief)

Reading from `docs/briefs/3d-room-brief-bruno.md`:

**Setting:** Roadside Americana motel room. Slightly eerie, atmospheric,
cinematic. Think **Ozark, True Detective S1, No Country for Old Men,
David Lynch / Twin Peaks, liminal motel photography**.

**Mood:** Lived-in, not clean. 2am feel. Low warm ambient + one warm
bedside lamp + cool teal bleed from an exterior motel sign through
parted curtains. Shadows are load-bearing.

**Era:** Retro-but-not-dated. 90s meets present. Analog TV, wood paneling,
worn textures.

**Color palette** (matches our design system tokens already in
`app/globals.css`):
- Deep browns, muted greens, dark voids (`--color-void #050505`)
- Warm amber lamp glow (`--color-amber #d4a853`)
- Cool teal outside bleed (`--color-teal #4a9e9e`)
- Moss/rust accents (`--color-moss #4a6741`, `--color-rust #8b4513`)

**Anti-brief — what it's NOT:** clean, modern, bright, minimalist,
Scandinavian, plastic, cartoon-stylized, campy retro-kitsch.

---

## 3. Room Layout & Objects

From Bruno brief section 3, inherited wholesale:

### Interactive (clickable navigation zones) — REQUIRED

| Object | Action | Mesh name | Notes |
|---|---|---|---|
| CRT TV | → `/tv` catalogue | `TV` (whole unit) + `TV_Screen` (screen plane separate) | Focal point. Retro 90s CRT. Screen is a flat plane with its own material — we render dynamic content on it from R3F code. Housing, knobs, antenna, stand all grouped as `TV` parent. |
| Wall poster | → credits overlay | `Poster` | Movie poster / flyer / framed art. Needs to feel intentional and clickable, not random decoration. |

### Atmospheric (non-interactive) — fill these in as feels right

From Bruno brief section 3, suggested list:

- Bed (unmade, rumpled sheets) — hero prop, center-stage candidate
- Bedside table + lamp (the warm light source — `Lamp` mesh name)
- Curtains (slightly parted, teal bleed through)
- Carpet (worn, patterned — low-poly plane with PBR texture)
- Dresser / TV stand
- Nightstand items: ashtray, phone, clock radio, remote
- Wall art / mirror
- Ceiling fan (optional — animatable later)
- Small bathroom door (ajar, dark inside — good depth trick)
- Luggage / duffel bag on floor
- Wood paneling on walls
- Window with blinds / curtains
- Door behind camera (the doorway we're looking in through)

**Room shell:** walls/floor/ceiling merged under parent `Room`.

**Naming convention (inherited from Bruno brief section 4):**

```
Room             ← walls/floor/ceiling shell (merged)
  TV             ← full CRT unit (housing, stand, knobs)
    TV_Screen    ← flat plane, own material, dynamic content target
  Poster         ← wall art, clickable
  Lamp           ← warm light source prop
  <other props>  ← free-named atmosphere
```

This naming is **load-bearing for the R3F code**. When I wire the GLB
into `MotelRoomScene.tsx`, I traverse the scene graph and attach click
handlers by mesh name. Any named mesh can become an interactive hotspot
later without re-exporting the GLB.

---

## 4. Technical Budget (Hard Constraints)

From Bruno brief section 4 — these are budget ceilings, violating them
means the scene tanks performance in a browser.

| Constraint | Target | Hard Max |
|---|---|---|
| File size (GLB) | < 5 MB | 8 MB |
| Polygon count | 50k–100k triangles | 100k hard |
| Texture resolution | 1024×1024 per texture | 1024×1024 |
| Texture format | Embedded in GLB (binary glTF) | Embedded |
| Materials | PBR metallic-roughness workflow | PBR only |
| Shaders | Nothing Blender-specific | None |
| Lighting | Bake where possible (lightmaps) | Baked > realtime |

**Performance notes:**
- Combine meshes that share a material to reduce draw calls
- Use texture atlases — multiple props sharing one 1024×1024 sheet
- Decimate background/far props aggressively
- No overlapping UVs on anything that gets a baked lightmap
- Camera-facing backfaces can be deleted on the room shell (we never see
  the back of the walls)

---

## 5. Camera & Composition

From Bruno brief section 5:

- **Fixed camera perspective** — controlled by R3F code, but the scene
  should read well from one primary angle
- **Primary view:** slightly elevated, looking *into* the room from the
  doorway. TV should be unmistakably the focal point.
- **Aspect ratio:** design for 16:9 desktop (1920×1080), mobile handled
  separately in code (we keep the 2D hotspot fallback for mobile in
  `RoomEnvironment.tsx`)
- **Depth:** motel room, not a mansion. Cozy and compact.

The **gltfjsx pipeline** I'll run on export produces a typed React
component that preserves mesh names, so I'll attach click + hover +
transition handlers to `TV`, `Poster`, `Lamp` after import.

---

## 6. Prerequisites — Environment Setup

This is the one-time cost of Option E. Realistic total: **15–25 minutes**
of your hands.

### 6.1 — Install Blender

**Your side:**
1. Download Blender 4.2 LTS or later from https://www.blender.org/download/
2. Install to `/Applications/Blender.app` (macOS default)
3. Launch once to accept defaults
4. Confirm working: **Help → About Blender** shows 4.2+

### 6.2 — Install the Blender MCP addon

**Your side:**
1. Download the addon from the `blender-mcp` repo:
   https://github.com/ahujasid/blender-mcp → download `addon.py` from
   the `blender_mcp_addon/` folder (or the repo's root, depending on
   current layout)
2. In Blender: **Edit → Preferences → Add-ons → Install…** → select
   the downloaded `addon.py`
3. Enable the checkbox next to **"Interface: Blender MCP"** (or
   similar label) in the add-ons list
4. In Blender's 3D viewport, press `N` to open the sidebar → look for a
   **"BlenderMCP"** tab → inside, click **"Connect to Claude"** (starts
   the socket server on port 9876)
5. **Leave Blender running** with the server connected. If you close
   Blender, the connection drops and I can't drive it.

### 6.3 — Register the MCP server in Claude Code

**Your side:** edit `~/.claude/settings.json` (or whichever path Claude
Code uses for MCP config on your machine) and add:

```json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

This uses `uvx` (the Python tool runner from `uv`) to pull and run the
`blender-mcp` package on demand. Alternatively, if you prefer npm:

```json
{
  "mcpServers": {
    "blender": {
      "command": "npx",
      "args": ["-y", "blender-mcp-server"]
    }
  }
}
```

(exact package name may differ — I'll verify when we do the setup; the
`uvx blender-mcp` path is the canonical one from the project readme)

Prereq: `uv` installed (`brew install uv` on macOS). Takes 30 seconds.

### 6.4 — Restart Claude Code and verify connection

**Your side:**
1. Fully quit and relaunch Claude Code (MCP servers initialize on launch)
2. In a new conversation (or this one after restart), I'll call
   `get_scene_info` — if Blender responds, we're wired.
3. If you see "MCP server 'blender' failed to start" — most common fixes:
   - `uv` not in PATH → `brew install uv` then restart
   - Blender not running → launch Blender, enable addon, click "Connect"
   - Port 9876 occupied → change port in addon settings + MCP config
   - Firewall prompt → allow the local connection

### 6.5 — Optional: Poly Haven + Rodin integration

Two bonus integrations that make Option E dramatically more productive:

**Poly Haven** (free CC0 assets):
- In the Blender MCP addon panel, toggle **"Enable Poly Haven"**
- I can now call `download_polyhaven_asset("wood_cabinet_01", "model")`
  and the MCP will fetch real PBR wood cabinets, HDRIs, ground textures
  etc. directly into the Blender scene
- No API key required, no account — Poly Haven is fully CC0

**Rodin / Hyper3D** (AI text-to-3D):
- In the addon panel, toggle **"Enable Hyper3D (Rodin)"** and paste an
  API key (free tier available at https://hyper3d.ai)
- I can call `generate_hyper3d_model_via_text("retro 90s CRT television,
  game asset, low poly, PBR")` and it returns a GLB mesh dropped into
  the scene
- Best for hero props we can't find in Poly Haven (the CRT TV is the
  canonical one — Poly Haven has no CRTs)

**Both integrations are optional.** Without them, I fall back to pulling
assets from your manual download pile (whatever you drop in a folder)
and building primitives from scratch with `bpy.ops`.

---

## 7. Execution Plan — Step-By-Step

Same core plan for both Workflow A and Workflow B. The workflows differ
only in **who drives the blockout phase** (me vs you with my guidance).

### Phase 1 — Blockout (20–30 min)

Goal: rough geometry in place, correct scale, camera framed.

1. **New Blender scene** — File → New → General. Delete default cube,
   camera, and light.
2. **Set units** — Scene → Units → Metric, scale 1.0 (one Blender unit
   = 1 meter, matches R3F)
3. **Build the room shell** — I spawn a `bpy.ops.mesh.primitive_cube_add`
   at origin, scale to (4m × 3m × 2.5m) — a realistic motel room footprint.
   Enter edit mode, delete the top face and front face (we look in
   through the front, ceiling is implied). Flip normals inward.
4. **Rename** to `Room`.
5. **Block in props as primitives first:**
   - Bed — cube scaled (2m × 1.4m × 0.5m), positioned on floor, left wall
   - Bedside table — cube (0.5 × 0.5 × 0.6), next to bed
   - Lamp base — cylinder on the bedside table
   - Dresser / TV stand — cube (1.2 × 0.5 × 0.7), opposite wall
   - CRT TV — cube (0.7 × 0.6 × 0.5) on the dresser, plus a smaller flat
     plane inset into the front face → name that plane `TV_Screen`
   - Poster — flat plane (0.5m × 0.7m) on the back wall, named `Poster`
   - Curtains — two planes flanking an imaginary window on the right wall
   - Door — plane on the front wall (behind camera)
6. **Place the camera** at ~(0, -3m, 1.7m) looking toward the TV. Set
   focal length to 35mm (Blender default). This becomes the "hero view".
7. **Export-check GLB** — File → Export → glTF 2.0 → Format: GLB →
   save to `public/models/room.glb`. Test load in `MotelRoomScene.tsx`
   before we proceed. This is the **checkpoint commit** — even if
   nothing else works, we now have a namable, loadable primitive room.

### Phase 2 — Materials (30–45 min)

Goal: surfaces look like a motel room, not a Minecraft diorama.

8. **Pull textures from Poly Haven** via MCP:
   - `wood_planks_01` → floor
   - `brown_mud_01` or `painted_plaster_08` → walls (need something wood-panel-like, may need to search)
   - `fabric_pattern_05` → bed sheets / curtains
   - `worn_plank_04` → dresser / bedside table
   - One HDRI for environment lighting — `moonless_golf` or
     `satara_night` for dark-exterior vibe
9. **Assign materials** via `bpy.data.materials` — set each to Principled
   BSDF, plug in the Poly Haven PBR channels (base color, roughness,
   normal, ORM if available)
10. **Custom emissive materials** for:
    - `Lamp` — warm amber emission, strength ~5–10
    - `TV_Screen` — placeholder cool teal emission strength ~1 (R3F will
      replace this material at runtime with a dynamic texture via
      `traverse()` + `.material = new MeshBasicMaterial({ map: ... })`)
    - Exterior glow coming through the window curtains — separate plane
      with teal emission, positioned behind the curtain planes
11. **Roughness/metallic pass** — bump roughness high on everything
    (motel room is worn, not glossy). Metal only on door handle, lamp
    base if metal, TV knobs.

### Phase 3 — Hero props (30–60 min)

Goal: replace the blockout primitives with actual detailed meshes where
it matters. Everything else stays primitive.

**Priority order** (stop when we hit the time budget):

1. **CRT TV** — generate via Rodin (if enabled) with prompt *"retro 90s
   CRT television, low poly game asset, rounded corners, plastic
   housing, visible knobs on right side, PBR textures"*. Import, scale
   to match blockout TV, rename to `TV`. Separate the screen face as a
   child mesh named `TV_Screen`.
2. **Bed** — Poly Haven has beds, or Rodin prompt *"unmade motel bed,
   rumpled sheets, low poly, PBR game asset"*.
3. **Lamp** — Poly Haven search `table_lamp` or Rodin *"retro table
   lamp, fabric shade, brass base, 70s motel style"*.
4. **Bedside table / dresser** — Poly Haven `vintage_nightstand` or
   similar.
5. **Everything else stays as primitive blockout** — ashtrays, remote,
   phone, luggage. These are silhouette detail only, not hero focus.

### Phase 4 — Lighting (15–30 min)

Goal: the Ozark/True Detective mood.

12. **Ambient** — set World background to the Poly Haven HDRI (dark
    exterior), strength 0.15 (very low — this is a dark scene)
13. **Key light** — point light inside the lamp shade at position ~(−1.5,
    −0.5, 1.4), warm amber color (`#d4a853`), energy 50W, radius 0.3m
14. **Rim/exterior bleed** — area light behind the window plane,
    teal color (`#4a9e9e`), energy 200W, size 1.5m, pointing into the
    room through the curtain
15. **TV emissive** provides its own fill light from screen glow (cool
    teal wash on the TV stand area)
16. **Test render** — F12 in Blender, Cycles preview, 64 samples just
    to sanity-check mood. Adjust until it feels right.

### Phase 5 — Bake lightmaps (optional but recommended) (15–30 min)

Goal: cheat realtime cost by baking the lighting into textures.

17. UV-unwrap every mesh with a second UV map (`UVMap_Lightmap`)
18. In Cycles, bake the `Combined` pass into 1024×1024 textures per
    mesh (or merged into an atlas)
19. In the material, plug the baked lightmap into emission — now the
    mesh looks "lit" in real-time without any Three.js lights doing work
20. This is advanced — **skip if we're running out of time**. R3F can
    light the unlit scene with a few point lights at runtime, it just
    costs more GPU.

### Phase 6 — Naming + export (10 min)

21. **Verify mesh names** match the naming convention from section 3.
    Run `get_scene_info` via MCP to list everything. Rename anything
    still called `Cube.001`.
22. **Clean scene hierarchy** — `Room` as parent, all props as children
    (optional but helps with traverse code)
23. **Remove unused data** — File → Clean Up → Purge Unused Data
24. **Export** — File → Export → glTF 2.0 → Format: **GLB** → tick
    "Embed Textures", "Include → Selected Objects" if you want to skip
    the camera/lights, set **"Transform → Y Up"** (Three.js convention).
    Save to `/Users/anam/Desktop/CLIENTS/ym_website/public/models/room.glb`
25. **File size check** — `du -sh public/models/room.glb` → should be
    under 8MB. If over, go back and decimate + reduce texture sizes.

### Phase 7 — R3F integration (15 min, my side)

26. `npx gltfjsx public/models/room.glb -o components/three/Room.tsx -t`
    → generates typed component with all named meshes preserved
27. Replace `<ProceduralRoom />` in `MotelRoomScene.tsx` with `<Room />`
28. Attach click handlers in the `Scene` component:
    ```tsx
    <Room
      onTVClick={handleTV}
      onPosterClick={handlePoster}
      onLampClick={handleLamp}
    />
    ```
    or by traversing after load and attaching handlers to meshes by
    name
29. Retune camera position, FOV, and orbit constraints for the new
    geometry scale (GLBs rarely match our current camera blockout
    exactly)
30. Keep the grain/vignette overlays from the current `RoomEnvironment.tsx`
    stacked over the canvas — they're brand-critical
31. Local smoke test → `npm run dev` → `/room` → verify:
    - Scene loads
    - Click TV → transitions to `/tv`
    - Click Poster → opens credits overlay
    - Mobile fallback still renders the 2D hotspot grid (unchanged)
32. Commit + push → Vercel auto-deploys
33. Update `docs/briefs/3d-room-brief-bruno.md` credits to add Blender
    MCP + Poly Haven + Rodin attributions as applicable

---

## 8. R3F Integration Code Sketch

This is the landing point in `MotelRoomScene.tsx` after swap. Purely
illustrative — final code depends on what gltfjsx generates.

```tsx
import { useGLTF } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEnvStore } from "@/stores/env";

function MotelRoom() {
  const { scene } = useGLTF("/models/room.glb");
  const router = useRouter();
  const startTransition = useEnvStore((s) => s.startTransition);
  const openCredits = useEnvStore((s) => s.openCredits);
  const transitioning = useEnvStore((s) => s.transitioning);

  // Traverse once, tag interactive meshes, attach handlers
  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (child.name === "TV" || child.name === "TV_Screen") {
        child.userData.onClick = () => {
          if (transitioning) return;
          startTransition("tv", () => router.push("/tv"));
        };
        child.userData.cursor = "pointer";
      }
      if (child.name === "Poster") {
        child.userData.onClick = () => {
          if (transitioning) return;
          openCredits();
        };
        child.userData.cursor = "pointer";
      }
    });
  }, [scene, router, startTransition, openCredits, transitioning]);

  return (
    <primitive
      object={scene}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const handler = e.object.userData.onClick;
        if (handler) handler();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (e.object.userData.cursor) {
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    />
  );
}

useGLTF.preload("/models/room.glb");
```

The `scene.traverse` pattern is robust to GLB re-exports — as long as
the mesh names stay consistent in Blender, the wiring keeps working.

---

## 9. The Two Workflows — A vs B

Both reach the same destination. The difference is **who's at the
wheel during the setup + blockout phases**.

### Workflow A — "Full MCP Drive"

**You:** install Blender + addon, start it, walk away. Tell me "ready".

**Me:** do everything from step 6.4 onward. I call MCP tools to:
- Build the room shell from primitives
- Spawn all props
- Download Poly Haven textures + HDRIs
- Generate hero props via Rodin (if API key configured)
- Assign materials, lighting
- Bake, export, run gltfjsx, rewire MotelRoomScene.tsx

**You watch the Blender viewport live** as it happens and redirect me
when something looks wrong in plain English:
- *"the bed is too big, make it smaller"*
- *"the lamp should be warmer"*
- *"turn the TV 15 degrees to face the camera more"*
- *"that poster looks generic, pick something with more vibe"*

**Pros:** minimum hands-on from you, maximum iteration speed, the full
power of the MCP gets used. You never have to touch Blender's UI.

**Cons:** if Blender crashes or the MCP drops, we restart from the last
checkpoint save. Rodin text-to-3D is nondeterministic — I might need 3–4
tries to get a CRT TV that doesn't look uncanny. Your feedback loop is
"describe what's wrong in English" which is slower than clicking-and-
dragging in Blender.

**Best for:** you prefer to direct, not execute. You want to stay in the
conversation.

### Workflow B — "Hybrid — You Scaffold, I Finish"

**You:**
1. Install Blender + addon (same as A)
2. **Do the blockout yourself** — File → New, delete defaults, add cubes
   for walls/bed/dresser/TV/poster/lamp, roughly position them. Use
   Blender's grab (G), rotate (R), scale (S) shortcuts. Don't worry about
   materials or lighting. 15–20 minutes of rough placement.
3. Name the key meshes: `Room`, `TV`, `TV_Screen`, `Poster`, `Lamp`
4. Save the `.blend` file somewhere
5. Keep Blender running with the MCP connected
6. Tell me "blockout done"

**Me:** I take over from there:
- Pull Poly Haven textures + apply materials
- Generate/import hero props to replace the blockout cubes
- Set up lighting (key lamp + teal exterior bleed + HDRI)
- Bake if time allows
- Export to GLB, run gltfjsx, rewire R3F, commit, push

**Pros:** Blender's direct-manipulation UI is objectively faster for
blockout than natural-language commands. You get the layout exactly
where you want it in a few minutes. I handle the tedious material/
lighting/export steps. Faster to "final" overall.

**Cons:** you have to learn 5–6 Blender shortcuts (G, R, S, Shift+A,
N for properties, Tab for edit mode) and do 15–20 min of actual
3D work yourself.

**Best for:** you want the room layout to match your taste precisely,
you're OK spending 20 minutes in Blender, and you trust me with the
"boring" parts (texturing, lighting, export, code integration).

### Head-to-head

| | Workflow A | Workflow B |
|---|---|---|
| Your Blender skill needed | Zero | 5 shortcuts, 15 min |
| Your time at keyboard | ~30 min (watching + directing) | ~20 min (blockout) + ~10 min (reviewing) |
| My time | Long (drive everything via MCP) | Medium (tedious bits only) |
| Iteration speed on layout | Slow (natural language) | Fast (direct manipulation) |
| Iteration speed on materials | Fast (me via MCP) | Fast (me via MCP) |
| Risk of going off-vibe | Higher (I'm guessing) | Lower (you control the bones) |
| Final quality ceiling | Same | Same |
| Crash recovery | Restart MCP drive | Reopen .blend file |
| Time to first GLB checkpoint | 45–90 min | 30–60 min |

---

## 10. Risks & Fallbacks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Blender MCP server fails to start | Medium | High | Fall back to manual Blender workflow — you do blockout + materials in Blender UI, I just do the code integration. Losing the MCP loses the "AI-driven" part but not the deliverable. |
| Rodin API down / low quality | Medium | Medium | Skip Rodin, use Poly Haven + primitives only. Or pivot the single hero prop (CRT TV) to a Sketchfab CC0 download. |
| Poly Haven asset catalog doesn't have what we need | Low | Low | Wood panel walls + 70s interiors are well-represented. Fall back to base-color-only if PBR textures are missing. |
| Export GLB is too large | Medium | Medium | Decimate props, reduce texture sizes to 512 for background, delete backfaces, merge meshes by material. Standard optimization loop. |
| gltfjsx breaks on the GLB | Low | Low | Use `useGLTF` directly with scene traversal instead of the generated component. The code sketch in section 8 uses this pattern already. |
| Mesh names don't survive export | Low | High | Verify in Blender's outliner before export. glTF exporter preserves names by default. If lost, rename in code via `scene.getObjectByName`. |
| Whole thing takes longer than expected | High | Medium | **Checkpoint at Phase 1** (primitive blockout exported and loading in R3F) so we always have a working baseline. Every subsequent phase is an improvement, not a requirement. |
| You hate the result | Medium | High | Iterate in-conversation. Revert to previous `.blend` save. Or switch to Workflow B if we started with A. |

**Emergency fallback:** if Option E as a whole fails to produce a usable
GLB within ~2 hours of setup, bail to **Option D (Spline Studio)** or
**Option B (Meshy AI)** per `update_after_first.md` section 4. The
procedural placeholder currently in `MotelRoomScene.tsx` stays shippable
in the meantime — it's ugly but functional.

---

## 11. Integration With Existing Code

The GLB slots into our existing R3F infrastructure **with zero
architectural changes**. What already works:

- `components/three/MotelRoomScene.tsx` — Canvas wrapper, lighting,
  camera, OrbitControls, fog, Suspense, interaction wiring to
  `useEnvStore`. All of this stays. We swap `<ProceduralRoom />` for
  `<Room />` / `<primitive object={scene} />`.
- `components/env/RoomEnvironment.tsx` — desktop mounts the R3F canvas,
  mobile renders the 2D hotspot fallback, grain/vignette/transition
  overlays layer on top. Unchanged.
- `stores/env.ts` — `startTransition` and `openCredits` actions already
  wired. The click handlers in the MCP-produced Room component just
  call these same store actions.
- `components/env/CreditsOverlay.tsx` — opens when `openCredits` fires.
  Already ties back to the existing bayou credits video. Unchanged.

What gets updated:
- `MotelRoomScene.tsx` — swap in GLB loader + traversal-based handlers
- `credits overlay` — add attribution line for any Poly Haven / Rodin
  assets used (CC-BY requires it)
- `docs/briefs/3d-room-brief-bruno.md` — mark as superseded, reference
  this doc as the canonical record
- Commit history — dedicated feature branch `feature/HUGO-20-blender-mcp`

---

## 12. Budget — Realistic

| Phase | Workflow A | Workflow B |
|---|---|---|
| Prereq: install Blender | 5 min | 5 min |
| Prereq: install addon | 5 min | 5 min |
| Prereq: register MCP in Claude | 5 min | 5 min |
| Prereq: restart + verify | 5 min | 5 min |
| Blockout | 30 min (MCP-driven) | 15 min (you manual) |
| Materials | 30 min | 30 min |
| Hero props | 45 min | 45 min |
| Lighting | 20 min | 20 min |
| Bake (optional) | 20 min | 20 min |
| Export + size check | 5 min | 5 min |
| gltfjsx + R3F wire | 15 min | 15 min |
| Local smoke test | 10 min | 10 min |
| Commit, push, verify prod | 5 min | 5 min |
| **Total** | **~3 hr** | **~2.5 hr** |

**Minimum viable first checkpoint** (Phase 1 only — ugly primitive room
loaded in R3F with click handlers): **45 min (A)** / **30 min (B)**.
We can ship that immediately as "provisional motel room" and keep
iterating on materials/props asynchronously.

---

## 13. What I Need You To Decide Before We Start

### Decision 1 — Workflow A or B
- **A** if you don't want to touch Blender at all and are happy
  directing in English while I drive via MCP
- **B** if you're OK with 15 min of direct Blender work to lock in the
  layout, then handing over to me for materials/lighting/export

### Decision 2 — Rodin / Hyper3D
- Pay for Rodin API access (~$5–20 for the free tier credits + a small
  top-up)? — unlocks text-to-3D for hero props, dramatically better
  CRT TV and bed than Poly Haven alone
- Skip it — use Poly Haven + primitives + optional Sketchfab CC0
  downloads for the CRT TV specifically

### Decision 3 — Baked lightmaps
- **Yes, bake** — better runtime performance, more expensive to set up
  (UV unwrapping, cycles bake time), skip if first run goes over budget
- **No, skip** — R3F lights handle it at runtime, cheaper to build,
  more GPU cost at runtime

### Decision 4 — Scope of atmosphere props
- **Minimum** — bed, TV, lamp, poster, dresser, curtains. 6 hero props,
  rest is room shell. Fast, cleaner silhouette.
- **Full brief** — plus ashtray, phone, clock radio, luggage, ceiling
  fan, bathroom door, wall mirror. Richer, longer to build, risks
  hitting poly budget.

### Decision 5 — Parallel tracks
- Do admin setup first (you sign up + SQL promote to test the admin
  pipeline), THEN start Option E
- Do Option E first, admin later
- Both in parallel — you start Blender install while answering the
  SQL signup stuff

---

## 14. Summary

**Goal:** single GLB at `public/models/room.glb` under 8MB, 50–100k tris,
PBR materials, embedded textures, named meshes (`Room`, `TV`, `TV_Screen`,
`Poster`, `Lamp`), loads into the existing `MotelRoomScene.tsx` with
click-to-route on TV and click-to-credits on Poster. Southern Gothic
Noir mood — Ozark, True Detective, Twin Peaks references, warm amber
lamp + teal exterior bleed, baked atmospheric lighting.

**Method:** Blender + Blender MCP. You install Blender + the addon,
register the MCP server in Claude config, leave Blender running. I drive
it from this conversation via MCP tool calls, using Poly Haven for
free PBR textures/HDRIs and optionally Rodin (Hyper3D) for AI-generated
hero props.

**Two workflow variants:** A (I drive everything), B (you do blockout in
Blender UI, I finish it). B is faster overall, A is lower-effort on your
side.

**Checkpoint-driven:** first deliverable is a primitive-only GLB that
loads in R3F with click handlers after ~30–45 min. Every subsequent
phase is an improvement, not a requirement. At any point we can commit
what we have and ship.

**Fallback:** if the MCP path stalls, bail to Option D (Spline Studio)
or Option B (Meshy AI) without losing the code integration work — the
GLB loading pattern is identical regardless of where the file comes from.

---

## References

- `docs/briefs/3d-room-brief-bruno.md` — art direction source of truth
- `docs/project_brain.md` line 9 — site flow context
- `app/globals.css` — design system color tokens that materials should match
- `components/three/MotelRoomScene.tsx` — current procedural placeholder
  we're replacing
- `components/env/RoomEnvironment.tsx` — canvas mount + mobile fallback
  wrapper (unchanged by this work)
- `stores/env.ts` — `startTransition` and `openCredits` store actions
  that click handlers will fire
- `NEW_STRAT/road_to_complete.md` section 3 — original HUGO-20 plan,
  this doc supersedes that section
- `NEW_STRAT/update_after_first.md` section 4 — full landscape of 3D
  sourcing options, Option E is one of six
- https://github.com/ahujasid/blender-mcp — Blender MCP source (verify
  exact installation instructions here at setup time)
- https://polyhaven.com — CC0 PBR assets
- https://hyper3d.ai — Rodin text-to-3D API
