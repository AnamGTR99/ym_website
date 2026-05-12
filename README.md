# Yunmakai

An immersive digital universe combining interactive 3D scenes, music streaming, and e-commerce. Visitors explore a stylized motel room rendered in real-time 3D, discover music releases with authenticated streaming, and purchase physical and digital products through a headless Shopify storefront.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict mode)
- **Styling:** Tailwind CSS 4 with custom design tokens
- **3D:** React Three Fiber, drei, postprocessing (Three.js 0.172)
- **State Management:** Zustand
- **Database and Auth:** Supabase (Postgres, Auth, Storage)
- **Commerce:** Shopify Storefront API (GraphQL)
- **Hosting:** Vercel

## Getting Started

```bash
# Clone the repository
git clone https://github.com/AnamGTR99/ym_website.git
cd ym_website

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in all required credentials in .env.local (see Environment Variables below)

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

| Command            | Description                  |
| ------------------ | ---------------------------- |
| `npm run dev`      | Start development server     |
| `npm run build`    | Create production build      |
| `npm run start`    | Serve production build       |
| `npm run lint`     | Run ESLint                   |
| `npm run format`   | Format code with Prettier    |

## Project Structure

```
app/                  Next.js App Router (routes, layouts, API routes)
  (root)/             Root layout, landing page, global styles
  admin/              Admin dashboard (role-gated)
  room/               3D motel room scene
  tv/                 Product catalog (Shopify storefront)
  api/                API routes (streaming, webhooks, uploads)
components/           React components organized by feature
  three/              React Three Fiber scenes
  music/              Audio player and track listing
  cart/               Shopping cart UI
  admin/              Admin forms and tables
  ui/                 Shared UI primitives
lib/                  Domain utilities and API clients
  supabase/           Supabase client (browser + server), queries
  shopify/            Shopify GraphQL client, product and cart queries
  auth/               Authentication actions, hooks, guards
  streaming/          Signed URL generation for audio streams
stores/               Zustand stores (auth, cart, music, environment)
public/               Static assets, 3D models (GLB), Draco decoder
supabase/migrations/  Database migration files
```

## Key Features

**3D Motel Room Scene** -- An interactive 3D environment built with React Three Fiber. Visitors navigate the scene and interact with hotspots (TV, poster, lamp) to access different sections of the site. Post-processing effects include bloom, vignette, and chromatic aberration.

**Music Streaming** -- Authenticated audio streaming using signed Supabase Storage URLs with a 120-second TTL. The global audio player manages playback state, auto-refreshes URLs before expiry, and is rate-limited to 30 requests per minute per IP.

**Headless Commerce** -- Product catalog and cart powered by the Shopify Storefront API via GraphQL. Cart state is persisted in Zustand with localStorage. Cart mutations use a mutex queue to prevent race conditions. Checkout redirects to Shopify hosted checkout.

**Admin Dashboard** -- Accessible at `/admin`, protected by role-based access control. Manages audio tracks (upload, metadata, linked products) and syncs product data from Shopify.

## Environment Variables

All required environment variables are documented in `.env.example`. Copy it to `.env.local` and fill in credentials before running the application.

Required services:

- **Supabase** -- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Shopify** -- `NEXT_PUBLIC_SHOPIFY_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_API_SECRET`, `SHOPIFY_WEBHOOK_SECRET`
- **Site** -- `NEXT_PUBLIC_SITE_URL`

Never commit `.env.local` to version control.

## Database

The application uses Supabase (Postgres) with Row Level Security (RLS) enforced on all tables. RLS policies are the primary access control layer.

Migration files are located in `supabase/migrations/` and are numbered sequentially. Apply migrations through the Supabase CLI or dashboard.

## Deployment

The application is deployed on Vercel. The `vercel.json` configuration file includes security headers and Content Security Policy settings.

To deploy:

1. Connect the repository to a Vercel project.
2. Set all required environment variables in the Vercel dashboard.
3. Deploy from the `main` branch.

## License

UNLICENSED. All rights reserved.
