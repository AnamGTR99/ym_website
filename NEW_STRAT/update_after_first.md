# Update After First Deploy — 2026-04-11

Snapshot after the first production deploy of Epic 11. What works, what
didn't, what we're doing next, and the real answer on custom 3D sourcing.

---

## 1. What Just Shipped

Branch `feature/HUGO-73-design-system` merged to `main` with 5 commits:

| Commit | What |
|---|---|
| `68ce77b` | Epic 11 UI build-out (HUGO-73–81) |
| `98d7871` | R3F motel room scene (HUGO-20) |
| `8355317` | R3F 90s TV room product scene (HUGO-76) |
| `195e519` | UI cleanup pass (nav dedupe, TVGrid ornamental controls) |
| `65fb88e` | Integration test results doc |
| `3dd5e85` | **Fix: commit bayou video backgrounds (post-deploy patch)** |

Live at `ym-website-theta.vercel.app`.

---

## 2. The Production Issue You Just Spotted

**Symptom:** "Nothing is loading up on Vercel."

**Root cause:** The entire `public/` directory had **never been committed
to git**. Not once, across any branch. The video backgrounds
(`landing-bg-web.mp4`, `bayou-bg-web.mp4`) existed only on my local machine.
When Vercel built from main, it had no `public/` at all, so every request
to `/video/*` returned 404. Favicon also missing for the same reason.

**Evidence:**
- `git ls-files public/` returned empty
- `git log --all -- public/` returned empty (no history)
- `curl https://ym-website-theta.vercel.app/video/landing-bg-web.mp4 → 404`

**What you saw as "broken":** The landing page has a `<video>` element
pointing at `/video/landing-bg-web.mp4`. When that 404s, the video element
renders as a black rectangle. The hero text, Enter button, grain, and
vignette still render on top — but the cinematic bayou backdrop that
makes the page feel like Yunmakai is gone. Plain black = "broken".

The 3D scenes (/room, /tv/[handle]) render fine — they use R3F procedural
geometry, no asset files needed.

**Fix:** Committed both mp4 files (7.4MB + 23MB, both under GitHub's 50MB
warning threshold → no Git LFS needed). Pushed to main as `3dd5e85`.
Vercel rebuild triggered. Should be live within 1–3 minutes of that push.

**Sanity check after deploy:**
```
curl -o /dev/null -w "%{http_code}\n" \
  https://ym-website-theta.vercel.app/video/landing-bg-web.mp4
```
Should return `200`, not `404`.

### Still missing / not yet fixed
- **`/favicon.ico`** returns 404 — no favicon file exists. Cosmetic. Phase E.
- **Shopify store has 0 products** — `/tv` shows "No channels found" until
  real products are created in Shopify admin.
- **Supabase tracks table has 0 rows** — no audio to play.
- **No admin user exists** — waiting on you to sign up + promote via SQL.

---

## 3. Current State Summary

### Working ✅
- All Epic 11 routes compile, type-check, build clean, return 200 on prod
- Design system tokens applied site-wide (verified on prod HTML: `bg-void`,
  `text-smoke`, `aria-hidden`, `Signal`)
- Auth protection — `/account` 307s to `/sign-in` when unauthenticated
- Shopify + Supabase credentials load, APIs reachable
- R3F motel room scene on `/room` — procedural placeholder (floor, walls,
  bed, nightstand, TV cube, lamp cube) with working click-to-route
  interactions and orbit controls
- R3F 90s TV room scene on `/tv/[handle]` — procedural retro room (wood
  panels, carpet, CRT TV with product image texture, lamp, knobs) with
  image fallback when no product GLB exists
- Mobile fallback — `/room` still shows 2D hotspot grid on touch devices
- Admin auth + upload pipelines code-audited, all guards/validation in place
- Middleware session refresh runs, CSP headers tight

### Broken or Missing 🔴
- **Bayou video backgrounds** — FIXED (this commit), pending Vercel rebuild
- **Admin user** — no one has `role='admin'` yet. Blocks all admin tests.
- **Shopify products** — store is empty. Blocks `/tv`, `/tv/[handle]`, cart,
  checkout, orders.
- **Supabase tracks** — table empty. Blocks music player testing.
- **Custom 3D motel room** — the procedural placeholder is functional but
  not a real motel. You (correctly) want something custom and vibey.

### Low priority / Phase E
- `favicon.ico` missing
- `middleware.ts → proxy.ts` Next.js 16 deprecation warning
- `/tv/[handle]` returns HTTP 200 (not 404) for missing products in dev
- Admin UI uses old `zinc-*` tokens, not the new Southern Gothic Noir system
- Next.js 16 security advisories (HTTP smuggling, image cache DoS) —
  `npm audit fix` to address when Next 16.x.y lands
- Bayou water video polish (Ozark colour grade, CSS stars overlay)

---

## 4. The Custom 3D Problem — Real Answer

You want a **custom motel room vibe**, not a generic Sketchfab download. I
under-estimated that constraint earlier. Here's the honest landscape.

### Option A — Pay for it / commission it
**Fiverr / Upwork / ArtStation / r/gameassets** — a 3D artist can model a
custom motel room in 2–5 days for ~$100–$500. Best quality, slowest path.
You said Bruno is already on this track but not delivered. Do you want to
unblock Bruno (ping him, re-scope the brief) or go around him?

### Option B — AI text-to-3D generators (the interesting new option)
These services take a text prompt and generate a GLB. Quality is improving
fast. For a motel room, you'd either generate the whole room as one mesh
(single prompt) or generate individual props (bed, TV, lamp, dresser) and
assemble them in R3F/Blender.

| Service | URL | Notes |
|---|---|---|
| **Meshy** | meshy.ai | Free tier, good for props, OK for rooms |
| **Tripo3D** | tripo3d.ai | Strong on single objects |
| **Luma Genie** | lumalabs.ai/genie | Good quality, slower |
| **CSM.ai** | csm.ai | Scene-level generation, image-to-3D option |
| **Rodin (Hyper3D)** | hyper3d.ai | Highest quality on the market right now, paid |

**Recommendation within this bucket:** try **Meshy** first for props and
**Rodin** if you want a hero room mesh. The workflow is: generate → download
GLB → drop in `public/models/` → I wire it up same as Sketchfab.

### Option C — Kitbash from multiple free sources
Download a neutral "empty room" from one source, then grab individual props
(70s TV, bedside lamp, bed, dresser, framed motel artwork) from other
sources and position them in R3F or Blender. More control, more work.

### Option D — Spline Studio (visual editor)
You build it yourself in Spline's browser-based 3D editor, with their
primitive library + built-in materials. Export as GLB. Easier than Blender
because it's WYSIWYG. No code, no CLI. **Realistic for non-3D artists.**
Spline has free room/interior templates you can fork. Visit
community.spline.design and search "room" or "interior".

**Caveat from earlier:** Spline's exported GLBs are straightforward to load
with `useGLTF`, but their native `<spline-viewer>` runtime would require
widening our CSP (which we just hardened in HUGO-64). Export as **GLB
only**, don't embed the runtime — that's the clean path.

### Option E — Blender + Blender MCP (Claude-driven procedural)
**I could actually build you a custom motel room using the Blender MCP.**
You install Blender, set up the MCP, and I drive Blender to create the
scene piece by piece. Create walls, textured floor, import a free bed GLB
from Poly Haven, place a CRT TV mesh, add lamp, bake lighting, export GLB.

Pros: fully custom to your description, I can iterate on your direction
in the same conversation, no 3D skill needed on your part.

Cons: Blender install (~300MB), MCP setup (~10 min), learning curve on my
side (I've never driven this specific MCP in this conversation), slower
iteration loop than Spline.

### Communities you haven't mentioned yet
Beyond Sketchfab/Poly Haven/Quaternius:

- **Fab.com** — Epic Games' new unified marketplace (absorbed Sketchfab,
  Quixel Megascans, Unreal Marketplace, ArtStation Marketplace). Largest
  single library right now. Many free + paid. Login with Epic account.
- **Kenney.nl** — stylized low-poly packs, 100% free, consistent art
  direction. Search "Survival Kit", "Furniture Kit", "Room Kit". Not
  realistic, but highly cohesive.
- **OpenGameArt** — community game assets, mixed quality, CC licenses
- **Itch.io** (asset section) — indie asset packs, surprisingly strong
- **Smithsonian 3D** — CC0 museum scans (probably no motels but worth
  knowing)
- **Polycam community** — real-world room scans you can remix
- **LumaAI capture gallery** — NeRF-based scene captures
- **Thingiverse** — 3D printing community, mostly small props, but
  occasional interior sets

---

## 5. My Recommendation for Today

Given the constraint "custom motel room, today, no waiting on Bruno":

**Primary path: Spline + Sketchfab hybrid.**
1. You go to **community.spline.design**, search "motel", "hotel room",
   "interior", fork a base template you like, tweak colors/furniture in
   the visual editor (Spline Studio is fast once you know where the
   transform gizmos are — 30–60 minutes).
2. Export as **GLB only** (File → Export → glTF). Save to
   `public/models/room.glb`.
3. I wire it up via `useGLTF` + click handlers on named meshes. Same
   pipeline as my procedural placeholder — just swap `<ProceduralRoom />`
   for the new mesh.

**Fallback path: Meshy AI text-to-3D.**
1. Go to **meshy.ai**, prompt: *"A dimly lit southern gothic motel room,
   70s style, single bed, old CRT TV, wooden bedside table with lamp,
   amber light, moody, low poly game asset"*
2. Pick the best generation, download GLB. Might need a couple of tries.
3. Drop in `public/models/room.glb`, I wire it up.

**Parallel path (longer game): Bruno.**
Re-scope the brief to something simpler and smaller than what we asked
for initially. One room, one camera angle, clean named meshes for TV /
door / lamp / bed. No animations. Give him 3–5 days instead of waiting
indefinitely. If he delivers, hot-swap the Spline/Meshy result with
Bruno's later.

**Stop using the procedural placeholder as-is.** It's just for wiring
verification. Don't ship it to Yunmakai as the final look.

### What I'm NOT recommending today
- **Blender MCP** — too much setup overhead for a one-off room, and I can't
  guarantee driving it smoothly without a dedicated exploration session
- **Fiverr commission** — too slow for today, but good for Phase E polish
- **Building the motel in Three.js by hand** — we already have the
  procedural placeholder, going further with hand-coded geometry is dead
  time vs grabbing a Spline/Meshy GLB

---

## 6. Next Steps — In Order

### Immediate (next 5 min)
1. **[Verify the video fix is live]** Hit
   `https://ym-website-theta.vercel.app/video/landing-bg-web.mp4` → should
   return 200. Then load the landing page → should see the bayou backdrop.

### Short (next 15 min)
2. **[You] Admin user setup** — sign up, run the SQL promotion, confirm
   `/admin` loads. Paste any errors, I'll debug live.
3. **[Me] Smoke-test admin once you're in** — walk together through
   `/admin/tracks/new` → create test track → upload audio → toggle published.

### Today (next 1–2 hours)
4. **[You] Pick a 3D room source** — decide between Spline Studio (build
   yourself), Meshy (AI generate), or wait for Bruno. If Spline or Meshy,
   go get a GLB and save to `public/models/room.glb`.
5. **[Me] Wire the GLB** — once the file exists, I convert with gltfjsx,
   swap in `MotelRoomScene.tsx`, retune camera/lights, commit, push, verify.
6. **[Me] Wire a real GLB into TVRoomScene.tsx** — same pattern, retro room
   from Spline/Meshy, saved as `public/models/tv-room.glb`. Optional — the
   procedural CRT room might look good enough to ship for now.

### Data backfill (requires you + Shopify/Supabase admin)
7. **[You] Create 3 Shopify demo products** — at least one with real images,
   one with a `custom.glb_url` metafield (optional for now).
8. **[You] Upload 3 test audio files** to Supabase storage `audio` bucket
   via the admin panel we're about to test.
9. **[You] Link each track to a product** via the admin track form's
   ProductSelector.
10. **[Us together] Walk the purchase flow** — add to cart, checkout,
    verify Shopify webhook → Supabase order → `/account` history.
11. **[Us together] Walk the playback flow** — click play on a linked
    track, verify global audio player streams, test auth gate on a
    subscriber-only track.

### Phase E (tomorrow or later)
- Mobile responsive pass
- Bayou video colour-grade (Ozark palette, CSS stars overlay)
- Admin UI restyle to Southern Gothic Noir tokens
- Favicon + social OG image
- `middleware.ts → proxy.ts` rename
- Next.js security patch bump (`npm audit fix`)
- Full Playwright E2E suite
- Sentry instrumentation

---

## 7. Open Questions For You

1. **3D room source** — Spline (DIY visual editor), Meshy (AI generate),
   wait for Bruno, or a combination?
2. **Bruno status** — is he still delivering, blocked, or out?
3. **Shopify products** — can you seed 3 test products today, or should
   we defer commerce testing to tomorrow?
4. **Admin email** — what email will you sign up with, so I can watch
   for the right profile in SQL if anything goes sideways?
5. **Favicon** — do you have a mark/wordmark ready, or should I use a
   placeholder for now?

---

**TL;DR:** Videos were never committed, that's why prod looked dead. Fixed
and pushed. Admin code is solid and just needs a real admin user. For 3D,
the best fast-custom path is **Spline Studio + manual GLB export** or
**Meshy AI text-to-3D**, not waiting on Bruno. I'm ready to wire whichever
you pick the moment the file lands in `public/models/room.glb`.
