# Bruno Handoff Plan — 2026-04-11

Bruno is coming over today to build the motel room GLB. This doc is the
refined plan for that visit: what he needs, what we need from him, what
we do while he works, and what happens the moment the GLB lands.

**Supersedes:** `NEW_STRAT/option_e_breakdown.md` (Option E — Blender
MCP). Option E is parked, not cancelled. If Bruno doesn't deliver today,
we fall back to Option E tomorrow.

**Canonical art direction source:** `docs/briefs/3d-room-brief-bruno.md`
— this is the brief that was originally written for Bruno. All specs,
vibe references, object lists, and technical budgets below are lifted
or summarized from that file. **Give Bruno the HTML version** at
`docs/briefs/3d-room-brief-bruno.html` (nicely formatted, print-ready)
or walk through the markdown version together.

---

## 1. Why This Is The Right Call

- Bruno is a trained 3D artist → quality ceiling is far higher than
  anything I can produce procedurally via Blender MCP
- The brief already exists (`docs/briefs/3d-room-brief-bruno.md`) — no
  additional spec work needed from us
- React Three Fiber integration scaffold is **already built** in
  `components/three/MotelRoomScene.tsx` with a procedural placeholder.
  Swapping to a real GLB is a ~15 minute code change.
- Naming convention is already defined in the brief — if Bruno follows
  it, click handlers wire up automatically
- Bruno can work in whatever tool he prefers (Blender, Maya, Cinema4D,
  3ds Max) — the only hard constraint is the GLB export format

---

## 2. What Bruno Needs to Know (Before He Starts)

All of this is in `docs/briefs/3d-room-brief-bruno.md` — read it with
him when he arrives, don't assume he remembers from the original send.
Quick recap of the non-negotiables:

### Format + Technical Budget

| Constraint | Value |
|---|---|
| File format | **GLB** (single file, binary glTF 2.0) |
| Textures | Embedded in the GLB (not separate files) |
| File size | **Under 5MB ideal, 8MB absolute max** |
| Polygon count | **50k–100k triangles total** |
| Texture resolution | **1024×1024 max** per texture, 512 where possible |
| Materials | **PBR metallic-roughness** workflow only |
| Coordinate system | **Y-up** (Three.js / glTF standard — set in export options) |
| Lighting | **Baked into textures** (lightmaps) wherever possible |
| Shaders | No engine-specific shaders — must round-trip through glTF cleanly |

### The Vibe (non-negotiable for brand)

- Setting: **Roadside Americana motel room**, slightly eerie, lived-in
- Mood: **Ozark, True Detective S1, No Country for Old Men, David Lynch /
  Twin Peaks, liminal motel photography**. 2am feel.
- Lighting: Low warm ambient + **one warm bedside lamp** + **cool teal
  bleed from an exterior motel sign** through parted curtains. Shadows
  are load-bearing.
- Era: Retro-but-not-dated. 90s meets present. Analog TV, wood paneling,
  worn textures.
- Color palette (to match our design tokens in `app/globals.css`):
  deep browns, muted greens, warm amber (`#d4a853`), cool teal
  (`#4a9e9e`), moss (`#4a6741`), rust (`#8b4513`)
- **Anti-brief** (what it's NOT): clean, modern, bright, minimalist,
  plastic, cartoon-stylized, campy retro-kitsch

### Required Interactive Objects — HARD NAMING CONVENTION

These are clickable navigation zones in the final site. The meshes
**MUST** be named exactly like this for the code to find them:

| Mesh name | What it is | Click action |
|---|---|---|
| `Room` | Room shell (walls, floor, ceiling, merged) | — |
| `TV` | Full CRT unit (housing, stand, knobs, antenna) — parent | Routes to `/tv` catalogue |
| `TV_Screen` | Flat plane inset into the TV's front face, own material | (same as TV, but we also replace its material at runtime to show dynamic content) |
| `Poster` | Wall art / movie poster / flyer / framed piece | Opens credits overlay |
| `Lamp` | The warm light source prop (the bedside lamp) | Reserved for future interaction |

Every other prop (bed, dresser, curtains, nightstand items, etc.) can
be named whatever he wants. Only the 5 above are load-bearing.

### Atmosphere Props (suggested, fill out the room)

From the brief — include as many of these as fits the poly budget:

- Bed (unmade, rumpled sheets)
- Bedside table
- Curtains (slightly parted, light bleeding through)
- Carpet (worn, patterned)
- Door (behind camera view)
- Dresser / TV stand
- Nightstand items: ashtray, phone, clock radio, remote
- Wall art / mirror
- Ceiling fan (optional, can be animated later)
- Small bathroom door (ajar, dark inside — great depth trick)
- Luggage / duffel bag on floor
- Wood paneling on walls
- Window with blinds or curtains

### Camera

- Fixed angle, **16:9 desktop framing**
- Slightly elevated perspective, looking *into* the room **from the
  doorway**
- TV is the unmistakable focal point
- Design for the hero shot — we'll orbit slightly in code but the
  primary framing is what matters

### TV Screen — Special Handling

Bruno should understand: the `TV_Screen` mesh is a **flat plane** with
its own material. **We replace that material in JavaScript at runtime**
to project dynamic content (product thumbnails, video frames, etc.)
onto the screen. So:

- `TV_Screen` must be separate from the rest of `TV` (parent-child OK)
- Give it a simple placeholder material (dark teal with slight
  emission is fine)
- Don't bake anything into the `TV_Screen` UVs that we'd lose when
  swapping the material

### Deliverables Checklist (what Bruno leaves with)

- [ ] `motel-room.glb` — single file, under 8MB, under 100k tris
- [ ] Preview render(s) — 1–2 PNGs showing his intended hero-shot
      framing before we integrate
- [ ] Source `.blend` file (or equivalent) — for future tweaks
- [ ] Attribution info — any CC-BY assets he used (Poly Haven, etc.)
      that need crediting

### Where to Put the Files

When Bruno's done:
```
public/models/room.glb         ← the GLB itself
docs/briefs/bruno_renders/     ← PNG preview renders (create this folder)
docs/briefs/motel-room.blend   ← optional source file
```

The `.blend` file lives in `docs/` (which is gitignored) so it doesn't
bloat the repo. The GLB goes into `public/` so Vercel can serve it. The
renders live in `docs/briefs/bruno_renders/` as visual reference — not
shipped to prod.

---

## 3. Bruno's Visit — Pre-flight Checklist (5 min)

When Bruno arrives, before he opens Blender:

1. **Show him the site as-is** — open `ym-website-theta.vercel.app`,
   walk through `/` → `/room` → `/tv` → a product page so he sees what
   the motel room lives inside and how click navigation works
2. **Show him the procedural placeholder** at `/room` — that's what
   we're replacing. The scale, camera angle, and click targets are the
   reference for what his room needs to accommodate.
3. **Open the brief** at `docs/briefs/3d-room-brief-bruno.html` in a
   browser (or print it) — he reads through it with you
4. **Confirm the naming convention** — this is the one thing that
   ruins the integration if he forgets. Write `Room`, `TV`, `TV_Screen`,
   `Poster`, `Lamp` on a sticky note next to his monitor.
5. **Agree on a WIP checkpoint** — around the blockout stage (primitives
   placed, no materials yet), he sends you a screenshot. You confirm
   layout + camera angle before he invests in texturing. **Prevents
   him going too far in the wrong direction.**
6. **Give him this file path as the final drop zone:**
   `/Users/anam/Desktop/CLIENTS/ym_website/public/models/room.glb`

---

## 4. What We Do While Bruno Works

Bruno's room will take ~2–6 hours depending on scope and his tools.
**Don't sit and watch.** Use that window for the parallel work we've
been deferring:

### Track 1 — Admin setup (your 20 min)

From `NEW_STRAT/update_after_first.md` section 6, step 2. Unblocks all
music testing and product linking.

1. Open `https://ym-website-theta.vercel.app/sign-in`, sign up with
   your email, click the magic link
2. In Supabase dashboard → SQL Editor, run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';
   SELECT id, email, role FROM profiles WHERE email = 'YOUR_EMAIL';
   ```
3. Visit `ym-website-theta.vercel.app/admin` — should land on dashboard
4. Tell me what you see (success or error)

### Track 2 — Shopify demo products (your 30 min, requires Shopify admin)

From `NEW_STRAT/integration_test_results.md` "Blockers" section.
Unblocks `/tv` catalogue, product pages, cart, checkout testing.

1. Log into your Shopify admin (Solus Records store)
2. Create **3 test products**:
   - **Product A** — multi-variant (e.g., size S/M/L), at least one
     image, simple description, regular price
   - **Product B** — single variant, one image, minimal
   - **Product C** — like B but with a `custom.glb_url` metafield set
     to any public GLB URL (for testing the 3D figurine render in our
     TVRoomScene). Can point to an existing Sketchfab-hosted GLB or a
     Supabase storage URL.
3. Ensure all 3 are **Active** and published to the sales channel the
   Storefront API uses

Tell me when done — I'll verify they show up in `/tv` on production.

### Track 3 — Audio test files (optional, requires demo tracks)

Only meaningful after Track 1 (admin access). Upload 2–3 test `.mp3`
files via the admin `/admin/tracks/new` flow, link them to one of the
Shopify products from Track 2. This unblocks the music player and
auth-gated streaming tests.

### Track 4 — I prep the GLB integration code

While you do Tracks 1–3, I'll:

1. Write the new `MotelRoomScene.tsx` variant that loads
   `public/models/room.glb` via `useGLTF` and attaches handlers by
   mesh name (the code sketch from `option_e_breakdown.md` section 8)
2. Add it behind a feature flag or env check so we can switch between
   procedural and GLB without losing the fallback
3. Pre-write the commit message and the attribution update for the
   credits overlay
4. Sanity-check the `useGLTF.preload` pattern so the room transition
   feels instant

When Bruno's GLB drops, the swap is literally: save the file → I run
gltfjsx and commit → Vercel rebuilds → live.

---

## 5. The Moment The GLB Arrives

### Step 1 — Verify the file (1 min)

```
ls -lh public/models/room.glb
du -sh public/models/room.glb
```

Confirm:
- File exists
- Size is under 8MB
- Format is `.glb` (not `.gltf` + separate files)

### Step 2 — Inspect the scene graph (2 min)

I'll run `npx gltfjsx public/models/room.glb` to generate a typed
React component **just to introspect**. The output lists every mesh
name so we can verify:

- `Room` present ✓
- `TV` present ✓
- `TV_Screen` present ✓
- `Poster` present ✓
- `Lamp` present ✓

If any of those are missing or misnamed, we text Bruno to fix and
re-export before we proceed. **Don't skip this check** — wiring
handlers to a missing mesh name is a silent failure.

### Step 3 — Wire it into MotelRoomScene.tsx (10 min)

Replace the procedural scene with a `useGLTF` load + scene traverse
pattern. Rough shape (final code written at integration time):

```tsx
import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { useEnvStore } from "@/stores/env";

function MotelRoomGLB() {
  const { scene } = useGLTF("/models/room.glb");
  const router = useRouter();
  const startTransition = useEnvStore((s) => s.startTransition);
  const openCredits = useEnvStore((s) => s.openCredits);
  const transitioning = useEnvStore((s) => s.transitioning);

  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;

      if (obj.name === "TV" || obj.name === "TV_Screen") {
        obj.userData.onClick = () => {
          if (transitioning) return;
          startTransition("tv", () => router.push("/tv"));
        };
      }
      if (obj.name === "Poster") {
        obj.userData.onClick = () => {
          if (transitioning) return;
          openCredits();
        };
      }
    });
  }, [scene, router, startTransition, openCredits, transitioning]);

  return (
    <primitive
      object={scene}
      onClick={(e) => {
        e.stopPropagation();
        e.object.userData.onClick?.();
      }}
      onPointerOver={(e) => {
        if (e.object.userData.onClick) {
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

### Step 4 — Retune camera + lights for the new geometry (10 min)

The current `MotelRoomScene.tsx` camera is positioned for my procedural
boxes. Bruno's room will have different scale and hero framing. I'll:

- Adjust `<Canvas camera={{ position, fov }}>` to match Bruno's preview
  render
- Adjust `<OrbitControls target>` to the TV center (wherever that
  lands in world space)
- **Keep** the grain, vignette, fog overlays — brand-critical
- **Decide** whether to keep my custom amber point light or defer to
  Bruno's baked lighting. If his lightmaps are baked, we disable/lower
  my runtime lights dramatically so we don't double-light the scene.

### Step 5 — Smoke test locally (5 min)

```
npm run dev
open http://localhost:3000/room
```

Verify:
- Room loads within ~2 seconds (GLB fetch + parse)
- No console errors
- Click on TV → transitions to `/tv`
- Click on Poster → credits overlay opens
- Click on Lamp → (currently no action, which is fine)
- Mobile fallback at narrow viewport still renders the 2D hotspot grid
- `npm run build` → no errors, bundle size for `/room` route didn't
  explode (check against the baseline from earlier today)

### Step 6 — Update credits overlay (5 min)

Add a line to `components/env/CreditsOverlay.tsx`:

```
3D Environment Artist: Bruno [last name]
```

Plus attribution for any CC-BY assets Bruno used (Poly Haven, Sketchfab,
etc.) — pulled from what he tells you when he hands over the file.

### Step 7 — Commit + deploy (2 min)

```
git checkout -b feature/HUGO-20-bruno-glb
git add public/models/room.glb components/three/MotelRoomScene.tsx components/env/CreditsOverlay.tsx
git commit -m "feat(3d): integrate Bruno's motel room GLB [HUGO-20]"
git checkout main
git merge --no-ff feature/HUGO-20-bruno-glb
git push origin main
```

Vercel auto-deploys in ~90 seconds. Then:

```
curl -o /dev/null -w "%{http_code}\n" https://ym-website-theta.vercel.app/models/room.glb
```

Should return 200. Visit `ym-website-theta.vercel.app/room` in a
real browser — the new room should be live.

### Step 8 — Close HUGO-20 in Linear

Epic 11 is then fully complete. Move to Phase E (mobile pass + polish).

---

## 6. What Could Go Wrong (And The Fixes)

| Problem | Symptom | Fix |
|---|---|---|
| GLB over 8MB | `du -sh` shows 12MB etc. | Bruno decimates meshes + drops textures to 512 → re-exports |
| Missing mesh names | `gltfjsx` output doesn't show `TV`, etc. | Bruno renames in Blender outliner → re-exports |
| Wrong Y-axis orientation | Room loads but is lying on its side | Bruno re-exports with "Y up" ticked in glTF export options |
| Textures not embedded | `.glb` + stray `.png` files next to it | Bruno ticks "Embed Textures" in export dialog |
| Scene loads but black | Lighting didn't bake, no materials | Either (a) Bruno re-bakes and re-exports, or (b) I crank runtime lights in R3F to compensate |
| `TV_Screen` not a flat plane | Can't replace material cleanly | Bruno separates the screen face into its own mesh |
| Way over 100k tris | Performance tanks on mobile | Decimate modifier on background props, export |
| Scale way off (room is 0.01 units) | Scene looks like a speck | Apply scale in Blender (Ctrl+A → Scale) before export |
| Click handlers don't fire | `onClick` never triggers on TV mesh | Debug with `scene.traverse((o) => console.log(o.name))` to see actual mesh names and rename in code if needed |
| Bayou video still not loading | Unrelated to Bruno | Already fixed in commit `3dd5e85` — should be live now |
| Bruno produces something off-vibe | Looks wrong in the preview render | **That's why we check at the WIP blockout stage** — catch vibe drift early before texturing |

### Hard emergency fallback

If Bruno can't deliver today (got sick, couldn't finish, export broken,
etc.):
- We still have the procedural placeholder in `MotelRoomScene.tsx` on
  production — ugly but working
- Pivot to **Option E (Blender MCP)** tomorrow per
  `NEW_STRAT/option_e_breakdown.md` — still a live plan, just parked
- Or pivot to **Option B (Meshy AI)** per
  `NEW_STRAT/update_after_first.md` section 4 — text-to-3D fallback

The site ships regardless. Bruno's room is an improvement, not a
blocker.

---

## 7. Handoff Timeline (Today)

| Time | Activity | Who |
|---|---|---|
| Bruno arrives | Show site, walk the brief, confirm naming + deliverables | You + Bruno |
| ~30 min in | Bruno sends WIP blockout screenshot | Bruno → you |
| You review WIP | Confirm layout + camera framing, or redirect | You |
| You fire parallel tracks | Admin setup + Shopify products + audio uploads | You (tracks 1–3 above) |
| Me prepping | Write the GLB integration code variant, ready to swap | Me (track 4 above) |
| Bruno's export | GLB delivered to `public/models/room.glb` + preview PNG | Bruno → you → me |
| Verify file | I check size + mesh names | Me |
| Integration | Wire into MotelRoomScene.tsx, retune camera/lights | Me |
| Smoke test | Local + prod verification | Me + you |
| Ship | Commit, merge, Vercel deploy | Me |
| HUGO-20 closed | Epic 11 complete | Linear |

**Realistic total:** 3–6 hours from Bruno arriving to production deploy.
The longer tail is Bruno's work, not ours.

---

## 8. What I Need From You Right Now

Before Bruno arrives:

1. **Tell Bruno to bring**: his preferred 3D software (Blender is fine,
   so is Maya/C4D/Max as long as he can export GLB), and whatever
   asset libraries he uses
2. **Print or open** `docs/briefs/3d-room-brief-bruno.html` so you can
   walk through it with him on arrival
3. **Make sure he has the naming convention written down** —
   `Room`, `TV`, `TV_Screen`, `Poster`, `Lamp`
4. **Agree on the WIP checkpoint rule**: blockout → screenshot → you
   approve → he textures → final export
5. **Ping me when he arrives** so I can be ready to integrate the
   moment the GLB lands

And either before or while Bruno works:

6. **Start Track 1 (admin)** — takes 20 min, unblocks everything else
7. **Start Track 2 (Shopify demo products)** — takes 30 min, unblocks
   commerce testing
8. **Tell me when either track is done** so I can verify + move to
   Track 3 (music testing)

---

## Summary

**Pivot:** Option E (Blender MCP) → parked. Bruno (actual 3D artist)
delivers the motel room GLB today instead.

**Why it's the right call:** quality ceiling is higher, brief already
exists, our integration side is already scaffolded, and the parallel
tracks (admin + Shopify + music) are work we needed to do anyway.

**Our integration effort:** ~30 minutes of code once the GLB lands.
Zero architectural changes — we already built for this.

**Fallback:** if Bruno doesn't deliver, Option E is still live, and
the procedural placeholder ships as-is until then.

**Brief:** `docs/briefs/3d-room-brief-bruno.md` (canonical, unchanged)

**Drop path:** `public/models/room.glb`

**Required mesh names:** `Room`, `TV`, `TV_Screen`, `Poster`, `Lamp`
