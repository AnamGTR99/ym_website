export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import OrderHistory from "@/components/account/OrderHistory";
import AccountSettings from "@/components/account/AccountSettings";

interface OrderRow {
  id: string;
  shopify_order_number: string;
  email: string;
  total_price: string;
  currency: string;
  line_items: {
    title: string;
    quantity: number;
    price: string;
    variant_title: string | null;
  }[];
  status: string;
  created_at: string;
}

export default async function AccountPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="grain min-h-screen px-4 pt-6 pb-12 bg-void">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-10 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-widest text-bone">
              Account
            </h1>
            <p className="text-sm text-fog mt-1">{user.email}</p>
          </div>
          <Link
            href="/room"
            className="text-xs font-mono text-fog hover:text-amber transition-colors"
          >
            ← Back to Room
          </Link>
        </div>

        <AccountSettings email={user.email ?? ""} />

        <OrderHistory orders={(orders as OrderRow[]) ?? []} />
      </div>
    </main>
  );
}
