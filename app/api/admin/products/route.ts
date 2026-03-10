import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/shopify/products";

export async function GET() {
  // Verify admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { products } = await getProducts({ first: 100, sortKey: "TITLE" });

    const simplified = products.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      image: p.featuredImage?.url ?? null,
    }));

    return NextResponse.json(simplified);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
