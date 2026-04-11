# Yunmakai — Road to Complete

**Date:** 2026-04-11
**Goal:** Ship a functional, tested Yunmakai platform today. Client can sell merch, users can stream music, 3D motel room is live.

---

## 1. Where We Are

### Phase status
| Phase | Status |
|---|---|
| 0 — Dev monitoring (Playwright/DevTools MCP) | Config in place |
| A — Security (HUGO-57–65) | **Merged to main** |
| B — Prep & briefs | **Done** (briefs archived, Hugo removed, Bruno out) |
| C — Hardening (HUGO-64, 66–72) | **Merged to main** |
| D — UI build-out (HUGO-73–81) | **Built but uncommitted** on `feature/HUGO-73-design-system` (except HUGO-20) |
| E — Mobile + polish + testing | **Not started** |

### Git
- **Branch:** `feature/HUGO-73-design-system`
- **25 modified files, ~927 insertions / ~388 deletions** vs `main` — all Epic 11 UI work
- `public/` untracked contains only `.DS_Store` — no Bruno assets landed
- `from_client/` contains only the Solus Records PDF (handwritten client notes)

### Tech stack reality check
- Next.js 16 / React 19 / Tailwind v4 / TypeScript
- Supabase (auth + DB + storage), Shopify Storefront + Cart API, Stripe (dormant)
- `@google/model-viewer` **is** installed (product GLB viewer works)
- `@react-three/fiber` / `@react-three/drei` / `three` **are NOT installed** — memory was stale
- CSP hardened in HUGO-64 (no `unsafe-eval`) — favours local R3F over Spline embeds

---

## 2. What's Built and Working

### Backend / infra (merged to main)
- Supabase auth (passwordless), schema, RLS policies hardened (HUGO-24)
- Shopify Storefront + Cart client (lazy init)
- Shopify webhook with Zod validation (HUGO-67)
- Stripe SDK skeleton, lazy init, dormant
- Admin dashboard with auth guards (HUGO-60)
- GitHub Actions CI: type-check, lint, build (HUGO-63)
- CSP, MIME validation, atomic track creation, cart retry, global-error boundary, middleware webhook exclusion, audio-player perf split

### UI / Epic 11 (on branch, built, unmerged)
| Ticket | File(s) | State |
|---|---|---|
| HUGO-73 Design system | `app/globals.css` — Southern Gothic Noir tokens (void/abyss/bone/amber/teal/moss/rust, grain, vignette, CRT scanlines, fog, btn/card/input, animations) | Complete, used site-wide |
| HUGO-74 Landing | `components/env/LandingEnvironment.tsx` + `public/video/landing-bg-web.mp4` | Video bayou bg, animated hero, enter → `/room` |
| HUGO-75 TV catalogue | `app/tv/page.tsx`, `TVGrid.tsx`, `TVCard.tsx` | Real Shopify data, search, scanlines, channel-number CRT look |
| HUGO-76 Product page | `app/tv/[handle]/page.tsx`, `ProductScreen.tsx`, `ProductControls.tsx` | Variants, pricing, add-to-cart, GLB via `<model-viewer>` w/ image fallback |
| HUGO-77 Nav + transitions | `WalkthroughNav.tsx` + `useEnvStore` fade-to-black | Global nav, active route highlight, transition store |
| HUGO-78 Credits overlay | `CreditsOverlay.tsx`, `app/credits/page.tsx` | Rolling movie-credits, bayou bg |
| HUGO-79 Cart | `CartPanel.tsx`, `CartButton.tsx`, `CartItem.tsx` | Slide-out drawer, Zustand sync, Shopify hosted checkout |
| HUGO-80 Account/auth | `app/account/*`, `app/sign-in/*`, `components/account/*` | Protected route, sign-in, order history, Supabase-backed |
| HUGO-81 Global audio player | `GlobalAudioPlayer.tsx`, `ProgressBar.tsx`, `TrackList.tsx` | Persistent bottom player, seekable, volume, product-tied tracks via `useMusicStore` |

---

## 3. What's Broken / Missing

### The actual gap: HUGO-20 — 3D motel room
- `RoomEnvironment.tsx` currently a **2D gradient placeholder** with percent-positioned CSS hotspots (`HotspotZone.tsx`) for TV and credits
- No R3F / Three.js in the bundle
- Navigation wiring IS in place (`useEnvStore.startTransition()`, `/room` route, hotspot → route handlers), so the 3D scene just needs to replace the gradient div and re-attach click handlers to 3D meshes

### Scope decisions made today (2026-04-11)
- **Asset 1 (bayou water shader): DROPPED.** Keep the existing `.mp4`. Later polish pass: colour-grade it toward Ozark palette, overlay CSS stars, subtle hue shift. Logged in Phase E.
- **Asset 2 (3D motel room): DOING TODAY.** R3F + Sketchfab GLB + click-handlers on named meshes. Nav hub.
- **Asset 3 (90s TV room — product display): DOING TODAY.** This is the *display surface* for Yunmakai's 3D-printed goods (client-provided GLBs via Shopify metafield). Architecture:
  - `/tv` index stays a flat Shopify catalogue grid (SEO + a11y + low bundle)
  - `/tv/[handle]` product detail becomes the immersive 90s TV room — R3F scene, retro CRT TV prop as hero, product GLB rendered on/inside the screen, room dressing (wood panel walls, shag carpet, lamp) around it
  - Existing `ProductScreen.tsx` + `ProductControls.tsx` split stays: left canvas = 3D TV room, right panel = variants + add-to-cart (keep 2D for conversion UX)

### Other gaps
- **25 uncommitted files** on current branch — commit risk
- **Zero end-to-end integration testing** done with real Supabase + Shopify data (per `testing_phase_plan.md`)
- **Mobile pass not started** (HUGO-22, Phase E)
- **Demo Shopify products** — need at least 2–3 real products (title, price, variants, optional GLB metafield) to test the buy flow
- **Demo Supabase tracks** — need at least 2–3 audio files in Supabase storage linked to those products via the many-to-many mapping to test the music flow

---

## 4. Execution Plan — Today

### Step 0 — Lock in current work (≈5 min)
Commit what exists so HUGO-20 has a clean base.
```
git add -A
git commit -m "feat(ui): Epic 11 UI build-out — design system + all page UIs [HUGO-73..HUGO-81]"
git push origin feature/HUGO-73-design-system
```
Open PR against `main`, or merge directly if solo.

### Step 1 — HUGO-20: 3D motel room (≈60–90 min)
New branch: `feature/HUGO-20-3d-room`

1. **Install deps**
   ```
   npm i three @react-three/fiber @react-three/drei
   npm i -D @types/three
   ```
   Verify React 19 compat (R3F v9+).

2. **Source a GLB.** Sketchfab → tag `motel-room` / `hotel-interior` → filter **Downloadable + CC0/CC-BY** → sort by low poly (<200k tris). Candidates to vet:
   - Any CC-BY "motel room" scan (prefer with named meshes: `tv`, `bed`, `door`, `lamp`, `window`)
   - Fallback: Quaternius stylized room pack (consistent art direction, tiny file size)
   - Save downloaded file to `public/models/room.glb`

3. **Convert to JSX**
   ```
   npx gltfjsx public/models/room.glb -o components/three/Room.tsx -t
   ```
   Typed component with preserved mesh names.

4. **Build the scene.** New file `components/three/MotelRoomScene.tsx`:
   - `<Canvas camera={{ fov: 50, position: [0, 1.6, 4] }}>`
   - `<Suspense fallback={<LoadingScreen />}>`
   - `<Environment preset="night" />` (warm amber matches brand)
   - `<Room />` — auto-generated
   - `<OrbitControls enableZoom={false} minPolarAngle={Math.PI/3} maxPolarAngle={Math.PI/2.1} />` — pan only, no ceiling/floor escape
   - `<fog attach="fog" args={["#0a0a0a", 5, 20]} />` — bayou mist baked into the scene
   - Click handlers on the named meshes via `onPointerDown` → `useEnvStore.startTransition()`:
     - `tv` mesh → `router.push('/tv')`
     - `door` mesh → `router.push('/credits')` (or back to landing)
     - `lamp` mesh → open credits overlay
   - Cursor change on hover via `onPointerOver` / `onPointerOut`

5. **Swap RoomEnvironment.tsx.** Replace the gradient div with `<MotelRoomScene />`. **Keep** the grain + vignette overlay divs — they stack on top of the canvas. **Keep** the existing mobile hotspot fallback under `md:hidden` using a pre-rendered PNG screenshot of the 3D scene at `public/room-fallback.webp` — touch ergonomics on mobile R3F are painful and this is shippable today.

6. **Perf sanity.** Set `dpr={[1, 1.5]}` on Canvas, `performance.min={0.5}` on drei, lazy-load the scene with `dynamic(() => import(...), { ssr: false })` so it doesn't bloat SSR.

7. **Smoke test locally.** `npm run dev`, click TV → transitions to `/tv`, click credits mesh → overlay fires, check bundle size didn't explode.

8. **Commit + merge**
   ```
   git commit -m "feat(3d): R3F motel room scene with click-to-route meshes [HUGO-20]"
   ```

### Step 1b — HUGO-76 extension: 90s TV room product scene (≈60–90 min)
Same branch or new branch `feature/HUGO-76-3d-tv-room` — decide based on how Step 1 lands.

1. **Source assets.** Two GLB options:
   - **Preferred:** one GLB containing the whole retro TV room (wood panels, carpet, CRT TV, side table, lamp) with the TV screen as a named mesh `tv_screen` we can target. Sketchfab tag `retro-living-room` / `80s-tv-room` / `crt-tv`, CC0/CC-BY, low poly.
   - **Fallback:** individual props — CRT TV model + bare room box we skin with textures from Poly Haven (wood, carpet). More work, more control.
   - Save to `public/models/tv-room.glb` (and product GLBs stay wherever Shopify metafields point).

2. **Convert:** `npx gltfjsx public/models/tv-room.glb -o components/three/TVRoom.tsx -t`

3. **Build `components/three/TVRoomScene.tsx`:**
   - `<Canvas camera={{ fov: 35, position: [0, 1.4, 3.5] }}>` — tighter FOV for CRT hero framing
   - `<Environment preset="apartment" />` + warm point light near the lamp mesh for amber glow matching brand
   - `<TVRoom />` static room geometry
   - `<ProductOnTV glbUrl={product.glbUrl} screenMeshName="tv_screen" />` — custom component that:
     - Loads the product GLB with `useGLTF(glbUrl)`
     - Finds the `tv_screen` mesh's world position + bounds from `TVRoom`
     - Positions + scales the product GLB to sit *on top of* the screen plane (like a toy/figurine on the TV, not rendered inside)
     - Or alternatively: renders the product GLB onto the screen plane as a texture via `useFBO` render target — more complex, defer unless time permits
   - Very subtle rotation on the product (`useFrame` → `product.rotation.y += 0.003`) so it's clearly 3D
   - `<OrbitControls enableZoom enableRotate minDistance={2} maxDistance={5} minPolarAngle={Math.PI/3.5} maxPolarAngle={Math.PI/2.1} target={tvScreenPosition} />` — user can orbit around the TV but camera locks on the product
   - `<fog args={["#0a0a0a", 3, 10]} />` — shallow depth fog to isolate the TV visually
   - Grain/vignette/scanlines overlays stay in the 2D layer on top of the canvas

4. **Graceful degradation.** If `product.glbUrl` is null (most early products will be), render the product's first Shopify image onto the TV screen as a texture plane. That way the 3D TV room scene ALWAYS works, even before Yunmakai delivers GLBs for every SKU. Users never see a broken screen.

5. **Rewire `ProductScreen.tsx`:** Replace the current `<model-viewer>` / image carousel with `<TVRoomScene product={product} />`. Keep the fallback path: if WebGL isn't supported or scene fails to load, fall back to the existing 2D image carousel.

6. **Keep `ProductControls.tsx` untouched** on the right side — variants, price, add-to-cart stay 2D for conversion UX. The "control panel" interactivity from the original brief is already this component, just styled to look like a retro TV remote/control box in Step 2 (UI cleanup).

7. **Perf.** Dynamic-import `TVRoomScene` with `ssr: false`. Share R3F Canvas settings + dpr cap with the motel room scene via a tiny `lib/r3f-defaults.ts` helper. Preload the `tv-room.glb` on `/tv` hover so transition into `/tv/[handle]` is snappy.

8. **Smoke test.** Load 3 products:
   - One with a real GLB metafield → product model sits on TV
   - One without GLB → product image renders on TV screen
   - One with a broken GLB URL → fallback to image, no crash

9. **Commit**
   ```
   git commit -m "feat(3d): 90s TV room product display scene — hero Yunmakai GLBs in retro CRT context [HUGO-76]"
   ```

### Step 2 — UI Cleanup Pass (≈45–60 min)
Walk every Epic 11 page with dev tools + real data:

- **Landing** — check enter button animation delays, verify bayou video loops seamlessly, confirm mobile text doesn't overflow
- **Room** — 3D scene loads, hotspots work desktop + mobile, transitions smooth
- **TV catalogue** — Shopify grid renders all products, search filters, card hover states, empty state
- **Product page** — 3D TV room scene loads, product GLB sits on CRT screen (or image fallback renders), orbit controls feel right, `ProductControls` panel styled as retro TV remote/control box, variants + add-to-cart work, no z-index fight between canvas + controls
- **Cart panel** — slide-out animation, qty controls, totals match Shopify, checkout button → hosted checkout
- **Account** — protected redirect, order history renders, sign-out works
- **Sign-in** — passwordless flow, error states, redirect on success
- **Credits** — rolling animation loops, no jank
- **Global audio player** — persistent across routes, play/pause, seek, volume, track switching

Fix any broken design-token usage, dead code, z-index conflicts, focus rings missing. Don't refactor — just make it not-embarrassing.

### Step 3 — Integration Testing (≈60–90 min)
The real "does this work" pass. Per `testing_phase_plan.md`.

#### Shopify commerce flow
1. In Shopify admin (Solus Records store), create/verify at least **3 demo products**:
   - Yunmakai merch piece A (with variants, with image)
   - Yunmakai merch piece B (simple, one variant)
   - Yunmakai merch piece C (with `glb_url` metafield pointing at a test GLB — could be a Sketchfab CC0 download saved to Supabase storage public bucket)
2. Confirm products appear in `/tv` grid
3. Click through to each product page — verify title, price, description, variants, images
4. Add product A to cart, adjust qty, verify cart totals match
5. Click checkout → confirm it reaches Shopify hosted checkout
6. Complete a **test order** with Shopify test gateway / Bogus Gateway
7. Verify Shopify webhook fires → Supabase `orders` table gets the record (check via Supabase dashboard)
8. Sign into the same account used for checkout → `/account/orders` shows the order
9. Unclaimed-order linking (HUGO-38) — if guest checkout then sign-up with same email, order should link

#### Music playback flow
1. In Supabase storage, upload **3 test audio files** (`.mp3` or `.wav`) to the tracks bucket
2. In admin panel (`/admin/tracks`), create 3 track records pointing at those files
3. Link each track to at least one product via the many-to-many mapping
4. On a product page, `TrackList.tsx` should show the linked tracks
5. Click play → `GlobalAudioPlayer` mounts/starts, signed URL fetched, audio plays
6. Verify **auth-gated streaming** (HUGO-43): sign out, try to stream a gated track, confirm it 401s
7. Seek forwards/back, pause, resume, switch tracks, volume, mute
8. Navigate to another route while playing — audio should persist (global player)

#### Auth flow
1. Sign up new user → magic link email received → click → session established
2. Protected route redirect (`/account` when signed out → `/sign-in`)
3. Sign out → session cleared → protected routes redirect again
4. Open redirect fix (HUGO-42) — try `?returnTo=https://evil.com` → should reject

#### Error states
1. Hit `/tv/does-not-exist` → 404 or error boundary, not a crash
2. Disable network mid-checkout → global-error.tsx catches
3. Shopify API down (simulate by killing token temporarily) → graceful message

### Step 4 — Commit, merge, deploy (≈10 min)
1. Commit all fixes from Steps 2–3 with tight messages per area
2. Merge `feature/HUGO-20-3d-room` into `main`
3. Push → Vercel auto-deploys to `ym-website-theta.vercel.app`
4. Smoke-test production URL with the same flows from Step 3
5. Update Linear: close HUGO-20, HUGO-73–81, and any Phase D ticket still open

---

## 5. Ship Criteria — Done Looks Like

- [ ] All Epic 11 tickets (HUGO-73–81) closed on Linear
- [ ] HUGO-20 closed — 3D motel room live on `/room`
- [ ] HUGO-76 3D TV room scene live on `/tv/[handle]` with product GLBs rendering + image fallback working
- [ ] `main` branch clean, deployed to production, no build errors
- [ ] A real test purchase completed end-to-end (cart → Shopify checkout → order lands in Supabase → visible in `/account`)
- [ ] A real audio stream played end-to-end with auth gating verified
- [ ] No console errors on any Epic 11 page in production
- [ ] Mobile fallback renders for `/room` on touch devices
- [ ] CSP clean, security hardening intact (no regressions from R3F install)

---

## 6. Deferred to Phase E (Not Today)

- **HUGO-22** — Mobile optimization pass across all pages
- **Landing water polish** — colour-grade bayou video toward Ozark palette, overlay CSS stars, subtle hue shift
- **Full responsive sweep** with Playwright across 3+ viewports
- **Chrome DevTools perf traces** on every route
- **Bruno's eventual GLB** — if/when it lands, hot-swap `public/models/room.glb` and re-run gltfjsx. The scene wiring survives the swap.
- **Stripe activation** (currently dormant)
- **Sentry / observability** (HUGO-62 deferred)
- **Rate limiter** (HUGO-58 deferred)

---

## 7. Known Risks

| Risk | Mitigation |
|---|---|
| R3F v9 + React 19 compat issue | Fallback to `@splinetool/react-spline` as an escape hatch, or delay HUGO-20 and commit Epic 11 standalone |
| Sketchfab GLB has no named meshes for click targets | Use drei `<Html>` overlays anchored to mesh positions instead of mesh raycast |
| Test purchase fails silently | Check Shopify webhook logs, Supabase `orders` table, server logs |
| Audio won't play (autoplay policy) | Explicit play button already in place per critical decision — should be fine |
| Bundle bloat from R3F | Dynamic import the Canvas, code-split `/room` route |
| CSP blocks something unexpected after R3F install | Check browser console; R3F is all local so CSP should be fine, but worst case widen `script-src 'self'` |
