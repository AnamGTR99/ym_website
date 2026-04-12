# Yunmakai Website

Immersive digital universe combining interactive 3D scenes, music streaming, and e-commerce. Southern Gothic Noir aesthetic (Ozark / Twin Peaks / motel photography).

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript strict mode, React 19)
- **Styling**: Tailwind CSS 4 with custom design tokens in `app/(root)/globals.css`
- **3D**: React Three Fiber + drei + postprocessing (Three.js 0.172)
- **State**: Zustand stores in `stores/` (auth, cart, music, env)
- **Database**: Supabase (Postgres + Auth + Storage). Migrations in `supabase/migrations/`
- **Commerce**: Shopify Storefront API (GraphQL, 2025-01). Stripe is present but dormant
- **Hosting**: Vercel

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint (next lint)
npm run format    # Prettier
```

## Project Structure

```
app/              # App Router routes, layouts, API routes
  (root)/         # Root layout, landing page, globals.css
  admin/          # Admin dashboard (role-gated)
  room/           # 3D motel room scene
  tv/             # Product catalog (Shopify)
  api/            # API routes (streaming, webhooks, admin uploads)
components/       # React components by feature
  three/          # R3F scenes (MotelRoomScene, TVRoomScene)
  music/          # GlobalAudioPlayer, TrackList
  cart/           # CartPanel, CartButton
  env/            # Scene environment wrappers
  admin/          # Admin forms and tables
  ui/             # Shared UI (FloatingUI, navigation)
lib/              # Domain utilities
  supabase/       # Client/server clients, track queries, RLS helpers
  shopify/        # GraphQL client, product/cart queries, types
  auth/           # Server actions, hooks, guards
  streaming/      # Stream URL fetching
stores/           # Zustand stores (auth, cart, music, env)
public/models/    # GLB files (motel room)
supabase/         # Database migrations (001-011)
NEW_STRAT/        # Planning docs (not production code)
```

## Key Architecture

### Authentication
Supabase Auth with cookie-based sessions. Middleware (`middleware.ts`) refreshes sessions and protects `/admin` routes. Auth state lives in `stores/auth.ts`. Admin checks use `requireAdmin()` / `requireAdminApi()` from `lib/auth/guards.ts`.

### Audio Streaming
API route `/api/tracks/[id]/stream-url` generates signed Supabase Storage URLs (120s TTL). Music store (`stores/music.ts`) manages playback via a singleton `HTMLAudioElement` and auto-refreshes URLs 30s before expiry. Rate limited to 30 req/min per IP.

### 3D Scenes
GLB models loaded via `useGLTF` with Draco decoder at `/public/draco/`. Interactive hotspots in the motel room must use exact mesh names: `Room`, `TV`, `TV_Screen`, `Poster`, `Lamp`. Post-processing stack: Bloom, Vignette, ChromaticAberration, custom SplitToningEffect. GLB budget: <5MB, 50-100k triangles, PBR metallic-roughness.

### E-Commerce
Shopify Storefront API via GraphQL (`lib/shopify/client.ts`). Cart stored in Zustand with localStorage persistence (cart_id). Cart mutations use a mutex queue to prevent race conditions. Checkout redirects to Shopify hosted checkout.

### Data Fetching
- **Supabase**: Direct queries with RLS enforcement. Server actions use SSR client; API routes use admin client (service role key)
- **Shopify**: Client-side GraphQL with public storefront token
- Server components are default; client components marked with `"use client"`

## Design System

Fonts: IBM Plex Sans (body) + JetBrains Mono (display/mono). Color tokens defined as CSS custom properties in `globals.css`: void/abyss/soot/charcoal (neutrals), amber (lamp light), teal (neon), moss (decay), rust (aged metal). Custom easing curves and glow shadows.

## Environment Variables

Required in `.env.local` (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SHOPIFY_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_API_SECRET`, `SHOPIFY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`

## Guidelines

- Preserve the Southern Gothic Noir aesthetic in all UI work
- Hotspot mesh names in GLB files are load-bearing — do not rename without updating `MotelRoomScene.tsx`
- Audio uploads validate MIME via magic bytes, not file extension
- Security headers and CSP are configured in `vercel.json`
- RLS policies are the primary access control layer for Supabase data
- After every code change, restart the dev server with cache clear: `pkill -f "next dev" && rm -rf .next && npx next dev -p <port>`. HMR is unreliable for R3F/Three.js components
