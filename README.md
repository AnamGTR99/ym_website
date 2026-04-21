# Yunmakai

An immersive digital universe where music releases and physical/digital products are experienced together inside an interactive environment.

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Auth & Data:** Supabase (Postgres, Auth, Storage)
- **Commerce:** Shopify Storefront API + Cart API
- **3D:** `<model-viewer>` (GLB)
- **Hosting:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your credentials in .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/              → Next.js App Router pages and layouts
lib/              → Shared utilities, API clients, stores
  supabase/       → Supabase client (browser + server)
  shopify/        → Shopify Storefront API client + queries
  stores/         → Zustand stores
  utils/          → Shared utilities
components/       → React components
  ui/             → Reusable UI primitives
  environment/    → Landing, Room, TV, Product scenes
  audio/          → Music player components
public/           → Static assets and placeholders
docs/             → Project documentation
```

## Environment

Copy `.env.example` to `.env.local` and fill in credentials. Never commit `.env.local`.
