import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { linkUnclaimedOrders, grantEntitlementsForUser } from "@/lib/supabase/orders";
import { sanitizeRedirect } from "@/lib/auth/sanitize-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Fire-and-forget: link any unclaimed guest orders to this user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        linkUnclaimedOrders(user.id, user.email)
          .then(() => grantEntitlementsForUser(user.id))
          .catch(() => {
            // Non-critical — silently ignore if linking/granting fails
          });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code exchange failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?message=error`);
}
