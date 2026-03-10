import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { linkUnclaimedOrders } from "@/lib/supabase/orders";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/room";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Fire-and-forget: link any unclaimed guest orders to this user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        linkUnclaimedOrders(user.id, user.email).catch(() => {
          // Non-critical — silently ignore if linking fails
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code exchange failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?message=Could not verify your email`);
}
