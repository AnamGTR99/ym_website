import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, etc.)
     * - API webhook routes (no user session exists)
     * - API health route
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|glb|gltf|wasm|hdr|bin)$).*)",
  ],
};
